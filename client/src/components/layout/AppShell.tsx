import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

/**
 * Shell applicatif principal — layout à deux colonnes :
 * - Sidebar persistante (navigation, user, thème)
 * - Zone de contenu principale (rendue par Outlet)
 *
 * Conforme à DESIGN.md section 4.1 : layout applicatif classique,
 * sidebar jamais masquée par défaut sur desktop.
 */
export default function AppShell() {
  return (
    <div className="flex h-screen bg-surface-primary overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
