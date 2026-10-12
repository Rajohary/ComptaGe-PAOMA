import React from 'react';
import { NavLink } from 'react-router-dom';
import { Building2, Activity, CalendarDays } from 'lucide-react';

export const Sidebar: React.FC = () => {
  const navItems = [
    {
      to: '/bureaux',
      label: 'Bureaux de poste',
      icon: Building2,
    },
    {
      to: '/periodes-gestion',
      label: 'Périodes de gestion',
      icon: CalendarDays,
    },
    {
      to: '/sante',
      label: 'Santé système',
      icon: Activity,
    },
  ];

  return (
    <aside className="w-64 bg-surface-card border-r border-border-subtle flex flex-col h-screen sticky top-0">
      {/* Brand header */}
      <div className="p-6 border-b border-border-subtle">
        <div className="text-xs font-sans text-text-secondary uppercase tracking-wider">
          Paositra Malagasy
        </div>
        <div className="text-xl font-heading font-bold text-text-primary mt-0.5">
          ComptaGeWeb
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        <div className="px-3 py-2 text-xs font-sans font-semibold text-text-secondary uppercase tracking-wider">
          Référentiel
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded text-sm font-sans font-medium transition-colors ${
                  isActive
                    ? 'bg-surface-secondary text-text-primary border-l-4 border-accent font-semibold'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary/50'
                }`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer info */}
      <div className="p-4 border-t border-border-subtle text-xs text-text-secondary font-sans">
        Version 1.0.0 • Module Référentiel
      </div>
    </aside>
  );
};
