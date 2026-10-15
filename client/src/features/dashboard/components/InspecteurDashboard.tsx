import React, { useState, useEffect, useCallback } from 'react';
import { getInspecteurDashboard, getEcartsList } from '../../../api/dashboard';
import type { InspecteurDashboardData, EcartItem } from '../../../types';
import { formatMGA, formatDate } from '../../../lib/formatters';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle,
  Clock,
  Building2,
  Search,
  Filter,
  RefreshCw,
  Scale,
  FileText,
  UserCheck,
  ChevronRight,
  SlidersHorizontal,
} from 'lucide-react';

export const InspecteurDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<InspecteurDashboardData | null>(null);
  const [ecarts, setEcarts] = useState<EcartItem[]>([]);
  const [totalEcartsCount, setTotalEcartsCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [tableLoading, setTableLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Filtres
  const [statutFilter, setStatutFilter] = useState<string>('tous');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [selectedBureau, setSelectedBureau] = useState<string>('');

  // 1. Chargement initial des KPIs du Dashboard Inspecteur
  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getInspecteurDashboard({
        statut: statutFilter !== 'tous' ? statutFilter : undefined,
        search: searchFilter || undefined,
        bureau: selectedBureau || undefined,
      });
      setDashboardData(res);
      setEcarts(res.derniers_ecarts || []);
      setTotalEcartsCount(res.kpis.total_ecarts_count);
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string }; message?: string };
      setError(e.data?.detail || e.message || 'Impossible de charger le tableau de bord Inspecteur.');
    } finally {
      setLoading(false);
    }
  }, [statutFilter, searchFilter, selectedBureau]);

  // 2. Chargement filtré de la liste complète des écarts (Vue DIF)
  const loadFilteredEcarts = useCallback(async () => {
    setTableLoading(true);
    try {
      const res = await getEcartsList({
        statut: statutFilter !== 'tous' ? statutFilter : undefined,
        search: searchFilter || undefined,
        bureau: selectedBureau || undefined,
        page_size: 50,
      });
      setEcarts(res.results);
      setTotalEcartsCount(res.count);
      if (res.kpis && dashboardData) {
        setDashboardData((prev) => (prev ? { ...prev, kpis: res.kpis! } : prev));
      }
    } catch (err) {
      console.error('Erreur lors du filtrage des écarts', err);
    } finally {
      setTableLoading(false);
    }
  }, [statutFilter, searchFilter, selectedBureau, dashboardData]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleApplyFilter = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    loadFilteredEcarts();
  };

  const handleSelectBureauFilter = (bureauIdOrCodique: string | number) => {
    const val = bureauIdOrCodique.toString();
    setSelectedBureau((prev) => (prev === val ? '' : val));
  };

  const handleResetFilters = () => {
    setStatutFilter('tous');
    setSearchFilter('');
    setSelectedBureau('');
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse" data-testid="dashboard-inspecteur-loading">
        <div className="h-20 bg-surface-card rounded-xl border border-border-subtle" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-surface-card rounded-xl border border-border-subtle" />
          ))}
        </div>
        <div className="h-64 bg-surface-card rounded-xl border border-border-subtle" />
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="bg-surface-card rounded-xl border border-status-alert/30 p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-status-alert/10 text-status-alert flex items-center justify-center mx-auto mb-3">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-heading font-semibold text-text-primary mb-1">
          Erreur de chargement
        </h3>
        <p className="text-sm font-sans text-text-secondary max-w-md mx-auto mb-4">
          {error || "Une erreur inattendue est survenue lors de l'accès aux données d'audit."}
        </p>
        <Button onClick={loadDashboardData} variant="secondary" className="inline-flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          Réessayer
        </Button>
      </div>
    );
  }

  const { kpis } = dashboardData;

  return (
    <div className="space-y-6" data-testid="dashboard-inspecteur">
      {/* 1. En-tête contextuel d'audit et de surveillance */}
      <div className="bg-surface-card rounded-xl border border-border-subtle p-5 md:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-status-alert/10 text-status-alert">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-heading font-bold text-text-primary">
                  Contrôle & Inspection Comptable
                </h2>
                <span className="text-xs font-sans font-medium px-2.5 py-0.5 rounded-full bg-status-alert/10 text-status-alert">
                  Vue DIF
                </span>
              </div>
              <p className="text-sm font-sans text-text-secondary mt-1">
                Détection automatique des discordances de montants (`Montant ≠ MontantRectif`), pointage contradictoire et motifs de redressement.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-center">
            {selectedBureau && (
              <span className="text-xs px-2.5 py-1 rounded bg-paoma-blue/10 text-paoma-blue dark:text-accent font-medium flex items-center gap-1.5">
                <span>Filtre bureau : {selectedBureau}</span>
                <button
                  type="button"
                  onClick={() => setSelectedBureau('')}
                  className="hover:text-status-alert font-bold"
                  title="Retirer le filtre"
                >
                  ×
                </button>
              </span>
            )}
            <Button onClick={loadDashboardData} variant="ghost" size="sm" title="Actualiser">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Cartes de synthèse d'audit (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Écarts */}
        <div className="bg-surface-card rounded-xl border border-border-subtle p-4 shadow-sm">
          <div className="flex items-center justify-between text-text-secondary mb-1.5">
            <span className="text-xs font-heading font-medium uppercase tracking-wider">
              Total écarts
            </span>
            <AlertTriangle className="w-4 h-4 text-status-alert" />
          </div>
          <div className="text-2xl font-sans font-bold text-text-primary tabular-nums">
            {kpis.total_ecarts_count}
          </div>
          <p className="text-xs text-text-secondary mt-1">Écritures en anomalie</p>
        </div>

        {/* En attente de régularisation */}
        <div className="bg-surface-card rounded-xl border border-border-subtle p-4 shadow-sm">
          <div className="flex items-center justify-between text-text-secondary mb-1.5">
            <span className="text-xs font-heading font-medium uppercase tracking-wider">
              En attente
            </span>
            <Clock className="w-4 h-4 text-accent" />
          </div>
          <div className="text-2xl font-sans font-bold text-status-alert tabular-nums">
            {kpis.nb_non_rectifies}
          </div>
          <p className="text-xs text-text-secondary mt-1">Non encore redressés</p>
        </div>

        {/* Rectifiés */}
        <div className="bg-surface-card rounded-xl border border-border-subtle p-4 shadow-sm">
          <div className="flex items-center justify-between text-text-secondary mb-1.5">
            <span className="text-xs font-heading font-medium uppercase tracking-wider">
              Rectifiés
            </span>
            <CheckCircle className="w-4 h-4 text-status-success" />
          </div>
          <div className="text-2xl font-sans font-bold text-status-success tabular-nums">
            {kpis.nb_rectifies}
          </div>
          <p className="text-xs text-text-secondary mt-1">Motifs renseignés</p>
        </div>

        {/* Écart Net Global */}
        <div className="bg-surface-card rounded-xl border border-border-subtle p-4 shadow-sm">
          <div className="flex items-center justify-between text-text-secondary mb-1.5">
            <span className="text-xs font-heading font-medium uppercase tracking-wider">
              Écart Net
            </span>
            <Scale className="w-4 h-4 text-paoma-blue dark:text-accent" />
          </div>
          <div className="text-xl font-sans font-bold text-text-primary tabular-nums tracking-tight">
            {formatMGA(kpis.total_ecart_net)}
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Absolu : <span className="tabular-nums font-medium">{formatMGA(kpis.total_ecart_absolu)}</span>
          </p>
        </div>

        {/* Bureaux Impactés */}
        <div className="bg-surface-card rounded-xl border border-border-subtle p-4 shadow-sm">
          <div className="flex items-center justify-between text-text-secondary mb-1.5">
            <span className="text-xs font-heading font-medium uppercase tracking-wider">
              Bureaux
            </span>
            <Building2 className="w-4 h-4 text-text-secondary" />
          </div>
          <div className="text-2xl font-sans font-bold text-text-primary tabular-nums">
            {kpis.nb_bureaux_impactes}
          </div>
          <p className="text-xs text-text-secondary mt-1">Bureaux concernés</p>
        </div>
      </div>

      {/* 3. Bureaux avec écarts en attente (Tableau de priorisation) */}
      <div className="bg-surface-card rounded-xl border border-border-subtle overflow-hidden shadow-sm">
        <div className="p-5 border-b border-border-subtle flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-accent" />
            <h3 className="text-base font-heading font-semibold text-text-primary">
              Bureaux de poste avec écarts comptables
            </h3>
          </div>
          <span className="text-xs font-sans text-text-secondary">
            Triés par volume d'anomalies décroissant
          </span>
        </div>

        {kpis.bureaux_avec_ecarts.length === 0 ? (
          <div className="p-8 text-center text-sm text-status-success flex flex-col items-center justify-center">
            <CheckCircle className="w-8 h-8 text-status-success mb-2" />
            <p className="font-medium">Aucun bureau de poste n'a d'écart comptable non résolu.</p>
            <p className="text-xs text-text-secondary mt-1">Toutes les écritures déclarées sont conformes.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-surface-secondary/40 border-b border-border-subtle text-xs font-heading font-semibold text-text-secondary uppercase tracking-wider">
                  <th className="py-3 px-4">Bureau de poste</th>
                  <th className="py-3 px-4">Province</th>
                  <th className="py-3 px-4 text-center">Écarts</th>
                  <th className="py-3 px-4 text-right">Montant Déclaré</th>
                  <th className="py-3 px-4 text-right">Montant Rectifié</th>
                  <th className="py-3 px-4 text-right">Écart Net</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle/70">
                {kpis.bureaux_avec_ecarts.map((b) => {
                  const isSelected = selectedBureau === b.ncodique.toString() || selectedBureau === b.bureau_id.toString();

                  return (
                    <tr
                      key={b.bureau_id}
                      className={`hover:bg-surface-secondary/30 transition-colors ${
                        isSelected ? 'bg-paoma-blue/5 dark:bg-accent/10 font-medium' : ''
                      }`}
                    >
                      <td className="py-3 px-4 text-text-primary">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{b.nom_bureau}</span>
                          <span className="text-xs text-text-secondary tabular-nums">
                            ({b.ncodique})
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-text-secondary">{b.province_nom || '—'}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-status-alert/15 text-status-alert tabular-nums">
                          {b.nb_ecarts}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums text-text-secondary">
                        {formatMGA(b.total_declare)}
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums text-text-primary font-medium">
                        {formatMGA(b.total_rectifie)}
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums font-bold text-status-alert">
                        {formatMGA(b.ecart_net)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Button
                          size="sm"
                          variant={isSelected ? 'primary' : 'ghost'}
                          onClick={() => handleSelectBureauFilter(b.ncodique)}
                          className="text-xs"
                        >
                          {isSelected ? 'Filtre actif' : 'Pointer'}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. Barre de filtres et recherche pour la vue DIF */}
      <div className="bg-surface-card rounded-xl border border-border-subtle p-4 shadow-sm">
        <form onSubmit={handleApplyFilter} className="flex flex-col md:flex-row items-center gap-3">
          <div className="flex-1 w-full relative">
            <Search className="w-4 h-4 text-text-secondary/60 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Rechercher par bureau, compte, libellé ou motif..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-border-subtle bg-surface-primary text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-brand/30"
              data-testid="input-search-ecarts"
            />
          </div>

          <div className="w-full md:w-48">
            <select
              value={statutFilter}
              onChange={(e) => setStatutFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-border-subtle bg-surface-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-brand/30"
              data-testid="select-statut-ecarts"
            >
              <option value="tous">Tous les statuts</option>
              <option value="non_rectifie">En attente (non rectifié)</option>
              <option value="rectifie">Rectifié</option>
            </select>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Button type="submit" variant="primary" size="sm" className="inline-flex items-center gap-1.5 flex-1 md:flex-initial">
              <Filter className="w-4 h-4" />
              <span>Filtrer</span>
            </Button>
            {(searchFilter || statutFilter !== 'tous' || selectedBureau) && (
              <Button type="button" variant="ghost" size="sm" onClick={handleResetFilters} title="Effacer les filtres">
                Réinitialiser
              </Button>
            )}
          </div>
        </form>
      </div>

      {/* 5. Tableau détaillé des écritures en écart (Vue DIF) */}
      <div className="bg-surface-card rounded-xl border border-border-subtle overflow-hidden shadow-sm">
        <div className="p-5 border-b border-border-subtle flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-status-alert" />
            <h3 className="text-base font-heading font-semibold text-text-primary">
              Écritures en anomalie (Vue DIF)
            </h3>
          </div>
          <span className="text-xs text-text-secondary tabular-nums">
            {totalEcartsCount} écriture(s) trouvée(s)
          </span>
        </div>

        {tableLoading ? (
          <div className="p-8 text-center text-text-secondary text-sm">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-paoma-blue dark:text-accent" />
            Chargement des anomalies...
          </div>
        ) : ecarts.length === 0 ? (
          <div className="p-8 text-center text-text-secondary text-sm">
            Aucun écart ne correspond aux critères de filtre sélectionnés.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse" data-testid="table-ecarts">
              <thead>
                <tr className="bg-surface-secondary/40 border-b border-border-subtle text-xs font-heading font-semibold text-text-secondary uppercase tracking-wider">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Bureau</th>
                  <th className="py-3 px-4">Imputation comptable</th>
                  <th className="py-3 px-4 text-right">Déclaré</th>
                  <th className="py-3 px-4 text-right">Rectifié</th>
                  <th className="py-3 px-4 text-right">Écart</th>
                  <th className="py-3 px-4">Motif de rectification</th>
                  <th className="py-3 px-4 text-center">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle/70">
                {ecarts.map((item) => (
                  <tr key={item.id} className="hover:bg-surface-secondary/30 transition-colors">
                    <td className="py-3 px-4 text-xs font-medium text-text-secondary tabular-nums whitespace-nowrap">
                      {formatDate(item.date_operation)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-text-primary">
                        {item.bureau.nom_bureau}
                      </div>
                      <div className="text-xs text-text-secondary tabular-nums">
                        Codique {item.bureau.ncodique}
                      </div>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs px-1.5 py-0.5 rounded bg-surface-secondary font-mono font-medium text-text-primary">
                          {item.ligne_comptable.compte || 'AD'}
                        </span>
                        <span className="font-medium text-text-primary truncate">
                          {item.ligne_comptable.libelle}
                        </span>
                      </div>
                      <div className="text-xs text-text-secondary mt-0.5">
                        Section {item.ligne_comptable.section_code || 'G58'} • Saisi par {item.saisi_par}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums text-text-secondary">
                      {formatMGA(item.montant)}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums font-semibold text-text-primary">
                      {formatMGA(item.montant_rectifie)}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums font-bold text-status-alert whitespace-nowrap">
                      {parseFloat(item.ecart) >= 0 ? '+' : ''}
                      {formatMGA(item.ecart)}
                    </td>
                    <td className="py-3 px-4 text-xs max-w-sm text-text-secondary">
                      {item.motif_rectification ? (
                        <div className="italic text-text-primary bg-surface-secondary/50 p-1.5 rounded border border-border-subtle/60">
                          « {item.motif_rectification} »
                        </div>
                      ) : (
                        <span className="text-status-alert font-medium flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Aucun motif renseigné
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {item.est_rectifie ? (
                        <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium bg-status-success/15 text-status-success">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Rectifié
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium bg-status-alert/15 text-status-alert">
                          <Clock className="w-3.5 h-3.5" />
                          En attente
                        </span>
                      )}
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
