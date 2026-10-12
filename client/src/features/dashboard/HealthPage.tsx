import { useEffect, useState } from 'react';
import { getHealth } from '../../api/health';
import type { HealthResponse } from '../../types';
import { CheckCircle2, XCircle, RefreshCw } from 'lucide-react';

export const HealthPage = () => {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getHealth();
      setHealth(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Impossible de joindre le backend');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHealth();
  }, []);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="border-b border-border-subtle pb-4">
        <h1 className="text-2xl font-heading font-bold text-text-primary">
          Santé et Connectivité Système
        </h1>
        <p className="text-sm font-sans text-text-secondary mt-1">
          Surveillance de l'état du serveur backend Django REST Framework.
        </p>
      </div>

      <div className="bg-surface-card rounded border border-border-subtle p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-heading font-semibold text-text-primary">
            État de connexion au serveur backend (Django)
          </h2>
          <button
            onClick={loadHealth}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-sans rounded bg-surface-secondary hover:bg-border-subtle text-text-primary transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
        </div>

        <div className="text-sm font-sans text-text-secondary">
          Endpoint ciblé :{' '}
          <code className="px-1.5 py-0.5 rounded bg-surface-secondary text-text-primary font-mono text-xs">
            /api/v1/health/
          </code>
        </div>

        {loading ? (
          <div className="flex items-center gap-3 p-4 rounded bg-surface-secondary text-text-secondary text-sm font-sans">
            <RefreshCw className="w-5 h-5 animate-spin text-accent" />
            <span>Vérification de la connectivité backend en cours...</span>
          </div>
        ) : error ? (
          <div className="flex items-start gap-3 p-4 rounded bg-surface-secondary border border-status-alert/30 text-status-alert text-sm font-sans">
            <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Échec de communication avec l'API Django</p>
              <p className="text-xs text-text-secondary mt-1">{error}</p>
              <p className="text-xs text-text-secondary mt-1">
                Vérifiez que le serveur Django est démarré sur <code className="font-mono">http://localhost:8000</code>.
              </p>
            </div>
          </div>
        ) : health ? (
          <div className="flex items-start gap-3 p-4 rounded bg-surface-secondary border border-status-success/30 text-status-success text-sm font-sans">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-status-success">
                Connexion backend établie avec succès
              </p>
              <p className="text-xs text-text-secondary">
                Service : <strong className="text-text-primary">{health.service}</strong> • Version :{' '}
                <strong className="text-text-primary">{health.version}</strong>
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
