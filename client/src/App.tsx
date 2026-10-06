import { useEffect, useState } from 'react';
import { getHealth } from './api/health';
import type { HealthResponse } from './types';
import { useTheme } from './contexts/ThemeContext';
import { CheckCircle2, XCircle, RefreshCw, Moon, Sun } from 'lucide-react';

export default function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { theme, toggleTheme } = useTheme();

  const fetchHealth = async () => {
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
    fetchHealth();
  }, []);

  return (
    <div className="min-h-screen bg-surface-primary text-text-primary p-6 md:p-12 transition-colors duration-200">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigation contextuelle / Header */}
        <header className="flex items-center justify-between border-b border-border-subtle pb-6">
          <div>
            <div className="text-sm font-sans text-text-secondary uppercase tracking-wider">
              Paositra Malagasy • Comptabilité
            </div>
            <h1 className="text-3xl md:text-4xl font-heading font-bold text-text-primary mt-1">
              ComptaGeWeb
            </h1>
          </div>

          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 px-3 py-2 rounded border border-border-subtle hover:bg-surface-secondary text-text-secondary hover:text-text-primary transition-colors text-sm font-sans"
            aria-label="Basculer le thème"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-accent" /> : <Moon className="w-4 h-4 text-text-primary" />}
            <span>Mode {theme === 'dark' ? 'clair' : 'sombre'}</span>
          </button>
        </header>

        {/* Statut Backend / Section 0 vérification */}
        <div className="bg-surface-card rounded border border-border-subtle p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-heading font-semibold text-text-primary">
              État de connexion au serveur backend (Django)
            </h2>
            <button
              onClick={fetchHealth}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-sans rounded bg-surface-secondary hover:bg-border-subtle text-text-primary transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
          </div>

          <div className="text-sm font-sans text-text-secondary">
            Endpoint ciblé : <code className="px-1.5 py-0.5 rounded bg-surface-secondary text-text-primary font-mono text-xs">/api/v1/health/</code>
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
                <div className="text-xs text-text-primary grid grid-cols-2 gap-2 mt-2 font-mono">
                  <div>Statut : <span className="font-semibold">{health.status}</span></div>
                  <div>Service : <span className="font-semibold">{health.service}</span></div>
                  <div>Version : <span className="font-semibold">{health.version}</span></div>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Carte informative sur le projet */}
        <div className="bg-surface-card rounded border border-border-subtle p-6 space-y-3 text-sm text-text-secondary font-sans">
          <h3 className="font-heading text-base font-semibold text-text-primary">
            Architecture et directives actives
          </h3>
          <ul className="list-disc list-inside space-y-1">
            <li>Tokens graphiques calibrés selon <code className="font-mono text-xs">DESIGN.md</code> (60/30/10 avec vert postal, gris ardoise, ocre doré).</li>
            <li>Typographie conforme : Titres en <strong>Fraunces</strong>, corps de texte et tableaux en <strong>Public Sans</strong>.</li>
            <li>Client API modulaire dans <code className="font-mono text-xs">src/api/client.ts</code> avec gestion automatique du JWT et rafraîchissement.</li>
            <li>Structure par features initialisée dans <code className="font-mono text-xs">src/features/</code>.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
