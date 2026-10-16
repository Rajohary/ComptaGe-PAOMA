import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useInspecteurDashboard } from '../../../api/dashboard';
import { formatAriary, formatDate } from '../../../lib/formatters';
import type { BureauAvecEcartsItem } from '../../../types';
import {
  ShieldAlert,
  AlertTriangle,
  Building2,
  Search,
  Filter,
  CheckCircle2,
  RefreshCw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';

type SortField = 'nom_bureau' | 'nb_ecarts' | 'total_declare' | 'ecart_net';
type SortOrder = 'asc' | 'desc';

export default function InspecteurDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statutFilter, setStatutFilter] = useState<'tous' | 'non_rectifie' | 'rectifie'>('tous');
  const [selectedBureau, setSelectedBureau] = useState<string | number | undefined>(undefined);

  const [sortField, setSortField] = useState<SortField>('nb_ecarts');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const { data, isLoading, error, refetch, isFetching } = useInspecteurDashboard({
    bureau: selectedBureau,
    statut: statutFilter !== 'tous' ? statutFilter : undefined,
    search: searchTerm || undefined,
  });

  // Tri local des bureaux impactés
  const sortedBureaux = useMemo(() => {
    if (!data?.kpis?.bureaux_avec_ecarts) return [];
    return [...data.kpis.bureaux_avec_ecarts].sort((a, b) => {
      let valA: string | number = a[sortField];
      let valB: string | number = b[sortField];

      if (sortField === 'total_declare' || sortField === 'ecart_net') {
        valA = parseFloat(valA as string) || 0;
        valB = parseFloat(valB as string) || 0;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data?.kpis?.bureaux_avec_ecarts, sortField, sortOrder]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-3.5 h-3.5 opacity-40" />;
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-brand" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-brand" />
    );
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
        <div className="h-64 bg-surface-card rounded-xl border border-border-subtle" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-surface-card rounded-xl border border-status-alert/30 p-8 text-center">
        <ShieldAlert className="w-10 h-10 text-status-alert mx-auto mb-3" />
        <h2 className="text-lg font-heading font-semibold text-text-primary mb-1">
          Impossible de charger le tableau de bord d'audit
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

  const { kpis, derniers_ecarts } = data;

  return (
    <div className="space-y-6">
      {/* 1. Barre de filtre et de recherche */}
      <div className="bg-surface-card rounded-xl border border-border-subtle p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex-1 max-w-md relative">
          <Search className="w-4 h-4 text-text-secondary absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par bureau, compte, motif..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border-subtle bg-surface-primary text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:border-brand transition-colors"
          />
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-text-secondary font-medium shrink-0">
            <Filter className="w-3.5 h-3.5" />
            Statut :
          </div>
          <div className="inline-flex p-0.5 rounded-lg bg-surface-secondary border border-border-subtle text-xs">
            <button
              onClick={() => setStatutFilter('tous')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                statutFilter === 'tous'
                  ? 'bg-surface-card text-text-primary font-medium shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Tous
            </button>
            <button
              onClick={() => setStatutFilter('non_rectifie')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                statutFilter === 'non_rectifie'
                  ? 'bg-surface-card text-status-alert font-medium shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              En attente
            </button>
            <button
              onClick={() => setStatutFilter('rectifie')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                statutFilter === 'rectifie'
                  ? 'bg-surface-card text-status-success font-medium shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Rectifiés
            </button>
          </div>

          {selectedBureau && (
            <button
              onClick={() => setSelectedBureau(undefined)}
              className="text-xs px-2.5 py-1 rounded-md bg-accent/15 text-text-primary font-medium hover:bg-accent/25 transition-colors"
            >
              Filtré : bureau #{selectedBureau} ✕
            </button>
          )}

          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2 rounded-lg border border-border-subtle hover:bg-surface-secondary text-text-secondary transition-colors ml-auto"
            title="Rafraîchir les données"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Cartes de synthèse d'audit (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Écarts */}
        <div className="bg-surface-card rounded-xl border border-border-subtle p-5 shadow-sm">
          <div className="flex items-center justify-between text-text-secondary mb-2">
            <span className="text-xs uppercase tracking-wider font-sans font-medium">Anomalies Détectées</span>
            <div className="p-2 rounded-lg bg-status-alert/10 text-status-alert">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-sans tabular-nums text-status-alert">
            {kpis.total_ecarts_count}
          </div>
          <div className="text-xs font-sans text-text-secondary mt-2 flex items-center justify-between">
            <span>En attente : <strong className="text-status-alert font-bold">{kpis.nb_non_rectifies}</strong></span>
            <span>Régularisés : <strong className="text-status-success font-bold">{kpis.nb_rectifies}</strong></span>
          </div>
        </div>

        {/* Bureaux impactés */}
        <div className="bg-surface-card rounded-xl border border-border-subtle p-5 shadow-sm">
          <div className="flex items-center justify-between text-text-secondary mb-2">
            <span className="text-xs uppercase tracking-wider font-sans font-medium">Bureaux en Écart</span>
            <div className="p-2 rounded-lg bg-brand/10 text-brand">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-sans tabular-nums text-text-primary">
            {kpis.nb_bureaux_impactes}
          </div>
          <div className="text-xs font-sans text-text-secondary mt-2">
            Bureaux nécessitant un pointage
          </div>
        </div>

        {/* Écart Net Global */}
        <div className="bg-surface-card rounded-xl border border-border-subtle p-5 shadow-sm">
          <div className="flex items-center justify-between text-text-secondary mb-2">
            <span className="text-xs uppercase tracking-wider font-sans font-medium">Écart Net (Rectif − Déclaré)</span>
            <div className="p-2 rounded-lg bg-surface-secondary text-text-primary">
              {Number(kpis.total_ecart_net) >= 0 ? (
                <TrendingUp className="w-4 h-4 text-status-success" />
              ) : (
                <TrendingDown className="w-4 h-4 text-status-alert" />
              )}
            </div>
          </div>
          <div className="text-2xl font-bold font-sans tabular-nums text-text-primary">
            {formatAriary(kpis.total_ecart_net)}
          </div>
          <div className="text-xs font-sans text-text-secondary mt-2">
            Cumul absolu : <span className="font-medium text-text-primary tabular-nums">{formatAriary(kpis.total_ecart_absolu)}</span>
          </div>
        </div>

        {/* Rectifications cumulées */}
        <div className="bg-surface-card rounded-xl border border-border-subtle p-5 shadow-sm">
          <div className="flex items-center justify-between text-text-secondary mb-2">
            <span className="text-xs uppercase tracking-wider font-sans font-medium">Redressements</span>
            <div className="p-2 rounded-lg bg-accent/15 text-accent">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-sm font-sans space-y-1 mt-1">
            <div className="flex justify-between items-center">
              <span className="text-text-secondary text-xs">Augmentations :</span>
              <span className="font-bold text-status-success tabular-nums">+{formatAriary(kpis.total_augmentation, false)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-secondary text-xs">Diminutions :</span>
              <span className="font-bold text-status-alert tabular-nums">−{formatAriary(kpis.total_diminution, false)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Tableau des bureaux avec écarts en attente (triable) */}
      <div className="bg-surface-card rounded-xl border border-border-subtle overflow-hidden shadow-sm">
        <div className="p-5 border-b border-border-subtle flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-base font-heading font-semibold text-text-primary">
              Bureaux avec Écarts en Attente
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Cliquez sur un en-tête pour trier ou sur un bureau pour filtrer les écritures correspondantes.
            </p>
          </div>
          <span className="text-xs font-mono bg-surface-secondary text-text-secondary px-2.5 py-1 rounded">
            {sortedBureaux.length} bureau{sortedBureaux.length > 1 ? 'x' : ''} répertorié{sortedBureaux.length > 1 ? 's' : ''}
          </span>
        </div>

        {sortedBureaux.length === 0 ? (
          <div className="p-8 text-center text-sm text-text-secondary">
            <CheckCircle2 className="w-8 h-8 text-status-success mx-auto mb-2 opacity-80" />
            Aucun bureau ne présente d'écart correspondant aux critères.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-surface-secondary/50 text-text-secondary text-xs font-medium border-b border-border-subtle">
                  <th
                    onClick={() => toggleSort('nom_bureau')}
                    className="py-3 px-4 cursor-pointer hover:text-text-primary transition-colors select-none"
                  >
                    <div className="flex items-center gap-1.5">
                      Bureau de poste {getSortIcon('nom_bureau')}
                    </div>
                  </th>
                  <th className="py-3 px-4">Province</th>
                  <th
                    onClick={() => toggleSort('nb_ecarts')}
                    className="py-3 px-4 text-center cursor-pointer hover:text-text-primary transition-colors select-none"
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      Nb Écarts {getSortIcon('nb_ecarts')}
                    </div>
                  </th>
                  <th
                    onClick={() => toggleSort('total_declare')}
                    className="py-3 px-4 text-right cursor-pointer hover:text-text-primary transition-colors select-none"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      Montant Déclaré {getSortIcon('total_declare')}
                    </div>
                  </th>
                  <th className="py-3 px-4 text-right">Montant Rectifié</th>
                  <th
                    onClick={() => toggleSort('ecart_net')}
                    className="py-3 px-4 text-right cursor-pointer hover:text-text-primary transition-colors select-none"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      Écart Net {getSortIcon('ecart_net')}
                    </div>
                  </th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {sortedBureaux.map((b) => {
                  const isSelected = selectedBureau === b.bureau_id || selectedBureau === b.ncodique;
                  const diff = parseFloat(b.ecart_net) || 0;

                  return (
                    <tr
                      key={b.bureau_id}
                      className={`hover:bg-surface-secondary/40 transition-colors ${
                        isSelected ? 'bg-brand/5 font-medium' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-text-primary font-sans">
                            {b.nom_bureau}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded font-mono bg-surface-secondary text-text-secondary">
                            {b.ncodique}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-text-secondary font-sans text-xs">
                        {b.province_nom || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold font-mono bg-status-alert/15 text-status-alert">
                          {b.nb_ecarts}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right tabular-nums text-text-primary">
                        {formatAriary(b.total_declare)}
                      </td>
                      <td className="py-3.5 px-4 text-right tabular-nums text-text-primary">
                        {formatAriary(b.total_rectifie)}
                      </td>
                      <td className="py-3.5 px-4 text-right tabular-nums font-bold">
                        <span className={diff > 0 ? 'text-status-success' : diff < 0 ? 'text-status-alert' : 'text-text-secondary'}>
                          {diff > 0 ? '+' : ''}{formatAriary(b.ecart_net)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => setSelectedBureau(isSelected ? undefined : b.bureau_id)}
                          className={`text-xs px-2.5 py-1 rounded transition-colors ${
                            isSelected
                              ? 'bg-brand text-white'
                              : 'border border-border-subtle hover:bg-surface-secondary text-text-secondary'
                          }`}
                        >
                          {isSelected ? 'Désélectionner' : 'Filtrer'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. Derniers écarts constatés (Vue DIF) */}
      <div className="bg-surface-card rounded-xl border border-border-subtle overflow-hidden shadow-sm">
        <div className="p-5 border-b border-border-subtle flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-base font-heading font-semibold text-text-primary">
              Écritures en Anomalie Récentes (Vue DIF)
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Écritures comptables où Montant ≠ MontantRectif (CDC § 2 - Vue DIF).
            </p>
          </div>
          <Link
            to="/audit"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-brand hover:underline"
          >
            Ouvrir la vue d'audit complète <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {derniers_ecarts.length === 0 ? (
          <div className="p-8 text-center text-sm text-text-secondary">
            Aucun écart récent à afficher.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-surface-secondary/50 text-text-secondary text-xs font-medium border-b border-border-subtle">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Bureau</th>
                  <th className="py-3 px-4">Rubrique Comptable</th>
                  <th className="py-3 px-4 text-right">Montant Initial</th>
                  <th className="py-3 px-4 text-right">Rectifié</th>
                  <th className="py-3 px-4 text-right">Écart</th>
                  <th className="py-3 px-4">Motif du Redressement</th>
                  <th className="py-3 px-4 text-center">État</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {derniers_ecarts.map((item) => {
                  const ecartNum = parseFloat(item.ecart) || 0;

                  return (
                    <tr key={item.id} className="hover:bg-surface-secondary/30 transition-colors">
                      <td className="py-3 px-4 text-xs font-mono text-text-secondary whitespace-nowrap">
                        {formatDate(item.date_operation)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-text-primary text-xs font-sans">
                          {item.bureau?.nom_bureau}
                        </span>
                        <span className="text-[11px] text-text-secondary block font-mono">
                          {item.bureau?.ncodique}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs font-medium text-text-primary block">
                          {item.ligne_comptable?.compte} — {item.ligne_comptable?.libelle}
                        </span>
                        <span className="text-[11px] text-text-secondary">
                          Section {item.ligne_comptable?.section_code}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums text-text-primary text-xs">
                        {formatAriary(item.montant)}
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums font-medium text-text-primary text-xs">
                        {formatAriary(item.montant_rectifie)}
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums font-bold text-xs whitespace-nowrap">
                        <span className={ecartNum > 0 ? 'text-status-success' : 'text-status-alert'}>
                          {ecartNum > 0 ? '+' : ''}{formatAriary(item.ecart)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-text-secondary max-w-xs truncate">
                        {item.motif_rectification || <span className="italic text-text-secondary/50">Non renseigné</span>}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {item.est_rectifie ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-status-success/15 text-status-success">
                            <CheckCircle2 className="w-3 h-3" /> Rectifié
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-status-alert/15 text-status-alert">
                            <AlertTriangle className="w-3 h-3" /> En attente
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
