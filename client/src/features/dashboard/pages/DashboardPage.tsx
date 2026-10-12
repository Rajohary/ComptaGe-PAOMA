import { useAuth } from '../../../contexts/AuthContext';
import { LayoutDashboard } from 'lucide-react';

/**
 * Page d'accueil après connexion.
 * Pour l'instant, affiche un message de bienvenue contextuel selon le rôle.
 * Le contenu réel des dashboards sera implémenté dans le module 6 de PROJECT_STATE.md.
 */
export default function DashboardPage() {
  const { user, role } = useAuth();

  const roleLabels: Record<string, string> = {
    ADMIN: 'Administrateur',
    RECEVEUR: 'Receveur',
    AGENT_SAISIE: 'Agent de saisie',
    INSPECTEUR: 'Inspecteur',
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl">
      {/* Fil d'Ariane / En-tête contextuel */}
      <div className="mb-6">
        <div className="text-xs font-sans text-text-secondary uppercase tracking-wider mb-1">
          Accueil
        </div>
        <h1 className="text-2xl font-heading font-bold text-text-primary">
          Tableau de bord
        </h1>
      </div>

      {/* Carte de bienvenue */}
      <div className="bg-surface-card rounded-xl border border-border-subtle p-6">
        <div className="flex items-start gap-4">
          <div className="p-2.5 rounded-lg bg-brand/10">
            <LayoutDashboard className="w-5 h-5 text-brand" />
          </div>
          <div>
            <h2 className="text-lg font-heading font-semibold text-text-primary">
              Bienvenue{user?.first_name ? `, ${user.first_name}` : ''}
            </h2>
            <p className="text-sm font-sans text-text-secondary mt-1">
              Vous êtes connecté en tant que{' '}
              <span className="font-medium text-text-primary">
                {role ? roleLabels[role] || role : '—'}
              </span>
              {user?.bureau_code != null && (
                <>
                  {' '} — Bureau n°{' '}
                  <span className="font-medium text-text-primary tabular-nums">
                    {user.bureau_code}
                  </span>
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Placeholder — contenu dashboard réel à venir (module 6) */}
      <div className="mt-6 bg-surface-card rounded-xl border border-border-subtle border-dashed p-8 text-center">
        <p className="text-sm font-sans text-text-secondary">
          Les widgets de tableau de bord spécifiques à votre rôle seront affichés ici.
        </p>
        <p className="text-xs font-sans text-text-secondary/70 mt-2">
          Module 6 de PROJECT_STATE.md — à implémenter ultérieurement.
        </p>
      </div>
    </div>
  );
}
