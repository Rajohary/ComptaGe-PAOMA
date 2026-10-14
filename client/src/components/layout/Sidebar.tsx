import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import type { UserRole } from '../../types';
import {
  LayoutDashboard,
  FileText,
  Search,
  Building2,
  ShieldCheck,
  Package,
  CalendarDays,
  Activity,
  LogOut,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import paomaLogo from '../../assets/Paoma-logo.png';

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
    roles: ['RECEVEUR', 'AGENT_SAISIE', 'INSPECTEUR', 'ADMIN'],
  },
  {
    label: 'Bureaux',
    to: '/admin/bureaux',
    icon: <Building2 className="w-5 h-5" />,
    roles: ['ADMIN'],
  },
  {
    label: 'Périodes de gestion',
    to: '/periodes-gestion',
    icon: <CalendarDays className="w-5 h-5" />,
    roles: ['RECEVEUR', 'ADMIN'],
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
  {
    label: 'Santé système',
    to: '/sante',
    icon: <Activity className="w-5 h-5" />,
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
      {/* En-tête sidebar avec Logo Paositra Malagasy & Titre */}
      <div className="flex items-center justify-between px-3.5 py-3.5 border-b border-border-subtle gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <img
            src={paomaLogo}
            alt="Logo Paositra Malagasy"
            className="w-9 h-9 object-contain flex-shrink-0"
          />
          {!collapsed && (
            <div className="min-w-0">
              <div className="text-[10px] font-sans font-semibold text-paoma-blue uppercase tracking-wider">
                Paositra Malagasy
              </div>
              <div
                className="text-xs font-heading font-bold text-text-primary leading-tight line-clamp-2"
                title="Comptabilité mensuelle de bureau de Poste"
              >
                Comptabilité mensuelle de bureau de Poste
              </div>
            </div>
          )}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded hover:bg-surface-secondary text-text-secondary hover:text-text-primary transition-colors duration-150 flex-shrink-0"
          aria-label={collapsed ? 'Agrandir la barre latérale' : 'Réduire la barre latérale'}
          title={collapsed ? 'Agrandir' : 'Réduire'}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Navigation principale */}
      <nav className="flex-1 overflow-y-auto px-2 py-3" aria-label="Navigation principale">
        <ul className="space-y-1">
          {visibleItems.map((item) => {
            const isActive =
              item.to === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.to);

            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-sans
                    transition-colors duration-150 relative
                    ${
                      isActive
                        ? 'bg-surface-secondary text-text-primary font-medium'
                        : 'text-text-secondary hover:bg-surface-secondary/60 hover:text-text-primary'
                    }
                    ${collapsed ? 'justify-center px-0' : ''}
                  `}
                  title={collapsed ? item.label : undefined}
                >
                  {/* Indicateur doré pour le lien actif */}
                  {isActive && (
                    <span
                      className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-accent rounded-r"
                      aria-hidden="true"
                    />
                  )}
                  <span
                    className={`flex-shrink-0 ${
                      isActive ? 'text-accent' : 'text-text-secondary'
                    }`}
                  >
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

export { Sidebar };
