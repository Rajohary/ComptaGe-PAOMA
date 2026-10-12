import { ShieldOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * Page affichée quand un utilisateur tente d'accéder à une route
 * pour laquelle son rôle n'a pas les permissions suffisantes.
 */
export default function UnauthorizedPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-surface-primary flex items-center justify-center p-4">
      <div className="max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-status-alert/10 mb-4">
          <ShieldOff className="w-7 h-7 text-status-alert" />
        </div>
        <h1 className="text-2xl font-heading font-bold text-text-primary mb-2">
          Accès non autorisé
        </h1>
        <p className="text-sm font-sans text-text-secondary mb-6">
          Votre rôle ne permet pas d'accéder à cette section de l'application.
          Si vous pensez qu'il s'agit d'une erreur, contactez votre administrateur.
        </p>
        <button
          onClick={() => navigate('/', { replace: true })}
          className="
            px-4 py-2.5 rounded-lg text-sm font-sans font-medium
            bg-brand text-white hover:bg-brand/90
            focus:outline-none focus:ring-2 focus:ring-brand/40
            transition-colors duration-150
          "
        >
          Retour à l'accueil
        </button>
      </div>
    </div>
  );
}
