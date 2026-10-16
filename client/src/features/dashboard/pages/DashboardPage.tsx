import React, { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import ReceveurDashboard from '../components/ReceveurDashboard';
import InspecteurDashboard from '../components/InspecteurDashboard';
import AdminDashboard from '../components/AdminDashboard';
import {
  Building2,
  ShieldCheck,
  Globe2,
} from 'lucide-react';

/**
 * Page d'accueil après connexion (Module 6 de PROJECT_STATE.md).
 * Affiche dynamiquement le tableau de bord correspondant au rôle de l'utilisateur :
 *   - RECEVEUR / AGENT_SAISIE -> Progression de saisie G58 du bureau et encaisse
 *   - INSPECTEUR              -> Synthèse des écarts et bureaux impactés (vue DIF)
 *   - ADMIN                   -> Vue d'ensemble macroscopique du réseau + bascule possible
 */
export default function DashboardPage() {
  const { user, role } = useAuth();
  const [adminViewMode, setAdminViewMode] = useState<'admin' | 'inspecteur' | 'receveur'>('admin');

  const roleLabels: Record<string, string> = {
    ADMIN: 'Administrateur Central',
    RECEVEUR: 'Receveur des Postes',
    AGENT_SAISIE: 'Agent de saisie',
    INSPECTEUR: 'Inspecteur / Auditeur',
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Fil d'Ariane & En-tête contextuel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-sans text-text-secondary uppercase tracking-wider mb-1">
            Accueil • Paositra Malagasy
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-text-primary">
            Tableau de Bord
          </h1>
        </div>

        {/* Sélecteur de vue pour l'Administrateur */}
        {role === 'ADMIN' && (
          <div className="inline-flex p-1 rounded-xl bg-surface-card border border-border-subtle shadow-sm self-start sm:self-auto text-xs">
            <button
              onClick={() => setAdminViewMode('admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
                adminViewMode === 'admin'
                  ? 'bg-brand text-white shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Globe2 className="w-3.5 h-3.5" />
              Vue Réseau (Admin)
            </button>
            <button
              onClick={() => setAdminViewMode('inspecteur')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
                adminViewMode === 'inspecteur'
                  ? 'bg-brand text-white shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Audit (Inspecteur)
            </button>
            <button
              onClick={() => setAdminViewMode('receveur')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
                adminViewMode === 'receveur'
                  ? 'bg-brand text-white shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              Bureau (Receveur)
            </button>
          </div>
        )}
      </div>

      {/* Rendu dynamique du composant de tableau de bord */}
      {role === 'ADMIN' ? (
        adminViewMode === 'admin' ? (
          <AdminDashboard />
        ) : adminViewMode === 'inspecteur' ? (
          <InspecteurDashboard />
        ) : (
          <ReceveurDashboard />
        )
      ) : role === 'INSPECTEUR' ? (
        <InspecteurDashboard />
      ) : role === 'RECEVEUR' || role === 'AGENT_SAISIE' ? (
        <ReceveurDashboard />
      ) : (
        <div className="bg-surface-card rounded-xl border border-border-subtle p-8 text-center">
          <p className="text-sm text-text-secondary">
            Connecté en tant que <strong className="text-text-primary">{role ? roleLabels[role] || role : '—'}</strong>.
          </p>
        </div>
      )}
    </div>
  );
}
