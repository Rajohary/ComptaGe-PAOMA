import { useForm } from 'react-hook-form';
import { z } from 'zod/v4';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { LogIn, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';

const loginSchema = z.object({
  username: z.string().min(1, "Le nom d'utilisateur est requis."),
  password: z.string().min(1, 'Le mot de passe est requis.'),
});

type LoginFormData = z.infer<typeof loginSchema>;

/** Détermine la route de redirection après connexion selon le rôle */
function getRedirectPathForRole(role: string): string {
  switch (role) {
    case 'ADMIN':
      return '/admin';
    case 'INSPECTEUR':
      return '/audit';
    case 'RECEVEUR':
    case 'AGENT_SAISIE':
      return '/saisie';
    default:
      return '/';
  }
}

export default function LoginPage() {
  const { login, isLoggingIn, loginError, isAuthenticated, role } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  });

  // Redirection si déjà connecté
  useEffect(() => {
    if (isAuthenticated && role) {
      navigate(getRedirectPathForRole(role), { replace: true });
    }
  }, [isAuthenticated, role, navigate]);

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data);
      // La redirection se fait via le useEffect ci-dessus
    } catch {
      // L'erreur est déjà gérée dans AuthContext (loginError)
    }
  };

  return (
    <div className="min-h-screen bg-surface-primary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* En-tête institutionnel */}
        <div className="text-center mb-8">
          <div className="text-xs font-sans text-text-secondary uppercase tracking-[0.2em] mb-2">
            Paositra Malagasy
          </div>
          <h1 className="text-3xl font-heading font-bold text-text-primary">
            ComptaGeWeb
          </h1>
          <p className="text-sm font-sans text-text-secondary mt-2">
            Gestion comptable des bureaux de poste
          </p>
        </div>

        {/* Carte de connexion */}
        <div className="bg-surface-card rounded-xl border border-border-subtle p-8">
          <h2 className="text-lg font-heading font-semibold text-text-primary mb-6">
            Connexion
          </h2>

          {/* Message d'erreur global */}
          {loginError && (
            <div
              className="flex items-start gap-3 p-3 rounded-lg bg-status-alert/10 border border-status-alert/20 mb-6"
              role="alert"
              id="login-error"
            >
              <AlertCircle className="w-4 h-4 text-status-alert flex-shrink-0 mt-0.5" />
              <p className="text-sm font-sans text-status-alert">{loginError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            {/* Champ utilisateur */}
            <div>
              <label
                htmlFor="login-username"
                className="block text-sm font-sans font-medium text-text-primary mb-1.5"
              >
                Nom d'utilisateur
              </label>
              <input
                id="login-username"
                type="text"
                autoComplete="username"
                autoFocus
                {...register('username')}
                aria-invalid={!!errors.username}
                aria-describedby={errors.username ? 'username-error' : undefined}
                className={`
                  w-full px-3 py-2.5 rounded-lg border text-sm font-sans
                  bg-surface-primary text-text-primary
                  placeholder:text-text-secondary/50
                  focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent
                  transition-colors duration-150
                  ${errors.username ? 'border-status-alert' : 'border-border-subtle'}
                `}
                placeholder="ex : receveur1"
              />
              {errors.username && (
                <p id="username-error" className="text-xs font-sans text-status-alert mt-1.5">
                  {errors.username.message}
                </p>
              )}
            </div>

            {/* Champ mot de passe */}
            <div>
              <label
                htmlFor="login-password"
                className="block text-sm font-sans font-medium text-text-primary mb-1.5"
              >
                Mot de passe
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  {...register('password')}
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                  className={`
                    w-full px-3 py-2.5 pr-10 rounded-lg border text-sm font-sans
                    bg-surface-primary text-text-primary
                    placeholder:text-text-secondary/50
                    focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent
                    transition-colors duration-150
                    ${errors.password ? 'border-status-alert' : 'border-border-subtle'}
                  `}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  tabIndex={-1}
                >
                  {showPassword
                    ? <EyeOff className="w-4 h-4" />
                    : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p id="password-error" className="text-xs font-sans text-status-alert mt-1.5">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Bouton de soumission */}
            <button
              type="submit"
              disabled={isLoggingIn}
              id="login-submit"
              className="
                w-full flex items-center justify-center gap-2
                px-4 py-2.5 rounded-lg
                bg-brand text-white font-sans font-medium text-sm
                hover:bg-brand/90
                focus:outline-none focus:ring-2 focus:ring-brand/40 focus:ring-offset-2 focus:ring-offset-surface-card
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-150
              "
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Connexion en cours…
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Se connecter
                </>
              )}
            </button>
          </form>
        </div>

        {/* Pied de page minimal */}
        <p className="text-center text-xs font-sans text-text-secondary mt-6">
          Accès réservé au personnel autorisé de Paositra Malagasy.
        </p>
      </div>
    </div>
  );
}
