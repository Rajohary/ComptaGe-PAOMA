import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './features/auth/pages/LoginPage';
import UnauthorizedPage from './features/auth/pages/UnauthorizedPage';
import RequireAuth from './features/auth/components/RequireAuth';
import AppShell from './components/layout/AppShell';
import DashboardPage from './features/dashboard/pages/DashboardPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Routes publiques */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/non-autorise" element={<UnauthorizedPage />} />

        {/* Routes protégées — toutes dans le shell applicatif */}
        <Route
          element={
            <RequireAuth>
              <AppShell />
            </RequireAuth>
          }
        >
          {/* Dashboard (accessible à tous les rôles authentifiés) */}
          <Route index element={<DashboardPage />} />

          {/* Saisie G58 — Receveur & Agent de saisie */}
          <Route
            path="saisie"
            element={
              <RequireAuth allowedRoles={['RECEVEUR', 'AGENT_SAISIE']}>
                <PlaceholderPage title="Saisie G58" module="4" />
              </RequireAuth>
            }
          />

          {/* Plan comptable — Receveur, Agent de saisie, Inspecteur */}
          <Route
            path="plan-comptable"
            element={
              <RequireAuth allowedRoles={['RECEVEUR', 'AGENT_SAISIE', 'INSPECTEUR']}>
                <PlaceholderPage title="Plan comptable" module="3" />
              </RequireAuth>
            }
          />

          {/* Admin : gestion des bureaux */}
          <Route
            path="admin/*"
            element={
              <RequireAuth allowedRoles={['ADMIN']}>
                <PlaceholderPage title="Administration — Bureaux" module="2" />
              </RequireAuth>
            }
          />

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
        </Route>

        {/* Fallback — redirection vers l'accueil */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

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
