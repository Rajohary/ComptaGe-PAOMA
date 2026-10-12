import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import React from 'react';
import { NavLink } from 'react-router-dom';
import { Building2, Activity, CalendarDays } from 'lucide-react';

import type { UserRole } from '../../types';
import {
  LayoutDashboard,
  FileText,
  Search,
  Building2,
  ShieldCheck,
  Package,
  LogOut,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';

interface NavItem {
  label: string;
  to: string;
  icon: React.ReactNode;
  /** Rôles autorisés à voir cet item. undefined = tous les rôles */
  roles?: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Tableau de bord',
    to: '/',
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    label: 'Saisie G58',
    to: '/saisie',
    icon: <FileText className="w-5 h-5" />,
    roles: ['RECEVEUR', 'AGENT_SAISIE'],
  },
  {
    label: 'Plan comptable',
    to: '/plan-comptable',
    icon: <Search className="w-5 h-5" />,
    roles: ['RECEVEUR', 'AGENT_SAISIE', 'INSPECTEUR'],
  },
  {
    label: 'Bureaux',
    to: '/admin/bureaux',
    icon: <Building2 className="w-5 h-5" />,
    roles: ['ADMIN'],
  },
  {
    label: 'Audit & Écarts',
    to: '/audit',
    icon: <ShieldCheck className="w-5 h-5" />,
    roles: ['INSPECTEUR', 'ADMIN'],
  },
  {
    label: 'Stock valeurs',
    to: '/stock',
    icon: <Package className="w-5 h-5" />,
    roles: ['RECEVEUR', 'AGENT_SAISIE', 'ADMIN'],
  },
];

export default function Sidebar() {
  const { user, role, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  // Filtrer les items de navigation selon le rôle
  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || (role && item.roles.includes(role))
  );

  const handleLogout = async () => {
    await logout();
  };

  return (
    <aside
      className={`
        flex flex-col h-screen bg-surface-card border-r border-border-subtle
        transition-[width] duration-200 ease-out
        ${collapsed ? 'w-16' : 'w-60'}
      `}
    >
      {/* En-tête sidebar */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-border-subtle">
        {!collapsed && (
          <div className="min-w-0">
            <div className="text-[10px] font-sans text-text-secondary uppercase tracking-[0.15em]">
              Paositra Malagasy
            </div>
            <div className="text-sm font-heading font-bold text-text-primary truncate">
              ComptaGeWeb
            </div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded hover:bg-surface-secondary text-text-secondary hover:text-text-primary transition-colors flex-shrink-0"
          aria-label={collapsed ? 'Étendre la barre latérale' : 'Réduire la barre latérale'}
        >
          {collapsed
            ? <ChevronRight className="w-4 h-4" />
            : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation principale */}
      <nav className="flex-1 overflow-y-auto py-3 px-2" aria-label="Navigation principale">
        <ul className="space-y-0.5">
          {visibleItems.map((item) => {
            const isActive = location.pathname === item.to ||
              (item.to !== '/' && location.pathname.startsWith(item.to));

            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-sans
                    transition-colors duration-150
                    ${isActive
                      ? 'bg-brand/10 text-brand font-medium'
                      : 'text-text-secondary hover:bg-surface-secondary hover:text-text-primary'}
                    ${collapsed ? 'justify-center px-0' : ''}
                  `}
                  title={collapsed ? item.label : undefined}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span className={`flex-shrink-0 ${isActive ? 'text-brand' : ''}`}>
                    {item.icon}
                  </span>
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Zone inférieure : utilisateur + actions */}
      <div className="border-t border-border-subtle px-2 py-3 space-y-1">
        {/* Toggle thème */}
        <button
          onClick={toggleTheme}
          className={`
            flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-sans
            text-text-secondary hover:bg-surface-secondary hover:text-text-primary
            transition-colors duration-150
            ${collapsed ? 'justify-center px-0' : ''}
          `}
          title={collapsed ? `Mode ${theme === 'dark' ? 'clair' : 'sombre'}` : undefined}
          aria-label={`Basculer en mode ${theme === 'dark' ? 'clair' : 'sombre'}`}
        >
          {theme === 'dark'
            ? <Sun className="w-4 h-4 text-accent flex-shrink-0" />
            : <Moon className="w-4 h-4 flex-shrink-0" />}
          {!collapsed && (
            <span>Mode {theme === 'dark' ? 'clair' : 'sombre'}</span>
          )}
        </button>

        {/* Info utilisateur */}
        {user && !collapsed && (
          <div className="px-3 py-2">
            <div className="text-xs font-sans text-text-primary font-medium truncate">
              {user.first_name && user.last_name
                ? `${user.first_name} ${user.last_name}`
                : user.username}
            </div>
            <div className="text-[10px] font-sans text-text-secondary uppercase tracking-wider mt-0.5">
              {user.role.replace('_', ' ')}
            </div>
          </div>
        )}

        {/* Déconnexion */}
        <button
          onClick={handleLogout}
          className={`
            flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-sans
            text-status-alert/80 hover:bg-status-alert/10 hover:text-status-alert
            transition-colors duration-150
            ${collapsed ? 'justify-center px-0' : ''}
          `}
          title={collapsed ? 'Déconnexion' : undefined}
          id="logout-button"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Déconnexion</span>}
        </button>
      </div>
    </aside>
  );
}

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
