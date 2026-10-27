import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAdminDashboard } from '../../../api/dashboard';
import { getBureaux, getBureau, getPeriodesGestion } from '../../../api/referentiel';
import type { Bureau, PeriodeGestion } from '../../../types';
import { formatAriary, formatPercent, formatDateTime, formatDate } from '../../../lib/formatters';
import {
  Building2,
  Calendar,
  Users,
  Coins,
  ShieldCheck,
  RefreshCw,
  ArrowRight,
  ShieldAlert,
  Layers,
  MapPin,
  ChevronDown,
  History,
  Eye,
  AlertTriangle,
  Search,
  Filter,
  CheckCircle2,
  FileText,
  User,
  KeyRound,
  Lock,
  Unlock,
  Edit3,
  Trash2,
  PlusCircle,
  ExternalLink,
} from 'lucide-react';

interface AdminDashboardProps {
  onSelectBureauView?: (bureauId: number, periodeId?: number) => void;
}

export default function AdminDashboard({ onSelectBureauView }: AdminDashboardProps) {
  const { data, isLoading, error, refetch, isFetching } = useAdminDashboard();
  const [bureauxList, setBureauxList] = useState<Bureau[]>([]);
  const [selectedBureauId, setSelectedBureauId] = useState<number | null>(null);
  const [selectedBureauDetail, setSelectedBureauDetail] = useState<Bureau | null>(null);

  // Gestion des périodes de gestion du bureau sélectionné
  const [periodesList, setPeriodesList] = useState<PeriodeGestion[]>([]);
  const [selectedPeriodeId, setSelectedPeriodeId] = useState<number | null>(null);
  const [loadingPeriodes, setLoadingPeriodes] = useState(false);

  // Filtres et recherche locale pour le journal d'audit
  const [auditSearch, setAuditSearch] = useState('');
  const [auditActionFilter, setAuditActionFilter] = useState<string>('all');

  // Filtrage des logs d'audit (placé avant les retours conditionnels selon les règles des Hooks React)
  const filteredAuditLogs = useMemo(() => {
    if (!data?.audit?.derniers_logs) return [];
    return data.audit.derniers_logs.filter((log) => {
      const matchAction = auditActionFilter === 'all' || log.action === auditActionFilter;
      const q = auditSearch.toLowerCase().trim();
      const matchSearch =
        !q ||
        (log.action_label && log.action_label.toLowerCase().includes(q)) ||
        log.action.toLowerCase().includes(q) ||
        log.auteur.toLowerCase().includes(q) ||
        log.model_name.toLowerCase().includes(q) ||
        log.object_repr.toLowerCase().includes(q) ||
        (log.detail && log.detail.toLowerCase().includes(q));
      return matchAction && matchSearch;
    });
  }, [data?.audit?.derniers_logs, auditActionFilter, auditSearch]);

  useEffect(() => {
    getBureaux({ page: 1 })
      .then((res) => {
        const list = res.results || [];
        setBureauxList(list);
        if (list.length > 0 && selectedBureauId === null) {
          const firstBureau = list[0];
          setSelectedBureauId(firstBureau.id);
          setSelectedBureauDetail(firstBureau);
          loadPeriodesForBureau(firstBureau.id);
        }
      })
      .catch((err) => {
        console.error('Erreur chargement bureaux admin:', err);
      });
  }, []);

  const loadPeriodesForBureau = (bureauId: number) => {
    setLoadingPeriodes(true);
    getPeriodesGestion({ bureau: bureauId })
      .then((res) => {
        const pList = res.results || [];
        setPeriodesList(pList);
        // Sélectionner par défaut la période en cours (non clôturée) ou la plus récente
        const activePeriode = pList.find((p) => !p.cloturee) || (pList.length > 0 ? pList[0] : null);
        setSelectedPeriodeId(activePeriode ? activePeriode.id : null);
      })
      .catch((err) => {
        console.error('Erreur chargement périodes bureau:', err);
        setPeriodesList([]);
        setSelectedPeriodeId(null);
      })
      .finally(() => {
        setLoadingPeriodes(false);
      });
  };

  const handleBureauChange = (id: number) => {
    setSelectedBureauId(id);
    const found = bureauxList.find((b) => b.id === id);
    if (found) {
      setSelectedBureauDetail(found);
    } else {
      getBureau(id)
        .then((b) => setSelectedBureauDetail(b))
        .catch((err) => console.error('Erreur getBureau:', err));
    }
    loadPeriodesForBureau(id);
  };

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

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'RECTIFICATION':
        return {
          icon: <AlertTriangle className="w-3.5 h-3.5 text-accent" />,
          badgeClass: 'bg-accent/15 text-accent border-accent/30',
        };
      case 'CLOTURE':
        return {
          icon: <Lock className="w-3.5 h-3.5 text-status-alert" />,
          badgeClass: 'bg-status-alert/15 text-status-alert border-status-alert/30',
        };
      case 'OUVERTURE':
        return {
          icon: <Unlock className="w-3.5 h-3.5 text-status-success" />,
          badgeClass: 'bg-status-success/15 text-status-success border-status-success/30',
        };
      case 'CREATION':
        return {
          icon: <PlusCircle className="w-3.5 h-3.5 text-brand" />,
          badgeClass: 'bg-brand/15 text-brand border-brand/30',
        };
      case 'MODIFICATION':
        return {
          icon: <Edit3 className="w-3.5 h-3.5 text-blue-500" />,
          badgeClass: 'bg-blue-500/15 text-blue-500 border-blue-500/30',
        };
      case 'SUPPRESSION':
        return {
          icon: <Trash2 className="w-3.5 h-3.5 text-status-alert" />,
          badgeClass: 'bg-status-alert/15 text-status-alert border-status-alert/30',
        };
      case 'CONNEXION':
      case 'DECONNEXION':
        return {
          icon: <KeyRound className="w-3.5 h-3.5 text-text-secondary" />,
          badgeClass: 'bg-surface-secondary text-text-secondary border-border-subtle',
        };
      default:
        return {
          icon: <FileText className="w-3.5 h-3.5 text-text-secondary" />,
          badgeClass: 'bg-surface-secondary text-text-secondary border-border-subtle',
        };
    }
  };

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

          {/* Section Sélection d'un Bureau pour voir son état */}
          <div className="mt-6 pt-5 border-t border-border-subtle">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-brand" />
                <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wider">
                  Consulter l'état d'un bureau
                </h3>
              </div>
              <span className="text-[11px] text-text-secondary">
                {bureauxList.length} bureaux enregistrés
              </span>
            </div>

            {/* Sélecteurs Bureau & Période */}
            <div className="space-y-2.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Sélecteur de Bureau */}
                <div>
                  <label htmlFor="admin-bureau-select" className="block text-[11px] font-medium text-text-secondary mb-1">
                    Bureau de poste :
                  </label>
                  <div className="relative">
                    <select
                      id="admin-bureau-select"
                      data-testid="admin-select-bureau"
                      value={selectedBureauId ?? ''}
                      onChange={(e) => handleBureauChange(Number(e.target.value))}
                      className="w-full appearance-none pl-3 pr-8 py-2 text-xs font-medium bg-surface-secondary/70 dark:bg-surface-secondary text-text-primary border border-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-brand cursor-pointer truncate"
                    >
                      {bureauxList.map((b) => {
                        const provLabel = b.province_detail?.nom || `Province #${b.province}`;
                        return (
                          <option key={b.id} value={b.id}>
                            {b.ncodique} — {b.nom_bureau} ({provLabel})
                          </option>
                        );
                      })}
                    </select>
                    <ChevronDown className="w-4 h-4 text-text-secondary absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Sélecteur de Période */}
                <div>
                  <label htmlFor="admin-periode-select" className="block text-[11px] font-medium text-text-secondary mb-1">
                    Période de gestion :
                  </label>
                  <div className="relative">
                    <select
                      id="admin-periode-select"
                      data-testid="admin-select-periode"
                      value={selectedPeriodeId ?? ''}
                      disabled={loadingPeriodes || periodesList.length === 0}
                      onChange={(e) => setSelectedPeriodeId(e.target.value ? Number(e.target.value) : null)}
                      className="w-full appearance-none pl-3 pr-8 py-2 text-xs font-medium bg-surface-secondary/70 dark:bg-surface-secondary text-text-primary border border-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-brand cursor-pointer truncate disabled:opacity-60"
                    >
                      {loadingPeriodes ? (
                        <option value="">Chargement des périodes...</option>
                      ) : periodesList.length === 0 ? (
                        <option value="">Aucune période enregistrée</option>
                      ) : (
                        periodesList.map((p) => {
                          const statusLabel = p.cloturee ? 'Clôturée' : 'En cours';
                          const dateRange = `${formatDate(p.date_debut)} au ${formatDate(p.date_fin)}`;
                          return (
                            <option key={p.id} value={p.id}>
                              {dateRange} — {p.nom_receveur} ({statusLabel})
                            </option>
                          );
                        })
                      )}
                    </select>
                    <ChevronDown className="w-4 h-4 text-text-secondary absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Boutons d'action */}
              {selectedBureauId && (
                <div className="flex items-center justify-end gap-2 pt-1">
                  {onSelectBureauView && (
                    <button
                      type="button"
                      data-testid="btn-view-bureau-dashboard"
                      onClick={() => onSelectBureauView(selectedBureauId, selectedPeriodeId ?? undefined)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-brand text-white text-xs font-medium hover:bg-brand-hover transition-colors whitespace-nowrap shadow-sm"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Voir l'état
                    </button>
                  )}
                  <Link
                    to={`/historique-periodes?bureau=${selectedBureauId}`}
                    data-testid="btn-view-bureau-history"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border-subtle bg-surface-card hover:bg-surface-secondary text-text-primary text-xs font-medium transition-colors whitespace-nowrap"
                  >
                    <History className="w-3.5 h-3.5 text-text-secondary" />
                    Historique
                  </Link>
                </div>
              )}
            </div>

            {selectedBureauDetail && (
              <div className="mt-3 p-3 rounded-lg bg-surface-secondary/50 border border-border-subtle/50 text-xs flex flex-wrap items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="font-semibold text-text-primary flex items-center gap-2">
                    <span>{selectedBureauDetail.nom_bureau}</span>
                    <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-brand/10 text-brand font-medium">
                      Classe {selectedBureauDetail.classe || 'N/A'}
                    </span>
                  </div>
                  <div className="text-text-secondary text-[11px]">
                    Codique: <span className="font-mono">{selectedBureauDetail.ncodique}</span>
                    {selectedBureauDetail.ccp && (
                      <span> • CCP: <span className="font-mono">{selectedBureauDetail.ccp}</span></span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-text-secondary block">
                    {selectedBureauDetail.province_detail?.nom || `Province #${selectedBureauDetail.province}`}
                  </span>
                </div>
              </div>
            )}
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

      {/* 4. Journal d'audit et vigilance réglementaire */}
      <div className="bg-surface-card rounded-xl border border-border-subtle p-5 shadow-sm space-y-4">
        {/* En-tête avec indicateurs de vigilance */}
        <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-border-subtle">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-status-success/10 text-status-success shrink-0 mt-0.5">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-heading font-semibold text-text-primary">
                  Traçabilité & Vigilance Réglementaire
                </h2>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-status-success/15 text-status-success">
                  <span className="w-1.5 h-1.5 rounded-full bg-status-success animate-pulse" />
                  Journal Inaltérable
                </span>
              </div>
              <p className="text-xs font-sans text-text-secondary mt-0.5">
                Surveillance continue des opérations sensibles • Audit CDC § 6.2 (Append-only)
              </p>
            </div>
          </div>

          {/* Cartes d'indicateurs de vigilance rapide */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <div className="px-3 py-1.5 rounded-lg bg-surface-secondary/70 border border-border-subtle text-right">
              <span className="text-[10px] text-text-secondary uppercase tracking-wider block font-medium">
                Total Logs
              </span>
              <strong className="text-xs sm:text-sm font-mono text-text-primary">
                {audit.total_logs_audit}
              </strong>
            </div>

            <div className="px-3 py-1.5 rounded-lg bg-accent/10 border border-accent/25 text-right">
              <span className="text-[10px] text-accent uppercase tracking-wider block font-medium">
                Écarts en attente
              </span>
              <strong className="text-xs sm:text-sm font-mono text-accent">
                {audit.ecarts_en_attente}
              </strong>
            </div>

            <Link
              to="/audit"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-brand text-white text-xs font-medium hover:bg-brand-hover transition-colors shadow-sm"
            >
              <span>Espace Audit</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Barre d'outils : Recherche et Filtres */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={auditSearch}
              onChange={(e) => setAuditSearch(e.target.value)}
              placeholder="Rechercher par auteur, modèle, objet, détail..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-surface-secondary/70 dark:bg-surface-secondary text-text-primary border border-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
            />
            {auditSearch && (
              <button
                onClick={() => setAuditSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-text-secondary hover:text-text-primary"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-text-secondary shrink-0" />
            <div className="relative">
              <select
                value={auditActionFilter}
                onChange={(e) => setAuditActionFilter(e.target.value)}
                className="appearance-none pl-3 pr-8 py-1.5 text-xs bg-surface-secondary/70 dark:bg-surface-secondary text-text-primary border border-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-brand cursor-pointer"
              >
                <option value="all">Toutes les actions</option>
                <option value="RECTIFICATION">Rectifications</option>
                <option value="CLOTURE">Clôtures</option>
                <option value="OUVERTURE">Ouvertures</option>
                <option value="CREATION">Créations</option>
                <option value="MODIFICATION">Modifications</option>
                <option value="SUPPRESSION">Suppressions</option>
                <option value="CONNEXION">Connexions</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-text-secondary absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Liste chronologique moderne des événements */}
        {filteredAuditLogs.length === 0 ? (
          <div className="text-center py-8 px-4 rounded-xl border border-dashed border-border-subtle bg-surface-secondary/30 text-xs text-text-secondary">
            {audit.derniers_logs.length === 0
              ? "Aucun événement d'audit récent enregistré sur le réseau."
              : "Aucun événement ne correspond à vos critères de filtrage."}
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredAuditLogs.map((log) => {
              const { icon, badgeClass } = getActionBadge(log.action);
              return (
                <div
                  key={log.id}
                  className="p-3 sm:p-3.5 rounded-lg border border-border-subtle bg-surface-secondary/30 hover:bg-surface-secondary/60 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-surface-card border border-border-subtle/80 shrink-0 mt-0.5">
                      {icon}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] font-semibold ${badgeClass}`}>
                          {log.action_label || log.action}
                        </span>
                        <span className="font-semibold text-text-primary">
                          {log.model_name}
                        </span>
                        {log.object_repr && (
                          <span className="font-mono text-text-secondary px-1.5 py-0.2 rounded bg-surface-card border border-border-subtle/60 text-[11px]">
                            {log.object_repr}
                          </span>
                        )}
                      </div>

                      {log.detail ? (
                        <p className="text-text-secondary font-mono text-[11px] break-words line-clamp-2 max-w-2xl bg-surface-card/60 dark:bg-surface-secondary/80 p-1.5 rounded border border-border-subtle/40">
                          {log.detail}
                        </p>
                      ) : (
                        <p className="text-text-secondary/70 italic text-[11px]">
                          Opération tracée sans observations spécifiques.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-1 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border-subtle/50 text-[11px]">
                    <div className="flex items-center gap-1.5 text-text-primary font-medium">
                      <User className="w-3 h-3 text-text-secondary" />
                      <span>{log.auteur || 'Système'}</span>
                    </div>
                    <span className="text-text-secondary font-mono">
                      {formatDateTime(log.created_at)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer avec rappel réglementaire */}
        <div className="pt-2 flex items-center justify-between text-[11px] text-text-secondary border-t border-border-subtle/60">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-status-success shrink-0" />
            <span>Intégrité des écritures garantie conformément aux normes comptables postales.</span>
          </div>
          <span className="font-mono hidden sm:inline">
            Horodatage UTC+3 (Heure locale Madagascar)
          </span>
        </div>
      </div>
    </div>
  );
}
