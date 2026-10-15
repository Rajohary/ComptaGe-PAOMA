import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getAdminDashboard } from '../../../api/dashboard';
import type { AdminDashboardData } from '../../../types';
import { formatMGA, formatDateTime } from '../../../lib/formatters';
import { Button } from '../../../components/ui/Button';
import {
  Building2,
  MapPin,
  CalendarDays,
  Users,
  Layers,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  AlertTriangle,
  ArrowRight,
  Clock,
  CheckCircle2,
  Lock,
  UserCheck,
  FileSpreadsheet,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminDashboard();
      setData(res);
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string }; message?: string };
      setError(e.data?.detail || e.message || 'Impossible de charger le tableau de bord Administrateur.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse" data-testid="dashboard-admin-loading">
        <div className="h-20 bg-surface-card rounded-xl border border-border-subtle" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-surface-card rounded-xl border border-border-subtle" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-surface-card rounded-xl border border-border-subtle" />
          <div className="h-64 bg-surface-card rounded-xl border border-border-subtle" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-surface-card rounded-xl border border-status-alert/30 p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-status-alert/10 text-status-alert flex items-center justify-center mx-auto mb-3">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-heading font-semibold text-text-primary mb-1">
          Erreur de chargement
        </h3>
        <p className="text-sm font-sans text-text-secondary max-w-md mx-auto mb-4">
          {error || "Une erreur inattendue est survenue lors de l'accès aux statistiques globales."}
        </p>
        <Button onClick={loadData} variant="secondary" className="inline-flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          Réessayer
        </Button>
      </div>
    );
  }

  const { territoire, periodes, utilisateurs, comptabilite, audit } = data;

  const roleLabels: Record<string, string> = {
    ADMIN: 'Administrateurs',
    RECEVEUR: 'Receveurs (Chefs de bureau)',
    AGENT_SAISIE: 'Agents de saisie',
    INSPECTEUR: 'Inspecteurs / Auditeurs',
  };

  return (
    <div className="space-y-6" data-testid="dashboard-admin">
      {/* 1. En-tête contextuel de supervision */}
      <div className="bg-surface-card rounded-xl border border-border-subtle p-5 md:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-paoma-blue/10 text-paoma-blue dark:text-accent">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-heading font-bold text-text-primary">
                  Supervision Centrale & Administration
                </h2>
                <span className="text-xs font-sans font-medium px-2.5 py-0.5 rounded-full bg-paoma-blue/10 text-paoma-blue dark:text-accent">
                  Direction Générale
                </span>
              </div>
              <p className="text-sm font-sans text-text-secondary mt-1">
                Vue d'ensemble consolidée du réseau postal national de Paositra Malagasy, des périodes de gestion et de l'intégrité comptable.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end md:self-center">
            <Button onClick={loadData} variant="ghost" size="sm" title="Actualiser les indicateurs">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Grandes cartes métriques (KPIs Réseau & Gestion) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Bureaux Actifs */}
        <div className="bg-surface-card rounded-xl border border-border-subtle p-5 shadow-sm">
          <div className="flex items-center justify-between text-text-secondary mb-2">
            <span className="text-xs font-heading font-medium uppercase tracking-wider">
              Bureaux actifs
            </span>
            <div className="p-2 rounded-lg bg-status-success/15 text-status-success">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-sans font-bold text-text-primary tabular-nums">
            {territoire.bureaux_actifs_count}{' '}
            <span className="text-sm font-normal text-text-secondary">/ {territoire.total_bureaux}</span>
          </div>
          <div className="text-xs text-text-secondary mt-2 flex items-center justify-between border-t border-border-subtle/50 pt-2">
            <span>Provinces couvertes</span>
            <span className="font-semibold text-text-primary tabular-nums">
              {territoire.total_provinces} Faritany
            </span>
          </div>
        </div>

        {/* Périodes en cours */}
        <div className="bg-surface-card rounded-xl border border-border-subtle p-5 shadow-sm">
          <div className="flex items-center justify-between text-text-secondary mb-2">
            <span className="text-xs font-heading font-medium uppercase tracking-wider">
              Périodes en cours
            </span>
            <div className="p-2 rounded-lg bg-paoma-blue/10 text-paoma-blue dark:text-accent">
              <CalendarDays className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-sans font-bold text-text-primary tabular-nums">
            {periodes.periodes_en_cours}
          </div>
          <div className="text-xs text-text-secondary mt-2 flex items-center justify-between border-t border-border-subtle/50 pt-2">
            <span>Taux de clôture mensuelle</span>
            <span className="font-semibold text-status-success tabular-nums">
              {periodes.taux_cloture_pourcentage}% ({periodes.periodes_cloturees} clôturées)
            </span>
          </div>
        </div>

        {/* Utilisateurs connectés / habilités */}
        <div className="bg-surface-card rounded-xl border border-border-subtle p-5 shadow-sm">
          <div className="flex items-center justify-between text-text-secondary mb-2">
            <span className="text-xs font-heading font-medium uppercase tracking-wider">
              Utilisateurs système
            </span>
            <div className="p-2 rounded-lg bg-surface-secondary text-text-secondary">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-sans font-bold text-text-primary tabular-nums">
            {utilisateurs.total_utilisateurs}
          </div>
          <div className="text-xs text-text-secondary mt-2 flex items-center justify-between border-t border-border-subtle/50 pt-2">
            <span>Comptes actifs</span>
            <span className="font-semibold text-status-success tabular-nums">
              {utilisateurs.utilisateurs_actifs} actifs
            </span>
          </div>
        </div>

        {/* Vigilance Audit & Anomalies */}
        <div className="bg-surface-card rounded-xl border border-border-subtle p-5 shadow-sm">
          <div className="flex items-center justify-between text-text-secondary mb-2">
            <span className="text-xs font-heading font-medium uppercase tracking-wider">
              Alertes d'audit
            </span>
            <div
              className={`p-2 rounded-lg ${
                audit.ecarts_en_attente > 0
                  ? 'bg-status-alert/15 text-status-alert'
                  : 'bg-status-success/15 text-status-success'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div
            className={`text-3xl font-sans font-bold tabular-nums ${
              audit.ecarts_en_attente > 0 ? 'text-status-alert' : 'text-text-primary'
            }`}
          >
            {audit.ecarts_en_attente}
          </div>
          <div className="text-xs text-text-secondary mt-2 flex items-center justify-between border-t border-border-subtle/50 pt-2">
            <span>Total écarts détectés</span>
            <span className="font-semibold text-text-primary tabular-nums">
              {audit.total_ecarts_detectes} écriture(s)
            </span>
          </div>
        </div>
      </div>

      {/* 3. Deux blocs : Répartition Territoriale & Profils Utilisateurs (RBAC) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Répartition territoriale & par classe */}
        <div className="bg-surface-card rounded-xl border border-border-subtle p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-accent" />
              <h3 className="text-base font-heading font-semibold text-text-primary">
                Maillage Territorial & Classes Postales
              </h3>
            </div>
            <Link to="/admin/bureaux">
              <Button size="sm" variant="ghost" className="text-xs inline-flex items-center gap-1">
                Gérer les bureaux <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>

          <div className="space-y-4">
            {/* Par classe */}
            <div>
              <span className="text-xs font-heading font-medium uppercase tracking-wider text-text-secondary">
                Classification des bureaux
              </span>
              <div className="grid grid-cols-3 gap-3 mt-2">
                {territoire.repartition_classes.map((cls) => (
                  <div
                    key={cls.classe}
                    className="p-3 rounded-lg bg-surface-secondary/50 border border-border-subtle/60 text-center"
                  >
                    <div className="text-lg font-bold text-text-primary tabular-nums">
                      {cls.nb_bureaux}
                    </div>
                    <div className="text-xs text-text-secondary font-medium">
                      Classe {cls.classe}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Par province */}
            <div className="pt-2 border-t border-border-subtle">
              <span className="text-xs font-heading font-medium uppercase tracking-wider text-text-secondary">
                Répartition par Province (Faritany)
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                {territoire.repartition_provinces.map((prov) => (
                  <div
                    key={prov.province_id}
                    className="flex items-center justify-between p-2 rounded bg-surface-secondary/30 text-xs"
                  >
                    <span className="truncate font-medium text-text-primary">{prov.province_nom}</span>
                    <span className="font-bold text-text-secondary tabular-nums ml-2">
                      {prov.nb_bureaux}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Utilisateurs & Habilitations RBAC */}
        <div className="bg-surface-card rounded-xl border border-border-subtle p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-paoma-blue dark:text-accent" />
              <h3 className="text-base font-heading font-semibold text-text-primary">
                Habilitations & Rôles Applicatifs (RBAC)
              </h3>
            </div>
            <span className="text-xs text-text-secondary tabular-nums">
              {utilisateurs.total_utilisateurs} comptes déclarés
            </span>
          </div>

          <div className="space-y-3">
            {Object.entries(utilisateurs.repartition_roles).map(([role, count]) => {
              const pct =
                utilisateurs.total_utilisateurs > 0
                  ? Math.round((count / utilisateurs.total_utilisateurs) * 100)
                  : 0;

              return (
                <div key={role} className="p-3 rounded-lg bg-surface-secondary/40 border border-border-subtle/60">
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="font-semibold text-text-primary">
                      {roleLabels[role] || role}
                    </span>
                    <span className="font-bold text-text-primary tabular-nums">
                      {count} <span className="text-xs font-normal text-text-secondary">({pct}%)</span>
                    </span>
                  </div>
                  <div className="w-full bg-surface-secondary rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-paoma-blue dark:bg-accent h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Flux Comptables Consolidés (Réseau National G58) */}
      <div className="bg-surface-card rounded-xl border border-border-subtle p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-status-success" />
            <h3 className="text-base font-heading font-semibold text-text-primary">
              Volumétrie & Flux Financiers Consolidés du Réseau
            </h3>
          </div>
          <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-surface-secondary text-text-secondary tabular-nums">
            {comptabilite.total_mouvements_g58} écritures comptables
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Total Débits */}
          <div className="p-4 rounded-lg bg-surface-secondary/50 border border-border-subtle/60">
            <div className="text-xs text-text-secondary font-medium uppercase mb-1">
              Recettes Globales (Débit)
            </div>
            <div className="text-xl font-sans font-bold text-status-success tabular-nums">
              {formatMGA(comptabilite.total_debit)}
            </div>
            <p className="text-xs text-text-secondary mt-1">Total réseau national</p>
          </div>

          {/* Total Crédits */}
          <div className="p-4 rounded-lg bg-surface-secondary/50 border border-border-subtle/60">
            <div className="text-xs text-text-secondary font-medium uppercase mb-1">
              Dépenses Globales (Crédit)
            </div>
            <div className="text-xl font-sans font-bold text-status-info tabular-nums">
              {formatMGA(comptabilite.total_credit)}
            </div>
            <p className="text-xs text-text-secondary mt-1">Total décaissements</p>
          </div>

          {/* Solde Global */}
          <div className="p-4 rounded-lg bg-surface-secondary/50 border border-border-subtle/60">
            <div className="text-xs text-text-secondary font-medium uppercase mb-1">
              Solde Net Consolidé
            </div>
            <div className="text-xl font-sans font-bold text-text-primary tabular-nums">
              {formatMGA(comptabilite.solde_global)}
            </div>
            <p className="text-xs text-text-secondary mt-1">Balance générale des flux</p>
          </div>

          {/* Mouvements d'encaisse */}
          <div className="p-4 rounded-lg bg-surface-secondary/50 border border-border-subtle/60">
            <div className="text-xs text-text-secondary font-medium uppercase mb-1">
              Mouvements d'encaisse
            </div>
            <div className="text-xl font-sans font-bold text-text-primary tabular-nums">
              {comptabilite.total_mouvements_encaisse}
            </div>
            <p className="text-xs text-text-secondary mt-1">Opérations de coffre / caisse</p>
          </div>
        </div>
      </div>

      {/* 5. Dernières actions de traçabilité réglementaire (AuditLogEntry) */}
      <div className="bg-surface-card rounded-xl border border-border-subtle overflow-hidden shadow-sm">
        <div className="p-5 border-b border-border-subtle flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-accent" />
            <h3 className="text-base font-heading font-semibold text-text-primary">
              Piste d'Audit Réglementaire & Sécurité
            </h3>
          </div>
          <span className="text-xs text-text-secondary tabular-nums">
            {audit.total_logs_audit} action(s) tracée(s)
          </span>
        </div>

        {audit.derniers_logs.length === 0 ? (
          <div className="p-8 text-center text-sm text-text-secondary">
            Aucun log d'audit enregistré pour l'instant.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-surface-secondary/40 border-b border-border-subtle text-xs font-heading font-semibold text-text-secondary uppercase tracking-wider">
                  <th className="py-3 px-4">Horodatage</th>
                  <th className="py-3 px-4">Auteur</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entité</th>
                  <th className="py-3 px-4">Détail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle/70">
                {audit.derniers_logs.map((log) => (
                  <tr key={log.id} className="hover:bg-surface-secondary/30 transition-colors text-xs">
                    <td className="py-2.5 px-4 text-text-secondary tabular-nums whitespace-nowrap">
                      {formatDateTime(log.created_at)}
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-text-primary">
                      {log.auteur}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-surface-secondary text-text-secondary">
                        {log.action_label || log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-mono text-text-secondary">
                      {log.model_name}
                    </td>
                    <td className="py-2.5 px-4 text-text-primary max-w-md truncate">
                      {log.detail || log.object_repr || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
