import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import type { UserRole } from '../../../types';

interface RequireAuthProps {
  children: React.ReactNode;
  /** Si spécifié, seul les utilisateurs ayant un de ces rôles peuvent accéder */
  allowedRoles?: UserRole[];
}

/**
 * Composant de garde de route.
 * - Redirige vers /login si non authentifié.
 * - Redirige vers /non-autorise si le rôle n'est pas dans allowedRoles.
 * - Affiche un écran de chargement pendant la vérification initiale.
 */
export default function RequireAuth({ children, allowedRoles }: RequireAuthProps) {
  const { isAuthenticated, isLoading, role } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-primary flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-accent" />
          <p className="text-sm font-sans text-text-secondary">
            Vérification de la session…
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Préserver l'URL demandée pour rediriger après connexion
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Navigate to="/non-autorise" replace />;
  }

  return <>{children}</>;
}
