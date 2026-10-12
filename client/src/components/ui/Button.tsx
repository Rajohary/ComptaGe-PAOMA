import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-sans font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed rounded';

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-5 py-2.5 text-base gap-2.5',
  };

  const variantStyles = {
    // Action primaire : couleur accentuation dorée
    primary: 'bg-accent text-text-primary hover:brightness-105 active:brightness-95 focus:ring-accent font-semibold shadow-sm',
    // Action secondaire : bordure subtile / fond secondaire
    secondary: 'bg-surface-secondary text-text-primary border border-border-subtle hover:bg-surface-card active:bg-surface-secondary focus:ring-border-subtle',
    // Action destructrice : statut alerte brique
    danger: 'bg-status-alert text-white hover:brightness-110 active:brightness-90 focus:ring-status-alert',
    ghost: 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary focus:ring-transparent',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
      ) : null}
      {children}
    </button>
  );
};
