import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  getStocksValeurs,
  getProduitsPostaux,
  getStockRecapitulatif,
  createStockValeur,
  updateStockValeur,
  deleteStockValeur,
} from '../../api/stocks';
import { getBureaux, getPeriodesGestion } from '../../api/referentiel';
import type {
  Bureau,
  PeriodeGestion,
  ProduitPostal,
  StockValeur,
  StockValeurFormData,
  StockValeurRecapitulatif,
} from '../../types';
import { StockValeurFormModal } from './components/StockValeurFormModal';
import { Button } from '../../components/ui/Button';
import { Pagination } from '../../components/ui/Pagination';
import {
  Package,
  Plus,
  RefreshCw,
  Search,
  AlertCircle,

  Pencil,
  Trash2,
  Lock,
  Boxes,
  TrendingDown,
  DollarSign,
  ArrowRightLeft,
} from 'lucide-react';

export const StockValeursPage: React.FC = () => {
  const { user, role } = useAuth();

  // Données de référence
  const [bureaux, setBureaux] = useState<Bureau[]>([]);
  const [periodes, setPeriodes] = useState<PeriodeGestion[]>([]);
  const [produits, setProduits] = useState<ProduitPostal[]>([]);

  // Filtres
  const [selectedBureauId, setSelectedBureauId] = useState<number>(0);
  const [selectedPeriodeId, setSelectedPeriodeId] = useState<number>(0);
  const [selectedCategorie, setSelectedCategorie] = useState<string>('');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const pageSize = 10;

  // Données de la table et récapitulatif
  const [stocks, setStocks] = useState<StockValeur[]>([]);
  const [recapitulatif, setRecapitulatif] = useState<StockValeurRecapitulatif | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modale de saisie / modification
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingStock, setEditingStock] = useState<StockValeur | null>(null);

  // Suppression
  const [deletingStock, setDeletingStock] = useState<StockValeur | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Charger les données de référence
  useEffect(() => {
    let mounted = true;
    Promise.all([
      getBureaux(),
      getPeriodesGestion(),
      getProduitsPostaux({ actif: true }),
    ])
      .then(([resBureaux, resPeriodes, resProduits]) => {
        if (!mounted) return;
        const listBureaux = resBureaux.results || [];
        const listPeriodes = resPeriodes.results || [];
        const listProduits = resProduits.results || [];

        setBureaux(listBureaux);
        setPeriodes(listPeriodes);
        setProduits(listProduits);

        // Sélectionner par défaut le bureau de l'utilisateur ou le premier bureau
        let defaultBureau = listBureaux[0]?.id || 0;
        if (user?.bureau_code) {
          const match = listBureaux.find((b) => b.ncodique === user.bureau_code);
          if (match) defaultBureau = match.id;
        }
        setSelectedBureauId(defaultBureau);

        // Sélectionner par défaut la période en cours
        const activePeriode = listPeriodes.find((p) => !p.cloturee);
        setSelectedPeriodeId(activePeriode ? activePeriode.id : listPeriodes[0]?.id || 0);
      })
      .catch((err) => {
        console.error('Erreur chargement référentiel stock', err);
        setError('Impossible de charger le référentiel des bureaux ou périodes.');
      });

    return () => {
      mounted = false;
    };
  }, [user]);

  // Récupérer les écritures de stock et le récapitulatif financier
  const fetchStocksAndRecap = useCallback(async () => {
    if (!selectedPeriodeId) return;
    setLoading(true);
    setError(null);
    try {
      const [resStocks, resRecap] = await Promise.all([
        getStocksValeurs({
          bureau: selectedBureauId || undefined,
          periode_gestion: selectedPeriodeId,
          categorie: selectedCategorie || undefined,
        }),
        getStockRecapitulatif({
          periode: selectedPeriodeId,
          bureau: selectedBureauId || undefined,
        }).catch(() => null),
      ]);

      setStocks(resStocks.results || []);
      setRecapitulatif(resRecap);
    } catch (err: any) {
      console.error('Erreur chargement stocks valeurs', err);
      setError(
        err?.detail ||
          'Erreur lors du chargement des stocks de valeurs postales. Veuillez vérifier votre connexion.'
      );
    } finally {
      setLoading(false);
    }
  }, [selectedBureauId, selectedPeriodeId, selectedCategorie]);

  useEffect(() => {
    fetchStocksAndRecap();
  }, [fetchStocksAndRecap]);

  // Période couramment sélectionnée
  const currentPeriode = useMemo(() => {
    return periodes.find((p) => p.id === selectedPeriodeId) || null;
  }, [periodes, selectedPeriodeId]);

  const isPeriodeCloturee = currentPeriode?.cloturee ?? false;
  const canWrite = (role === 'RECEVEUR' || role === 'ADMIN' || role === 'AGENT_SAISIE') && !isPeriodeCloturee;

  // Filtrage local supplémentaire par libellé produit
  const filteredStocks = useMemo(() => {
    if (!searchFilter.trim()) return stocks;
    const term = searchFilter.toLowerCase();
    return stocks.filter(
      (s) =>
        s.produit_detail?.nom.toLowerCase().includes(term) ||
        s.produit_detail?.categorie.toLowerCase().includes(term)
    );
  }, [stocks, searchFilter]);

  // Réinitialiser la page lors du changement de filtre
  useEffect(() => {
    setPage(1);
  }, [selectedBureauId, selectedPeriodeId, selectedCategorie, searchFilter]);

  // Découpage paginé des stocks
  const paginatedStocks = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredStocks.slice(start, start + pageSize);
  }, [filteredStocks, page, pageSize]);

  // Créer ou modifier une ligne
  const handleSaveStock = async (data: StockValeurFormData) => {
    if (editingStock) {
      await updateStockValeur(editingStock.id, {
        quantite_initiale: data.quantite_initiale,
        quantite_recue: data.quantite_recue,
        quantite_vendue: data.quantite_vendue,
      });
    } else {
      await createStockValeur(data);
    }
    await fetchStocksAndRecap();
  };

  // Supprimer une ligne
  const handleConfirmDelete = async () => {
    if (!deletingStock) return;
    setIsDeleting(true);
    try {
      await deleteStockValeur(deletingStock.id);
      setDeletingStock(null);
      await fetchStocksAndRecap();
    } catch (err: any) {
      setError(err?.detail || 'Erreur lors de la suppression de la ligne de stock.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* En-tête de page institutionnel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border-subtle">
        <div>
          <div className="flex items-center gap-2 text-xs font-sans uppercase tracking-wider text-text-secondary">
            <Package className="w-4 h-4 text-brand" />
            <span>Journal G58 · Section 7</span>
          </div>
          <h1 className="text-2xl font-heading font-bold text-text-primary mt-1">
            Stock de valeurs postales & timbres
          </h1>
          <p className="text-xs sm:text-sm font-sans text-text-secondary mt-0.5">
            Tableau A : Suivi des existants, approvisionnements, ventes et solde final
          </p>
        </div>

        {/* Actions principales */}
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={fetchStocksAndRecap}
            disabled={loading}
            className="flex items-center gap-1.5"
            title="Rafraîchir les données"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Actualiser</span>
          </Button>

          {canWrite && (
            <Button
              type="button"
              variant="primary"
              onClick={() => {
                setEditingStock(null);
                setIsModalOpen(true);
              }}
              className="flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Saisir une ligne</span>
            </Button>
          )}
        </div>
      </div>

      {/* Avertissement de période clôturée */}
      {isPeriodeCloturee && (
        <div
          role="status"
          className="bg-surface-secondary border border-border-subtle rounded-xl p-4 flex items-center gap-3 text-xs sm:text-sm font-sans text-text-secondary"
        >
          <Lock className="w-5 h-5 text-accent shrink-0" />
          <div>
            <strong className="text-text-primary">Période clôturée et verrouillée :</strong> Les
            écritures de stock de cette période sont en lecture seule pour préserver l’intégrité
            légale et comptable.
          </div>
        </div>
      )}

      {/* Filtres contextuels (Bureau, Période, Catégorie, Recherche) */}
      <div className="bg-surface-card border border-border-subtle rounded-xl p-4 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Bureau */}
          <div>
            <label htmlFor="filter-bureau" className="block text-xs font-sans font-medium text-text-secondary mb-1">
              Bureau de poste
            </label>
            <select
              id="filter-bureau"
              aria-label="Bureau de poste"
              value={selectedBureauId}
              onChange={(e) => setSelectedBureauId(Number(e.target.value))}
              className="w-full text-xs font-sans px-3 py-2 bg-surface-primary border border-border-subtle rounded-lg text-text-primary focus:outline-hidden focus:ring-2 focus:ring-accent"
            >
              {bureaux.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.ncodique} - {b.nom_bureau}
                </option>
              ))}
            </select>
          </div>

          {/* Période */}
          <div>
            <label htmlFor="filter-periode" className="block text-xs font-sans font-medium text-text-secondary mb-1">
              Période de gestion
            </label>
            <select
              id="filter-periode"
              aria-label="Période de gestion"
              value={selectedPeriodeId}
              onChange={(e) => setSelectedPeriodeId(Number(e.target.value))}
              className="w-full text-xs font-sans px-3 py-2 bg-surface-primary border border-border-subtle rounded-lg text-text-primary focus:outline-hidden focus:ring-2 focus:ring-accent"
            >
              {periodes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.date_debut} au {p.date_fin} {p.cloturee ? '(Clôturée)' : '(En cours)'}
                </option>
              ))}
            </select>
          </div>

          {/* Catégorie */}
          <div>
            <label htmlFor="filter-categorie" className="block text-xs font-sans font-medium text-text-secondary mb-1">
              Catégorie de produit
            </label>
            <select
              id="filter-categorie"
              aria-label="Catégorie de produit"
              value={selectedCategorie}
              onChange={(e) => setSelectedCategorie(e.target.value)}
              className="w-full text-xs font-sans px-3 py-2 bg-surface-primary border border-border-subtle rounded-lg text-text-primary focus:outline-hidden focus:ring-2 focus:ring-accent"
            >
              <option value="">Toutes les catégories</option>
              <option value="VP">Valeurs postales (VP)</option>
              <option value="TF">Timbres fiscaux (TF)</option>
            </select>
          </div>

          {/* Filtre texte rapide */}
          <div>
            <label htmlFor="filter-search" className="block text-xs font-sans font-medium text-text-secondary mb-1">
              Filtrer par nom de produit
            </label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-secondary" />
              <input
                id="filter-search"
                aria-label="Filtrer par nom de produit"
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Ex : 500 Ar, fiscaux…"
                className="w-full pl-8 pr-3 py-2 text-xs font-sans bg-surface-primary border border-border-subtle rounded-lg text-text-primary placeholder:text-text-secondary/60 focus:outline-hidden focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Cartes de synthèse financière / Totaux agrégés (Tableau A G58) */}
      {recapitulatif && (
        <div
          data-testid="stock-recap-cards"
          className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4"
        >
          {/* Valeur initiale */}
          <div className="bg-surface-card border border-border-subtle rounded-xl p-4 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-sans text-text-secondary">
              <span>Existant initial</span>
              <Boxes className="w-4 h-4 text-text-secondary" />
            </div>
            <div className="font-mono text-base sm:text-lg font-bold text-text-primary mt-2">
              {Number(recapitulatif.total_valeur_initiale).toLocaleString('fr-FR', {
                minimumFractionDigits: 2,
              })}{' '}
              <span className="text-xs font-sans font-normal text-text-secondary">Ar</span>
            </div>
            <div className="text-[11px] font-sans text-text-secondary mt-1">
              {recapitulatif.total_quantite_initiale} unités
            </div>
          </div>

          {/* Valeur reçue */}
          <div className="bg-surface-card border border-border-subtle rounded-xl p-4 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-sans text-text-secondary">
              <span>Approvisionnements</span>
              <ArrowRightLeft className="w-4 h-4 text-brand" />
            </div>
            <div className="font-mono text-base sm:text-lg font-bold text-brand mt-2">
              +{Number(recapitulatif.total_valeur_recue).toLocaleString('fr-FR', {
                minimumFractionDigits: 2,
              })}{' '}
              <span className="text-xs font-sans font-normal text-text-secondary">Ar</span>
            </div>
            <div className="text-[11px] font-sans text-text-secondary mt-1">
              +{recapitulatif.total_quantite_recue} unités
            </div>
          </div>

          {/* Valeur vendue */}
          <div className="bg-surface-card border border-border-subtle rounded-xl p-4 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-sans text-status-alert">
              <span>Ventes de la période</span>
              <TrendingDown className="w-4 h-4 text-status-alert" />
            </div>
            <div className="font-mono text-base sm:text-lg font-bold text-status-alert mt-2">
              -{Number(recapitulatif.total_valeur_vendue).toLocaleString('fr-FR', {
                minimumFractionDigits: 2,
              })}{' '}
              <span className="text-xs font-sans font-normal text-text-secondary">Ar</span>
            </div>
            <div className="text-[11px] font-sans text-text-secondary mt-1">
              -{recapitulatif.total_quantite_vendue} unités
            </div>
          </div>

          {/* Solde final */}
          <div className="bg-surface-card border border-brand/40 bg-brand/5 rounded-xl p-4 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-sans font-medium text-brand">
              <span>Stock final en caisse</span>
              <DollarSign className="w-4 h-4 text-brand" />
            </div>
            <div className="font-mono text-base sm:text-lg font-bold text-brand mt-2">
              {Number(recapitulatif.total_valeur_finale).toLocaleString('fr-FR', {
                minimumFractionDigits: 2,
              })}{' '}
              <span className="text-xs font-sans font-normal text-text-secondary">Ar</span>
            </div>
            <div className="text-[11px] font-sans text-brand/80 font-medium mt-1">
              {recapitulatif.total_quantite_finale} unités restantes
            </div>
          </div>
        </div>
      )}

      {/* État d'erreur */}
      {error && !loading && (
        <div
          role="alert"
          className="p-4 bg-status-alert/10 border border-status-alert/30 rounded-xl text-xs sm:text-sm font-sans text-status-alert flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 shrink-0 text-status-alert" />
          <div className="flex-1">
            <p className="font-semibold">{error}</p>
          </div>
          <button
            type="button"
            onClick={fetchStocksAndRecap}
            className="text-xs font-sans underline hover:no-underline"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* État de chargement */}
      {loading && (
        <div
          data-testid="stock-loading"
          className="bg-surface-card border border-border-subtle rounded-xl p-12 text-center flex flex-col items-center justify-center space-y-3"
        >
          <RefreshCw className="w-8 h-8 text-brand animate-spin" />
          <p className="text-sm font-sans font-medium text-text-primary">
            Chargement des écritures de stock…
          </p>
          <p className="text-xs font-sans text-text-secondary">
            Calcul des totaux et agrégation du Tableau A
          </p>
        </div>
      )}

      {/* État vide */}
      {!loading && !error && filteredStocks.length === 0 && (
        <div
          data-testid="stock-empty-state"
          className="bg-surface-card border border-border-subtle border-dashed rounded-xl p-12 text-center space-y-3"
        >
          <div className="w-12 h-12 rounded-full bg-surface-secondary flex items-center justify-center mx-auto text-text-secondary">
            <Package className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-base font-heading font-semibold text-text-primary">
              Aucune écriture de stock enregistrée
            </h3>
            <p className="text-xs sm:text-sm font-sans text-text-secondary mt-1">
              Aucun mouvement de valeur postale ou timbre fiscal n’a encore été saisi pour ce bureau
              sur cette période.
            </p>
          </div>
          {canWrite && (
            <Button
              type="button"
              variant="primary"
              onClick={() => {
                setEditingStock(null);
                setIsModalOpen(true);
              }}
              className="mt-2 inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Saisir la première ligne</span>
            </Button>
          )}
        </div>
      )}

      {/* Table des écritures de stock */}
      {!loading && !error && filteredStocks.length > 0 && (
        <div className="bg-surface-card border border-border-subtle rounded-xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse" data-testid="table-stocks-valeurs">
              <thead>
                <tr className="border-b border-border-subtle bg-surface-secondary/40 text-[11px] font-sans font-semibold text-text-secondary uppercase tracking-wider">
                  <th className="py-3 px-4">Produit / Libellé</th>
                  <th className="py-3 px-4 text-right">Valeur faciale</th>
                  <th className="py-3 px-4 text-center">Quantités (Init. / Reçue / Vendue)</th>
                  <th className="py-3 px-4 text-right">Reste en stock</th>
                  <th className="py-3 px-4 text-right">Montant vendu</th>
                  <th className="py-3 px-4 text-right">Valeur finale</th>
                  <th className="py-3 px-4 text-center w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle text-xs font-sans">
                {paginatedStocks.map((stock) => {
                  const produit = stock.produit_detail;
                  return (
                    <tr
                      key={stock.id}
                      className="hover:bg-surface-secondary/30 transition-colors"
                      data-testid={`stock-row-${stock.id}`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                              produit?.categorie === 'VP'
                                ? 'bg-brand/10 text-brand'
                                : 'bg-accent/15 text-text-primary'
                            }`}
                          >
                            {produit?.categorie || 'VP'}
                          </span>
                          <div>
                            <div className="font-medium text-text-primary">
                              {produit?.nom || `Produit #${stock.produit}`}
                            </div>
                            <div className="text-[10px] text-text-secondary">
                              {produit?.categorie_libelle}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono text-text-secondary">
                        {Number(produit?.valeur_faciale || 0).toLocaleString('fr-FR', {
                          minimumFractionDigits: 2,
                        })}{' '}
                        Ar
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5 font-mono text-xs">
                          <span className="text-text-secondary" title="Quantité initiale">
                            {stock.quantite_initiale}
                          </span>
                          <span className="text-text-secondary/40">/</span>
                          <span className="text-brand font-medium" title="Quantité reçue">
                            +{stock.quantite_recue}
                          </span>
                          <span className="text-text-secondary/40">/</span>
                          <span className="text-status-alert font-medium" title="Quantité vendue">
                            -{stock.quantite_vendue}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <span className="font-mono font-bold text-text-primary bg-surface-secondary px-2 py-0.5 rounded">
                          {stock.quantite_finale}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-status-alert">
                        {Number(stock.valeur_vendue).toLocaleString('fr-FR', {
                          minimumFractionDigits: 2,
                        })}{' '}
                        Ar
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-brand">
                        {Number(stock.valeur_finale).toLocaleString('fr-FR', {
                          minimumFractionDigits: 2,
                        })}{' '}
                        Ar
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingStock(stock);
                              setIsModalOpen(true);
                            }}
                            disabled={!canWrite}
                            className="p-1.5 text-text-secondary hover:text-brand rounded-md hover:bg-surface-secondary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            title={isPeriodeCloturee ? 'Période clôturée' : 'Modifier la ligne'}
                            aria-label={`Modifier ${produit?.nom}`}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingStock(stock)}
                            disabled={!canWrite}
                            className="p-1.5 text-text-secondary hover:text-status-alert rounded-md hover:bg-surface-secondary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            title={isPeriodeCloturee ? 'Période clôturée' : 'Supprimer la ligne'}
                            aria-label={`Supprimer ${produit?.nom}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination des stocks */}
          {!loading && filteredStocks.length > 0 && (
            <Pagination
              currentPage={page}
              totalCount={filteredStocks.length}
              pageSize={pageSize}
              onPageChange={(newPage) => setPage(newPage)}
              isLoading={loading}
              itemLabel="article"
            />
          )}
        </div>
      )}

      {/* Modale de saisie / modification */}
      <StockValeurFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingStock(null);
        }}
        onSubmit={handleSaveStock}
        bureaux={bureaux}
        periodes={periodes}
        produits={produits}
        initialData={editingStock}
        selectedBureauId={selectedBureauId}
        selectedPeriodeId={selectedPeriodeId}
      />

      {/* Modale de confirmation de suppression */}
      {deletingStock && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-delete-title"
        >
          <div className="bg-surface-card border border-border-subtle rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-status-alert">
              <div className="w-10 h-10 rounded-xl bg-status-alert/10 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <h2 id="modal-delete-title" className="text-base font-heading font-bold text-text-primary">
                Supprimer cette ligne de stock ?
              </h2>
            </div>
            <p className="text-xs sm:text-sm font-sans text-text-secondary">
              Êtes-vous certain de vouloir supprimer l’écriture pour{' '}
              <strong>{deletingStock.produit_detail?.nom || `Produit #${deletingStock.produit}`}</strong> ?
              Cette action retirera le mouvement du Tableau A de la période.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setDeletingStock(null)}
                disabled={isDeleting}
              >
                Annuler
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="bg-status-alert hover:bg-status-alert/90"
              >
                {isDeleting ? 'Suppression…' : 'Confirmer la suppression'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
