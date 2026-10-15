import React, { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { ReceveurDashboard } from '../components/ReceveurDashboard';
import { InspecteurDashboard } from '../components/InspecteurDashboard';
import { AdminDashboard } from '../components/AdminDashboard';
import {
  LayoutDashboard,
  Building2,
  ShieldAlert,
  SlidersHorizontal,
} from 'lucide-react';

/**
 * Page d'accueil après connexion : aiguillage contextuel vers le tableau de bord
 * approprié selon le rôle de l'utilisateur connecté (Module 6 de PROJECT_STATE.md).
 * - RECEVEUR & AGENT_SAISIE : Progression de saisie G58 et situation d'encaisse
 * - INSPECTEUR : Vue synthétique des écarts et vue DIF filtrable
 * - ADMIN : Vue d'ensemble globale du réseau postal et surveillance
 */
export default function DashboardPage() {
  const { user, role } = useAuth();

  // Pour Admin ou Inspecteur : possibilité d'examiner la vue d'un bureau précis
  const [inspectBureauView, setInspectBureauView] = useState<string>('');

  const roleLabels: Record<string, string> = {
    ADMIN: 'Administrateur Central',
    RECEVEUR: 'Receveur des Postes',
    AGENT_SAISIE: 'Agent de Saisie Comptable',
    INSPECTEUR: 'Inspecteur / Auditeur',
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6" data-testid="dashboard-page">
      {/* 1. Fil d'Ariane & En-tête contextuel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-sans text-text-secondary uppercase tracking-wider mb-1">
            Accueil
          </div>
          <h1 className="text-2xl font-heading font-bold text-text-primary">
            Tableau de bord
          </h1>
        </div>

        {/* Badge d'identification utilisateur */}
        <div className="flex items-center gap-3 self-start sm:self-auto bg-surface-card border border-border-subtle py-1.5 px-3.5 rounded-full shadow-sm">
          <div className="w-2 h-2 rounded-full bg-status-success animate-pulse" />
          <span className="text-xs font-sans text-text-secondary">
            Connecté : <strong className="text-text-primary">{user?.username}</strong> ({role ? roleLabels[role] || role : '—'})
          </span>
          {user?.bureau_code != null && (
            <span className="text-xs font-sans px-2 py-0.5 rounded bg-surface-secondary text-text-secondary tabular-nums">
              Bureau #{user.bureau_code}
            </span>
          )}
        </div>
      </div>

      {/* 2. Switcher de vue optionnel pour Admin / Inspecteur */}
      {(role === 'ADMIN' || role === 'INSPECTEUR') && (
        <div className="flex items-center gap-3 bg-surface-card p-3 rounded-xl border border-border-subtle text-xs">
          <span className="text-text-secondary font-medium flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-accent" />
            Mode d'affichage :
          </span>
          <button
            type="button"
            onClick={() => setInspectBureauView('')}
            className={`px-3 py-1 rounded-lg font-medium transition-colors ${
              !inspectBureauView
                ? 'bg-paoma-blue text-white dark:bg-accent dark:text-text-primary'
                : 'bg-surface-secondary text-text-secondary hover:text-text-primary'
            }`}
          >
            {role === 'ADMIN' ? 'Vue Centrale (Admin)' : "Vue d'Inspection (Écarts)"}
          </button>
          <button
            type="button"
            onClick={() => setInspectBureauView(user?.bureau_code?.toString() || '1')}
            className={`px-3 py-1 rounded-lg font-medium transition-colors ${
              inspectBureauView
                ? 'bg-paoma-blue text-white dark:bg-accent dark:text-text-primary'
                : 'bg-surface-secondary text-text-secondary hover:text-text-primary'
            }`}
          >
            Vue Bureau (G58 & Encaisse)
          </button>
        </div>
      )}

      {/* 3. Aiguillage des composants de Dashboard selon le rôle */}
      {inspectBureauView ? (
        <ReceveurDashboard bureauId={inspectBureauView} />
      ) : role === 'INSPECTEUR' ? (
        <InspecteurDashboard />
      ) : role === 'ADMIN' ? (
        <AdminDashboard />
      ) : (
        /* Rôles RECEVEUR et AGENT_SAISIE (par défaut) */
        <ReceveurDashboard bureauId={user?.bureau_code ?? undefined} />
      )}
    </div>
  );
}
