import React from 'react';
import { Link } from 'react-router-dom';
import { useAdminDashboard } from '../../../api/dashboard';
import { formatAriary, formatPercent, formatDateTime } from '../../../lib/formatters';
import {
  Building2,
  Calendar,
  Users,
  Coins,
  ShieldCheck,
  RefreshCw,
  ArrowRight,
  ShieldAlert,
  Activity,
  Layers,
  MapPin,
  FileCheck,
} from 'lucide-react';

export default function AdminDashboard() {
  const { data, isLoading, error, refetch, isFetching } = useAdminDashboard();

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-20 bg-surface-card rounded-xl border border-border-subtle" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-surface-card rounded-xl border border-border-subtle" />
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
      <div className="bg-surface-card rounded-xl border border-status-alert/30 p-8 text-center">
        <ShieldAlert className="w-10 h-10 text-status-alert mx-auto mb-3" />
        <h2 className="text-lg font-heading font-semibold text-text-primary mb-1">
          Impossible de charger la vue d'ensemble administrateur
        </h2>
        <p className="text-sm font-sans text-text-secondary max-w-md mx-auto mb-4">
          {error instanceof Error ? error.message : 'Erreur de communication avec le serveur API.'}
        </p>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand text-white text-sm font-medium hover:bg-brand-hover transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Réessayer
        </button>
      </div>
    );
  }

  const { territoire, periodes, utilisateurs, comptabilite, audit } = data;

  const totalClassesCount = territoire.repartition_classes.reduce((acc, c) => acc + c.nb_bureaux, 0) || 1;

  return (
    <div className="space-y-6">
      {/* 1. Titre et rafraîchissement */}
      <div className="bg-surface-card rounded-xl border border-border-subtle p-5 shadow-sm flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-heading font-bold text-text-primary">
            Vue d'Ensemble Globale du Réseau Postal
          </h1>
          <p className="text-sm font-sans text-text-secondary mt-0.5">
            Supervision centrale nationale de Paositra Malagasy • Référentiel, flux financiers et audit.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="p-2.5 rounded-lg border border-border-subtle hover:bg-surface-secondary text-text-secondary transition-colors shrink-0"
          title="Rafraîchir les métriques"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* 2. KPIs Macro (4 cartes) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Bureaux Actifs */}
        <div className="bg-surface-card rounded-xl border border-border-subtle p-5 shadow-sm">
          <div className="flex items-center justify-between text-text-secondary mb-2">
            <span className="text-xs uppercase tracking-wider font-sans font-medium">Bureaux Actifs</span>
            <div className="p-2 rounded-lg bg-brand/10 text-brand">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-sans tabular-nums text-text-primary">
            {territoire.bureaux_actifs_count}{' '}
            <span className="text-sm font-normal text-text-secondary">/ {territoire.total_bureaux}</span>
          </div>
          <div className="text-xs font-sans text-text-secondary mt-2 flex items-center justify-between">
            <span>{territoire.total_provinces} provinces</span>
            <span className="text-status-success font-medium">
              {formatPercent((territoire.bureaux_actifs_count / (territoire.total_bureaux || 1)) * 100)} actifs
            </span>
          </div>
        </div>

        {/* Périodes de Gestion */}
        <div className="bg-surface-card rounded-xl border border-border-subtle p-5 shadow-sm">
          <div className="flex items-center justify-between text-text-secondary mb-2">
            <span className="text-xs uppercase tracking-wider font-sans font-medium">Périodes en Cours</span>
            <div className="p-2 rounded-lg bg-status-success/10 text-status-success">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-sans tabular-nums text-status-success">
            {periodes.periodes_en_cours}
          </div>
          <div className="text-xs font-sans text-text-secondary mt-2 flex items-center justify-between">
            <span>Clôturées : {periodes.periodes_cloturees}</span>
            <span>Taux clôture : {formatPercent(periodes.taux_cloture_pourcentage)}</span>
          </div>
        </div>

        {/* Utilisateurs RBAC */}
        <div className="bg-surface-card rounded-xl border border-border-subtle p-5 shadow-sm">
          <div className="flex items-center justify-between text-text-secondary mb-2">
            <span className="text-xs uppercase tracking-wider font-sans font-medium">Agents & Accès</span>
            <div className="p-2 rounded-lg bg-accent/15 text-accent">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-sans tabular-nums text-text-primary">
            {utilisateurs.total_utilisateurs}
          </div>
          <div className="text-xs font-sans text-text-secondary mt-2">
            {utilisateurs.repartition_roles.RECEVEUR} receveurs • {utilisateurs.repartition_roles.INSPECTEUR} inspecteurs
          </div>
        </div>

        {/* Volumétrie financière */}
        <div className="bg-surface-card rounded-xl border border-border-subtle p-5 shadow-sm">
          <div className="flex items-center justify-between text-text-secondary mb-2">
            <span className="text-xs uppercase tracking-wider font-sans font-medium">Flux Déclarés (G58)</span>
            <div className="p-2 rounded-lg bg-paoma-blue-soft text-brand">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-sans tabular-nums text-text-primary">
            {formatAriary(comptabilite.total_debit)}
          </div>
          <div className="text-xs font-sans text-text-secondary mt-2 flex items-center justify-between">
            <span>Crédit : {formatAriary(comptabilite.total_credit, false)}</span>
            <span className="font-mono text-text-secondary">{comptabilite.total_mouvements_g58} mvts</span>
          </div>
        </div>
      </div>

      {/* 3. Deuxième ligne : Territoire & Répartition */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Répartition par province */}
        <div className="bg-surface-card rounded-xl border border-border-subtle p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-brand" />
              <h2 className="text-sm font-heading font-semibold text-text-primary uppercase tracking-wider">
                Maillage Postal par Province (Faritany)
              </h2>
            </div>
            <Link to="/admin/bureaux" className="text-xs text-brand hover:underline flex items-center gap-1">
              Gérer les bureaux <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="divide-y divide-border-subtle/70">
            {territoire.repartition_provinces.map((prov) => (
              <div key={prov.province_id} className="py-2.5 flex items-center justify-between text-sm">
                <span className="text-text-primary font-medium">
                  {prov.nprovince}. {prov.province_nom}
                </span>
                <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-surface-secondary text-text-secondary">
                  {prov.nb_bureaux} bureau{prov.nb_bureaux > 1 ? 'x' : ''}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Classification des bureaux & Utilisateurs */}
        <div className="bg-surface-card rounded-xl border border-border-subtle p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Layers className="w-4 h-4 text-accent" />
              <h2 className="text-sm font-heading font-semibold text-text-primary uppercase tracking-wider">
                Classification des Bureaux
              </h2>
            </div>
            <div className="space-y-3">
              {territoire.repartition_classes.map((cls) => {
                const pct = Math.round((cls.nb_bureaux / totalClassesCount) * 100);
                return (
                  <div key={cls.classe} className="text-sm">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium text-text-primary text-xs">
                        Classe {cls.classe}
                      </span>
                      <span className="text-xs text-text-secondary tabular-nums">
                        {cls.nb_bureaux} bureau{cls.nb_bureaux > 1 ? 'x' : ''} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-surface-secondary rounded-full h-2 overflow-hidden">
                      <div className="bg-brand h-full rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-border-subtle">
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider block mb-2">
              Comptes Utilisateurs par Rôle (RBAC)
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2 rounded bg-surface-secondary/50 border border-border-subtle/50">
                <span className="text-text-secondary block">Admin</span>
                <strong className="text-sm font-mono text-text-primary">{utilisateurs.repartition_roles.ADMIN}</strong>
              </div>
              <div className="p-2 rounded bg-surface-secondary/50 border border-border-subtle/50">
                <span className="text-text-secondary block">Receveurs</span>
                <strong className="text-sm font-mono text-text-primary">{utilisateurs.repartition_roles.RECEVEUR}</strong>
              </div>
              <div className="p-2 rounded bg-surface-secondary/50 border border-border-subtle/50">
                <span className="text-text-secondary block">Guichet</span>
                <strong className="text-sm font-mono text-text-primary">{utilisateurs.repartition_roles.AGENT_SAISIE}</strong>
              </div>
              <div className="p-2 rounded bg-surface-secondary/50 border border-border-subtle/50">
                <span className="text-text-secondary block">Inspecteurs</span>
                <strong className="text-sm font-mono text-text-primary">{utilisateurs.repartition_roles.INSPECTEUR}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Journal d'audit et vigilance */}
      <div className="bg-surface-card rounded-xl border border-border-subtle p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-status-success" />
            <h2 className="text-sm font-heading font-semibold text-text-primary uppercase tracking-wider">
              Traçabilité & Vigilance Réglementaire (Derniers Événements d'Audit)
            </h2>
          </div>
          <span className="text-xs text-text-secondary font-mono">
            {audit.total_logs_audit} entrées d'audit enregistrées
          </span>
        </div>

        {audit.derniers_logs.length === 0 ? (
          <div className="text-center py-6 text-xs text-text-secondary">
            Aucun événement d'audit récent.
          </div>
        ) : (
          <div className="divide-y divide-border-subtle text-xs">
            {audit.derniers_logs.map((log) => (
              <div key={log.id} className="py-2.5 flex items-start justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-text-primary">
                      {log.action_label || log.action}
                    </span>
                    <span className="text-text-secondary">• {log.model_name} #{log.object_repr}</span>
                  </div>
                  {log.detail && (
                    <p className="text-text-secondary font-mono text-[11px] truncate max-w-xl">
                      {log.detail}
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <span className="font-medium text-text-primary block">{log.auteur}</span>
                  <span className="text-text-secondary text-[11px] font-mono">{formatDateTime(log.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
