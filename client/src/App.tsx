import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './features/auth/pages/LoginPage';
import UnauthorizedPage from './features/auth/pages/UnauthorizedPage';
import RequireAuth from './features/auth/components/RequireAuth';
import AppShell from './components/layout/AppShell';
import DashboardPage from './features/dashboard/pages/DashboardPage';
import { BureauxPage } from './features/bureaux/BureauxPage';
import { PeriodesGestionPage } from './features/periodes-gestion/PeriodesGestionPage';
import { PlanComptablePage } from './features/plan-comptable/PlanComptablePage';
import { HealthPage } from './features/dashboard/HealthPage';

/**
 * Composant placeholder générique pour les routes non encore implémentées.
 * Affiche un état vide explicite (DESIGN.md section 4.2 : jamais de zone vide sans message).
 */
function PlaceholderPage({ title, module }: { title: string; module: string }) {
  return (
    <div className="p-6 md:p-8 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-heading font-bold text-text-primary">{title}</h1>
      </div>
      <div className="bg-surface-card rounded-xl border border-border-subtle border-dashed p-8 text-center">
        <p className="text-sm font-sans text-text-secondary">
          Ce module n'est pas encore implémenté.
        </p>
        <p className="text-xs font-sans text-text-secondary/70 mt-2">
          Voir section {module} de PROJECT_STATE.md.
        </p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Routes publiques */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/non-autorise" element={<UnauthorizedPage />} />

        {/* Routes du shell sans bloquer les modules publics/référentiel si non connecté */}
        <Route element={<AppShell />}>
          {/* Dashboard (protégé) */}
          <Route
            index
            element={
              <RequireAuth>
                <DashboardPage />
              </RequireAuth>
            }
          />

          {/* Saisie G58 — Receveur & Agent de saisie */}
          <Route
            path="saisie"
            element={
              <RequireAuth allowedRoles={['RECEVEUR', 'AGENT_SAISIE']}>
                <PlaceholderPage title="Saisie G58" module="4" />
              </RequireAuth>
            }
          />

          {/* Plan comptable — Receveur, Agent de saisie, Inspecteur, Admin */}
          <Route
            path="plan-comptable"
            element={
              <RequireAuth allowedRoles={['RECEVEUR', 'AGENT_SAISIE', 'INSPECTEUR', 'ADMIN']}>
                <PlanComptablePage />
              </RequireAuth>
            }
          />

          {/* Admin : gestion des bureaux */}
          <Route path="admin/bureaux" element={<BureauxPage />} />
          <Route path="admin" element={<Navigate to="/admin/bureaux" replace />} />

          {/* Accès direct bureaux (Référentiel) */}
          <Route path="bureaux" element={<BureauxPage />} />

          {/* Périodes de gestion (Référentiel) */}
          <Route path="periodes-gestion" element={<PeriodesGestionPage />} />

          {/* Audit — Inspecteur & Admin */}
          <Route
            path="audit"
            element={
              <RequireAuth allowedRoles={['INSPECTEUR', 'ADMIN']}>
                <PlaceholderPage title="Audit & Écarts" module="5" />
              </RequireAuth>
            }
          />

          {/* Stock valeurs — Receveur, Agent, Admin */}
          <Route
            path="stock"
            element={
              <RequireAuth allowedRoles={['RECEVEUR', 'AGENT_SAISIE', 'ADMIN']}>
                <PlaceholderPage title="Stock de valeurs postales" module="7" />
              </RequireAuth>
            }
          />

          {/* Santé système */}
          <Route path="sante" element={<HealthPage />} />
        </Route>

        {/* Fallback — redirection vers l'accueil */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
