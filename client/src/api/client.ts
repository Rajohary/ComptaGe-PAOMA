import type { ApiError } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
}

export class ApiClientError extends Error {
  public status: number;
  public data: ApiError;

  constructor(status: number, data: ApiError) {
    super(data.detail || `Erreur API (${status})`);
    this.name = 'ApiClientError';
    this.status = status;
    this.data = data;
  }
}

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

export const apiClient = async <T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> => {
  const { requiresAuth = true, headers = {}, ...rest } = options;
  const token = localStorage.getItem('access_token');

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string>),
  };

  if (requiresAuth && token) {
    requestHeaders['Authorization'] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  let response = await fetch(url, {
    ...rest,
    headers: requestHeaders,
  });

  // Handle 401 Unauthorized & Token Refresh
  if (response.status === 401 && requiresAuth) {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.dispatchEvent(new Event('auth:unauthorized'));
      throw new ApiClientError(401, { detail: 'Session expirée' });
    }

    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const refreshResponse = await fetch(`${API_BASE_URL}/api/v1/auth/refresh/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh: refreshToken }),
        });

        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          localStorage.setItem('access_token', data.access);
          if (data.refresh) {
            localStorage.setItem('refresh_token', data.refresh);
          }
          processQueue(null, data.access);
          requestHeaders['Authorization'] = `Bearer ${data.access}`;
          response = await fetch(url, { ...rest, headers: requestHeaders });
        } else {
          processQueue(new Error('Refresh failed'), null);
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.dispatchEvent(new Event('auth:unauthorized'));
          throw new ApiClientError(401, { detail: 'Session expirée' });
        }
      } catch (err) {
        processQueue(err, null);
        throw err;
      } finally {
        isRefreshing = false;
      }
    } else {
      // Attendre que le refresh en cours se termine
      await new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      });
      const newToken = localStorage.getItem('access_token');
      if (newToken) {
        requestHeaders['Authorization'] = `Bearer ${newToken}`;
        response = await fetch(url, { ...rest, headers: requestHeaders });
      }
    }
  }

  if (!response.ok) {
    let errorData: ApiError;
    try {
      errorData = await response.json();
    } catch {
      errorData = { detail: response.statusText || 'Erreur réseau inconnue' };
    }
    throw new ApiClientError(response.status, errorData);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
};
