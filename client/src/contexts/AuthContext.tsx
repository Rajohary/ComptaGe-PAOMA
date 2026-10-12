import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import type { User, UserRole, LoginRequest } from '../types';
import { login as apiLogin, logout as apiLogout, getMe } from '../api/auth';
import { ApiClientError } from '../api/client';

interface AuthContextType {
  /** Utilisateur connecté, ou null si non authentifié */
  user: User | null;
  /** Rôle de l'utilisateur courant (raccourci de user.role) */
  role: UserRole | null;
  /** True pendant le chargement initial (vérification du token existant) */
  isLoading: boolean;
  /** True si l'utilisateur est authentifié */
  isAuthenticated: boolean;
  /** Erreur de la dernière tentative de connexion */
  loginError: string | null;
  /** True pendant une tentative de connexion */
  isLoggingIn: boolean;
  /** Connecter un utilisateur */
  login: (credentials: LoginRequest) => Promise<void>;
  /** Déconnecter l'utilisateur */
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const initialCheckDone = useRef(false);

  // Vérifier si un token valide existe au montage (restauration de session)
  useEffect(() => {
    if (initialCheckDone.current) return;
    initialCheckDone.current = true;

    const token = localStorage.getItem('access_token');
    if (!token) {
      setIsLoading(false);
      return;
    }

    getMe()
      .then((userData) => {
        setUser(userData);
      })
      .catch(() => {
        // Token invalide ou expiré — le rafraîchissement est déjà géré dans apiClient,
        // si ça échoue ici c'est que la session est définitivement expirée
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setUser(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  // Écouter l'événement auth:unauthorized émis par le client API
  // quand le rafraîchissement échoue
  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = useCallback(async (credentials: LoginRequest) => {
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      const response = await apiLogin(credentials);
      localStorage.setItem('access_token', response.access);
      localStorage.setItem('refresh_token', response.refresh);
      setUser(response.user);
    } catch (err) {
      if (err instanceof ApiClientError) {
        // Erreurs métier du backend (identifiants invalides, etc.)
        setLoginError(err.data.detail || 'Identifiants incorrects.');
      } else {
        setLoginError('Impossible de joindre le serveur. Vérifiez votre connexion.');
      }
      throw err;
    } finally {
      setIsLoggingIn(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } catch {
      // Ignorer silencieusement — on déconnecte localement quoi qu'il arrive
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
    }
  }, []);

  const value: AuthContextType = {
    user,
    role: user?.role ?? null,
    isLoading,
    isAuthenticated: !!user,
    loginError,
    isLoggingIn,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
};
