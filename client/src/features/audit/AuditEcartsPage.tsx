import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getEcarts, rectifierMouvement, type EcartsSearchParams } from '../../api/audit';
import { getBureaux, getProvinces } from '../../api/referentiel';
import { formatAriary, formatDate, parseNumber, formatThousandsInput } from '../../lib/formatters';
import type { EcartItem, RectificationInput } from '../../types';
import { Button } from '../../components/ui/Button';
import { Pagination } from '../../components/ui/Pagination';
import { RectificationModal } from './components/RectificationModal';
import {
  ShieldAlert,
  Search,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
  Scale,
  Building2,
  ArrowUpDown,
  SlidersHorizontal,
} from 'lucide-react';

export const AuditEcartsPage: React.FC = () => {
  const queryClient = useQueryClient();

  // Filtres
  const [bureauFilter, setBureauFilter] = useState<string>('');
  const [provinceFilter, setProvinceFilter] = useState<string>('');
  const [statutFilter, setStatutFilter] = useState<'tous' | 'non_rectifie' | 'rectifie'>('tous');
  const [minMontant, setMinMontant] = useState<string>('');
  const [maxMontant, setMaxMontant] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [ordering, setOrdering] = useState<string>('-date_operation');
  const [page, setPage] = useState<number>(1);
  const pageSize = 10;

  // État de la modal de rectification
  const [selectedEcart, setSelectedEcart] = useState<EcartItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Requêtes référentiel pour les sélecteurs
  const { data: bureauxData } = useQuery({
    queryKey: ['bureaux', 'all'],
    queryFn: () => getBureaux(),
    staleTime: 5 * 60_000,
  });

  const { data: provincesData } = useQuery({
    queryKey: ['provinces', 'all'],
    queryFn: () => getProvinces(),
    staleTime: 10 * 60_000,
  });

  // Construction des paramètres de recherche pour l'API
  const queryParams: EcartsSearchParams = useMemo(() => {
    return {
      bureau: bureauFilter ? bureauFilter : undefined,
      province: provinceFilter ? provinceFilter : undefined,
      statut: statutFilter !== 'tous' ? statutFilter : undefined,
      search: search.trim() ? search.trim() : undefined,
      ordering,
      page,
      page_size: pageSize,
    };
  }, [bureauFilter, provinceFilter, statutFilter, search, ordering, page, pageSize]);

  // Requête principale des écarts
  const {
    data: ecartsData,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['audit', 'ecarts', queryParams],
    queryFn: () => getEcarts(queryParams),
    staleTime: 10_000,
  });

  // Mutation de rectification
  const mutation = useMutation({
    mutationFn: ({ id, input }: { id: number; input: RectificationInput }) =>
      rectifierMouvement(id, input),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['audit', 'ecarts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'inspecteur'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'receveur'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'admin'] });
      setIsModalOpen(false);
      setSelectedEcart(null);
      setSuccessMessage(
        `Écriture rectifiée avec succès ! Montant final : ${formatAriary(updated.montant_rectifie)}`
      );
      setTimeout(() => setSuccessMessage(null), 5000);
    },
    onError: (err: any) => {
      setErrorMessage(
        err?.detail || err?.message || 'Erreur lors de la validation du redressement'
      );
      setTimeout(() => setErrorMessage(null), 6000);
    },
  });

  const handleOpenRectification = (ecart: EcartItem) => {
    setSelectedEcart(ecart);
    setIsModalOpen(true);
  };

  const handleRectificationSubmit = async (input: RectificationInput) => {
    if (!selectedEcart) return;
    await mutation.mutateAsync({ id: selectedEcart.id, input });
  };

  // Filtrage local complémentaire par montant (min/max montant déclaré ou rectifié)
  const displayedEcarts = useMemo(() => {
    if (!ecartsData?.results) return [];
    let items = ecartsData.results;

    if (minMontant) {
      const min = parseNumber(minMontant, NaN);
      if (!isNaN(min)) {
        items = items.filter(
          (item) => Math.abs(parseFloat(item.montant) || 0) >= min || Math.abs(parseFloat(item.ecart) || 0) >= min
        );
      }
    }

    if (maxMontant) {
      const max = parseNumber(maxMontant, NaN);
      if (!isNaN(max)) {
        items = items.filter(
          (item) => Math.abs(parseFloat(item.montant) || 0) <= max && Math.abs(parseFloat(item.ecart) || 0) <= max
        );
      }
    }

    return items;
  }, [ecartsData?.results, minMontant, maxMontant]);

  const kpis = ecartsData?.kpis;
  const totalCount = ecartsData?.count || 0;

  const toggleSort = (field: string) => {
    if (ordering === `-${field}`) {
      setOrdering(field);
    } else if (ordering === field) {
      setOrdering(`-${field}`);
    } else {
      setOrdering(`-${field}`);
    }
    setPage(1);
  };

  const resetFilters = () => {
    setBureauFilter('');
    setProvinceFilter('');
    setStatutFilter('tous');
    setMinMontant('');
    setMaxMontant('');
    setSearch('');
    setOrdering('-date_operation');
    setPage(1);
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* En-tête de la page */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent mb-1">
            <ShieldAlert className="w-4 h-4" />
            <span>Inspection & Contrôle Comptable</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-text-primary">
            Audit des Écarts & Vue DIF
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Surveillance contradictoire, détection des anomalies de saisie G58 et redressement d'audit
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </Button>
        </div>
      </div>

      {/* Messages de feedback */}
      {successMessage && (
        <div className="p-4 rounded-lg bg-status-success/15 border border-status-success/30 text-status-success flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium">{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-lg bg-status-alert/15 border border-status-alert/30 text-status-alert flex items-center gap-2 animate-in fade-in">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium">{errorMessage}</span>
        </div>
      )}

      {/* Cartes KPIs Synthèse rapide */}
      {kpis && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-surface-card border border-border-subtle rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-text-secondary uppercase">Total Écarts</span>
              <span className="p-2 rounded-lg bg-accent/10 text-accent">
                <AlertTriangle className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-2 text-2xl font-heading font-bold text-text-primary">
              {kpis.total_ecarts_count}
            </div>
            <div className="mt-1 text-xs text-text-secondary flex items-center gap-2">
              <span className="text-status-alert font-semibold">{kpis.nb_non_rectifies} en attente</span>
              <span>•</span>
              <span className="text-status-success font-semibold">{kpis.nb_rectifies} rectifiés</span>
            </div>
          </div>

          <div className="bg-surface-card border border-border-subtle rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-text-secondary uppercase">Écart Net Cumulé</span>
              <span className="p-2 rounded-lg bg-status-alert/10 text-status-alert">
                <Scale className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-2 text-2xl font-mono font-bold text-text-primary">
              {formatAriary(kpis.total_ecart_net)}
            </div>
            <div className="mt-1 text-xs text-text-secondary">
              Absolu : <span className="font-mono">{formatAriary(kpis.total_ecart_absolu)}</span>
            </div>
          </div>

          <div className="bg-surface-card border border-border-subtle rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-text-secondary uppercase">Bureaux Impactés</span>
              <span className="p-2 rounded-lg bg-surface-secondary text-text-secondary">
                <Building2 className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-2 text-2xl font-heading font-bold text-text-primary">
              {kpis.nb_bureaux_impactes}
            </div>
            <div className="mt-1 text-xs text-text-secondary">
              Sur l'ensemble des circonscriptions
            </div>
          </div>

          <div className="bg-surface-card border border-border-subtle rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-text-secondary uppercase">Montant Rectifié Total</span>
              <span className="p-2 rounded-lg bg-status-success/10 text-status-success">
                <CheckCircle2 className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-2 text-2xl font-mono font-bold text-status-success">
              {formatAriary(kpis.total_montant_rectifie)}
            </div>
            <div className="mt-1 text-xs text-text-secondary">
              Déclaré : <span className="font-mono">{formatAriary(kpis.total_montant_declare)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Barre de recherche et de filtres avancés */}
      <div className="bg-surface-card border border-border-subtle rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-secondary">
            <SlidersHorizontal className="w-4 h-4" />
            <span>Critères de filtrage (Bureau, Province, Montant, Statut)</span>
          </div>
          {(bureauFilter || provinceFilter || statutFilter !== 'tous' || minMontant || maxMontant || search) && (
            <button
              onClick={resetFilters}
              className="text-xs font-medium text-accent hover:underline cursor-pointer"
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Recherche textuelle */}
          <div className="relative">
            <label htmlFor="search-input" className="block text-xs font-medium text-text-secondary mb-1">
              Recherche libre
            </label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
              <input
                id="search-input"
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Compte, libellé, motif..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-surface-primary border border-border-subtle rounded-lg text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>

          {/* Filtre Bureau */}
          <div>
            <label htmlFor="select-bureau" className="block text-xs font-medium text-text-secondary mb-1">
              Bureau de poste
            </label>
            <select
              id="select-bureau"
              value={bureauFilter}
              onChange={(e) => {
                setBureauFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-sm bg-surface-primary border border-border-subtle rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">Tous les bureaux</option>
              {bureauxData?.results?.map((b) => (
                <option key={b.id} value={b.ncodique}>
                  {b.ncodique} — {b.nom_bureau} ({b.classe})
                </option>
              ))}
            </select>
          </div>

          {/* Filtre Province */}
          <div>
            <label htmlFor="select-province" className="block text-xs font-medium text-text-secondary mb-1">
              Province
            </label>
            <select
              id="select-province"
              value={provinceFilter}
              onChange={(e) => {
                setProvinceFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-sm bg-surface-primary border border-border-subtle rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">Toutes les provinces</option>
              {provincesData?.results?.map((p) => (
                <option key={p.id} value={p.nom}>
                  {p.nom}
                </option>
              ))}
            </select>
          </div>

          {/* Filtre Statut de régularisation */}
          <div>
            <label htmlFor="select-statut" className="block text-xs font-medium text-text-secondary mb-1">
              Statut du redressement
            </label>
            <select
              id="select-statut"
              value={statutFilter}
              onChange={(e) => {
                setStatutFilter(e.target.value as any);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-sm bg-surface-primary border border-border-subtle rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="tous">Tous les états</option>
              <option value="non_rectifie">En attente (non rectifiés)</option>
              <option value="rectifie">Régularisés (rectifiés)</option>
            </select>
          </div>
        </div>

        {/* Ligne secondaire : Filtres par montant */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-2 border-t border-border-subtle/50">
          <div>
            <label htmlFor="min-montant" className="block text-xs font-medium text-text-secondary mb-1">
              Montant / Écart min (MGA)
            </label>
            <input
              id="min-montant"
              type="text"
              inputMode="decimal"
              placeholder="Ex: 5 000"
              value={minMontant}
              onChange={(e) => setMinMontant(formatThousandsInput(e.target.value))}
              className="w-full px-3 py-1.5 text-sm bg-surface-primary border border-border-subtle rounded-lg text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div>
            <label htmlFor="max-montant" className="block text-xs font-medium text-text-secondary mb-1">
              Montant / Écart max (MGA)
            </label>
            <input
              id="max-montant"
              type="text"
              inputMode="decimal"
              placeholder="Ex: 500 000"
              value={maxMontant}
              onChange={(e) => setMaxMontant(formatThousandsInput(e.target.value))}
              className="w-full px-3 py-1.5 text-sm bg-surface-primary border border-border-subtle rounded-lg text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div className="sm:col-span-2 flex items-end">
            <div className="text-xs text-text-secondary italic">
              Affichage de <strong className="text-text-primary">{displayedEcarts.length}</strong> écriture(s) en anomalie
              {totalCount > pageSize && ` sur un total paginé de ${totalCount}`}
            </div>
          </div>
        </div>
      </div>

      {/* Tableau des écarts (Vue DIF) */}
      <div className="bg-surface-card border border-border-subtle rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-surface-secondary/70 border-b border-border-subtle text-xs font-semibold uppercase tracking-wider text-text-secondary select-none">
                <th
                  onClick={() => toggleSort('date_operation')}
                  className="px-4 py-3 cursor-pointer hover:text-text-primary transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Date</span>
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th className="px-4 py-3">Bureau / Province</th>
                <th className="px-4 py-3">Ligne comptable</th>
                <th
                  onClick={() => toggleSort('montant')}
                  className="px-4 py-3 text-right cursor-pointer hover:text-text-primary transition-colors"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Déclaré</span>
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th className="px-4 py-3 text-right">Ajustements (+/-)</th>
                <th className="px-4 py-3 text-right">Montant Rectifié</th>
                <th className="px-4 py-3 text-right">Écart Net</th>
                <th className="px-4 py-3 text-center">Statut</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-text-secondary">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-accent" />
                      <span>Chargement du journal d'audit...</span>
                    </div>
                  </td>
                </tr>
              ) : displayedEcarts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-text-secondary">
                    <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                      <CheckCircle2 className="w-8 h-8 text-status-success/80" />
                      <p className="font-heading font-semibold text-text-primary">
                        Aucun écart d'audit détecté
                      </p>
                      <p className="text-xs text-text-secondary">
                        Toutes les écritures pour les critères sélectionnés sont parfaitement équilibrées ou
                        aucun résultat ne correspond aux filtres.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                displayedEcarts.map((item) => {
                  const ecartNum = parseFloat(item.ecart) || 0;
                  const augNum = parseFloat(item.augmentation) || 0;
                  const dimNum = parseFloat(item.diminution) || 0;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-surface-secondary/40 transition-colors group"
                    >
                      {/* Date */}
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-text-secondary">
                        {formatDate(item.date_operation)}
                      </td>

                      {/* Bureau & Province */}
                      <td className="px-4 py-3">
                        <div className="font-medium text-text-primary text-xs">
                          {item.bureau.nom_bureau}
                        </div>
                        <div className="text-[11px] text-text-secondary flex items-center gap-1">
                          <span>{item.bureau.ncodique}</span>
                          <span>•</span>
                          <span>{item.bureau.province_nom || 'Non renseigné'}</span>
                        </div>
                      </td>

                      {/* Ligne comptable */}
                      <td className="px-4 py-3 max-w-xs">
                        <div className="font-mono text-xs font-semibold text-accent">
                          {item.ligne_comptable.compte}
                        </div>
                        <div className="text-xs text-text-secondary truncate" title={item.ligne_comptable.libelle}>
                          {item.ligne_comptable.libelle}
                        </div>
                      </td>

                      {/* Montant déclaré */}
                      <td className="px-4 py-3 text-right font-mono text-xs text-text-primary whitespace-nowrap">
                        {formatAriary(item.montant)}
                      </td>

                      {/* Ajustements */}
                      <td className="px-4 py-3 text-right font-mono text-xs whitespace-nowrap">
                        {augNum > 0 && (
                          <div className="text-status-success">+{formatAriary(item.augmentation)}</div>
                        )}
                        {dimNum > 0 && (
                          <div className="text-status-alert">-{formatAriary(item.diminution)}</div>
                        )}
                        {augNum === 0 && dimNum === 0 && (
                          <span className="text-text-secondary/50">—</span>
                        )}
                      </td>

                      {/* Montant rectifié */}
                      <td className="px-4 py-3 text-right font-mono text-xs font-bold text-text-primary whitespace-nowrap">
                        {formatAriary(item.montant_rectifie)}
                      </td>

                      {/* Écart */}
                      <td className="px-4 py-3 text-right font-mono text-xs font-bold whitespace-nowrap">
                        <span
                          className={
                            ecartNum > 0
                              ? 'text-status-alert'
                              : ecartNum < 0
                              ? 'text-status-alert'
                              : 'text-text-secondary'
                          }
                        >
                          {ecartNum > 0 ? '+' : ''}
                          {formatAriary(item.ecart)}
                        </span>
                      </td>

                      {/* Statut badge */}
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        {item.est_rectifie ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-status-success/15 text-status-success border border-status-success/30">
                            <CheckCircle2 className="w-3 h-3" />
                            Régularisé
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-status-alert/15 text-status-alert border border-status-alert/30">
                            <AlertTriangle className="w-3 h-3" />
                            En attente
                          </span>
                        )}
                      </td>

                      {/* Action Rectifier */}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <Button
                          variant={item.est_rectifie ? 'ghost' : 'secondary'}
                          size="sm"
                          onClick={() => handleOpenRectification(item)}
                          className="flex items-center gap-1.5 ml-auto text-xs"
                          title={
                            item.est_rectifie
                              ? `Déjà rectifié par ${item.rectifie_par || 'l’inspecteur'}`
                              : 'Ouvrir le formulaire de redressement contradictoire'
                          }
                        >
                          <Scale className="w-3.5 h-3.5 text-accent" />
                          <span>{item.est_rectifie ? 'Modifier' : 'Rectifier'}</span>
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <Pagination
          currentPage={page}
          totalCount={totalCount}
          pageSize={pageSize}
          onPageChange={(newPage) => setPage(newPage)}
          isLoading={isFetching}
          itemLabel="écart"
        />
      </div>

      {/* Modal de Rectification */}
      <RectificationModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedEcart(null);
        }}
        ecart={selectedEcart}
        onSubmit={handleRectificationSubmit}
        isSubmitting={mutation.isPending}
      />
    </div>
  );
};
