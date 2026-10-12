import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Moon, Sun } from 'lucide-react';

export const Topbar: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="h-16 bg-surface-card border-b border-border-subtle px-6 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <span className="inline-block w-2.5 h-2.5 rounded-full bg-status-success" title="Système opérationnel" />
        <span className="text-xs font-sans text-text-secondary uppercase tracking-wider">
          Plateforme Comptable des Bureaux
        </span>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={toggleTheme}
          className="flex items-center gap-2 px-3 py-1.5 rounded border border-border-subtle hover:bg-surface-secondary text-text-secondary hover:text-text-primary transition-colors text-xs font-sans"
          aria-label="Basculer le mode clair/sombre"
        >
          {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-accent" /> : <Moon className="w-3.5 h-3.5" />}
          <span>Mode {theme === 'dark' ? 'clair' : 'sombre'}</span>
        </button>
      </div>
    </header>
  );
};
