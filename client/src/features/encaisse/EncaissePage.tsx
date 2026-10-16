import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  getPeriodesGestion,
  getBureaux,
} from '../../api/referentiel';
import {
  getRubriquesEncaisse,
  getMouvementsEncaisse,
  createMouvementEncaisse,
  updateMouvementEncaisse,
  deleteMouvementEncaisse,
} from '../../api/comptabilite';
import type {
  PeriodeGestion,
  Bureau,
  RubriqueEncaisse,
  MouvementEncaisse,
  MouvementEncaisseFormData,
} from '../../types';
import { EncaisseFormModal } from './components/EncaisseFormModal';
import { Button } from '../../components/ui/Button';
import {
  DollarSign,
  Plus,
  RefreshCw,
  Search,
  AlertCircle,
  Trash2,
  Pencil,
  Lock,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Building2,
  Wallet,
  ShieldAlert,
  Layers,
} from 'lucide-react';

export const EncaissePage: React.FC = () => {
  const { user, role } = useAuth();

  // Données de base
  const [periodes, setPeriodes] = useState<PeriodeGestion[]>([]);
  const [bureaux, setBureaux] = useState<Bureau[]>([]);
  const [rubriques, setRubriques] = useState<RubriqueEncaisse[]>([]);

  // Filtres
  const [selectedBureauId, setSelectedBureauId] = useState<number>(0);
  const [selectedPeriodeId, setSelectedPeriodeId] = useState<number>(0);
  const [selectedRubriqueId, setSelectedRubriqueId] = useState<string>('');
  const [selectedSens, setSelectedSens] = useState<string>('');
  const [searchFilter, setSearchFilter] = useState<string>('');

  // Liste des mouvements d'encaisse
  const [mouvements, setMouvements] = useState<MouvementEncaisse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modale de création / édition
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingMouvement, setEditingMouvement] = useState<MouvementEncaisse | null>(null);

  // Suppression
  const [deletingMouvement, setDeletingMouvement] = useState<MouvementEncaisse | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Charger les données de référence (bureaux, périodes, rubriques)
  useEffect(() => {
    let mounted = true;
    Promise.all([getBureaux(), getPeriodesGestion(), getRubriquesEncaisse()])
      .then(([resBureaux, resPeriodes, resRubriques]) => {
        if (!mounted) return;
        const listBureaux = resBureaux.results || [];
        const listPeriodes = resPeriodes.results || [];
        const listRubriques = resRubriques.results || [];

        setBureaux(listBureaux);
        setPeriodes(listPeriodes);
        setRubriques(listRubriques);

        // Sélectionner par défaut le bureau du receveur/agent ou le premier bureau
        let defaultBureau = listBureaux[0]?.id || 0;
        if (user?.bureau_code) {
          const match = listBureaux.find((b) => b.ncodique === user.bureau_code);
          if (match) defaultBureau = match.id;
        }
        setSelectedBureauId(defaultBureau);

        // Sélectionner la période active du bureau
        const activePeriode = listPeriodes.find((p) => !p.cloturee);
        const defaultPeriode = activePeriode ? activePeriode.id : listPeriodes[0]?.id || 0;
        setSelectedPeriodeId(defaultPeriode);
      })
      .catch((err) => {
        console.error('Erreur chargement des données de référence encaisse', err);
        setError('Impossible de charger les bureaux, périodes ou rubriques d’encaisse.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [user?.bureau_code]);

  // Charger les mouvements d'encaisse
  const fetchMouvements = useCallback(async () => {
    if (!selectedPeriodeId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getMouvementsEncaisse({
        periode_gestion: selectedPeriodeId,
        bureau: selectedBureauId || undefined,
        rubrique_encaisse: selectedRubriqueId ? Number(selectedRubriqueId) : undefined,
        sens: selectedSens ? Number(selectedSens) : undefined,
      });
      setMouvements(res.results || []);
    } catch (err: any) {
      console.error('Erreur chargement flux encaisse', err);
      setError(err?.detail || 'Impossible de charger les mouvements d’encaisse.');
    } finally {
      setLoading(false);
    }
  }, [selectedPeriodeId, selectedBureauId, selectedRubriqueId, selectedSens]);

  useEffect(() => {
    fetchMouvements();
  }, [fetchMouvements]);

  const selectedPeriode = useMemo(() => {
    return periodes.find((p) => p.id === selectedPeriodeId) || null;
  }, [periodes, selectedPeriodeId]);

  const isPeriodeCloturee = selectedPeriode?.cloturee || false;

  // Calcul synthétique de l'encaisse (entrées, sorties, solde net de période)
  const statsEncaisse = useMemo(() => {
    let totalEntrees = 0;
    let totalSorties = 0;
    for (const m of mouvements) {
      const montant = Number(m.montant) || 0;
      if (m.sens === 1) {
        totalEntrees += montant;
      } else if (m.sens === 2) {
        totalSorties += montant;
      }
    }
    const reserveInitiale = Number(selectedPeriode?.reserve_numeraire || 0);
    const soldeFinCalcule = reserveInitiale + totalEntrees - totalSorties;

    return {
      reserveInitiale,
      totalEntrees,
      totalSorties,
      soldeFinCalcule,
      nbMouvements: mouvements.length,
    };
  }, [mouvements, selectedPeriode]);

  // Répartition analytique par rubrique (TR, SF, CR...)
  const repartitionRubriques = useMemo(() => {
    const map = new Map<number, {
      rubrique: RubriqueEncaisse;
      totalEntrees: number;
      totalSorties: number;
      soldeNet: number;
      count: number;
    }>();

    // Initialiser avec les rubriques disponibles
    rubriques.forEach((r) => {
      map.set(r.id, {
        rubrique: r,
        totalEntrees: 0,
        totalSorties: 0,
        soldeNet: 0,
        count: 0,
      });
    });

    mouvements.forEach((m) => {
      const montant = Number(m.montant) || 0;
      let item = map.get(m.rubrique_encaisse);
      if (!item && m.rubrique_detail) {
        item = {
          rubrique: m.rubrique_detail,
          totalEntrees: 0,
          totalSorties: 0,
          soldeNet: 0,
          count: 0,
        };
        map.set(m.rubrique_encaisse, item);
      }
      if (item) {
        item.count += 1;
        if (m.sens === 1) {
          item.totalEntrees += montant;
          item.soldeNet += montant;
        } else if (m.sens === 2) {
          item.totalSorties += montant;
          item.soldeNet -= montant;
        }
      }
    });

    return Array.from(map.values()).filter((item) => item.count > 0 || rubriques.length <= 4);
  }, [mouvements, rubriques]);

  // Filtrage local supplémentaire par recherche textuelle
  const filteredMouvements = useMemo(() => {
    if (!searchFilter.trim()) return mouvements;
    const term = searchFilter.toLowerCase();
    return mouvements.filter(
      (m) =>
        m.rubrique_detail?.compte.toLowerCase().includes(term) ||
        m.rubrique_detail?.libelle.toLowerCase().includes(term) ||
        m.saisi_par_username?.toLowerCase().includes(term) ||
        m.date_operation.includes(term)
    );
  }, [mouvements, searchFilter]);

  // Création / modification d'un mouvement
  const handleSaveMouvement = async (data: MouvementEncaisseFormData) => {
    if (editingMouvement) {
      await updateMouvementEncaisse(editingMouvement.id, data);
      setEditingMouvement(null);
    } else {
      await createMouvementEncaisse(data);
    }
    await fetchMouvements();
  };

  const handleOpenCreateModal = () => {
    setEditingMouvement(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (mvt: MouvementEncaisse) => {
    setEditingMouvement(mvt);
    setIsModalOpen(true);
  };

  // Suppression d'un mouvement
  const handleDeleteConfirm = async () => {
    if (!deletingMouvement) return;
    setIsDeleting(true);
    try {
      await deleteMouvementEncaisse(deletingMouvement.id);
      setDeletingMouvement(null);
      await fetchMouvements();
    } catch (err: any) {
      console.error('Erreur suppression mouvement encaisse', err);
      setError(err?.detail || 'Impossible de supprimer ce mouvement d’encaisse.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* En-tête */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border-subtle">
        <div>
          <div className="flex items-center gap-2 text-xs font-sans uppercase tracking-wider text-text-secondary">
            <Wallet className="w-4 h-4 text-brand" />
            <span>Contrôle de Caisse et Coffre-fort · Journal G58</span>
          </div>
          <h1 className="text-2xl font-heading font-bold text-text-primary mt-1">
            Détails de l’encaisse
          </h1>
          <p className="text-xs sm:text-sm font-sans text-text-secondary mt-0.5">
            Suivi en temps réel des espèces physiques, des entrées/sorties et du solde de coffre
          </p>
        </div>

        {/* Actions principales */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={fetchMouvements}
            disabled={loading}
            title="Rafraîchir les flux"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>

          {!isPeriodeCloturee ? (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1.5"
              data-testid="open-encaisse-modal-btn"
            >
              <Plus className="w-4 h-4" />
              <span>Nouveau mouvement</span>
            </Button>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-secondary text-text-secondary rounded-lg text-xs font-sans font-medium">
              <Lock className="w-3.5 h-3.5 text-text-secondary" />
              <span>Période clôturée</span>
            </div>
          )}
        </div>
      </div>

      {/* Cartes de synthèse financière d'encaisse */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Réserve initiale */}
        <div className="bg-surface-card border border-border-subtle rounded-xl p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs font-sans text-text-secondary">
            <span>Réserve initiale (coffre)</span>
            <Building2 className="w-4 h-4 text-brand" />
          </div>
          <div className="text-xl sm:text-2xl font-mono font-bold text-text-primary" data-testid="stat-reserve-initiale">
            {statsEncaisse.reserveInitiale.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}{' '}
            <span className="text-xs font-sans font-normal text-text-secondary">Ar</span>
          </div>
          <p className="text-[11px] font-sans text-text-secondary">
            Espèces déclarées à l'ouverture du mois
          </p>
        </div>

        {/* Total Entrées */}
        <div className="bg-surface-card border border-border-subtle rounded-xl p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs font-sans text-text-secondary">
            <span>Total Entrées physiques</span>
            <TrendingUp className="w-4 h-4 text-status-success" />
          </div>
          <div className="text-xl sm:text-2xl font-mono font-bold text-status-success" data-testid="stat-total-entrees">
            +{statsEncaisse.totalEntrees.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}{' '}
            <span className="text-xs font-sans font-normal text-text-secondary">Ar</span>
          </div>
          <p className="text-[11px] font-sans text-text-secondary">
            Versements, approvisionnements & encaissements
          </p>
        </div>

        {/* Total Sorties */}
        <div className="bg-surface-card border border-border-subtle rounded-xl p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs font-sans text-text-secondary">
            <span>Total Sorties physiques</span>
            <TrendingDown className="w-4 h-4 text-status-alert" />
          </div>
          <div className="text-xl sm:text-2xl font-mono font-bold text-status-alert" data-testid="stat-total-sorties">
            -{statsEncaisse.totalSorties.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}{' '}
            <span className="text-xs font-sans font-normal text-text-secondary">Ar</span>
          </div>
          <p className="text-[11px] font-sans text-text-secondary">
            Paiements, envois de fonds & décaissements
          </p>
        </div>

        {/* Solde final estimé */}
        <div className="bg-surface-card border border-border-subtle rounded-xl p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs font-sans text-text-secondary">
            <span>Solde théorique en caisse</span>
            <DollarSign className="w-4 h-4 text-brand" />
          </div>
          <div
            className={`text-xl sm:text-2xl font-mono font-bold ${
              statsEncaisse.soldeFinCalcule >= 0 ? 'text-brand' : 'text-status-alert'
            }`}
            data-testid="stat-solde-theorique"
          >
            {statsEncaisse.soldeFinCalcule.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}{' '}
            <span className="text-xs font-sans font-normal text-text-secondary">Ar</span>
          </div>
          <p className="text-[11px] font-sans text-text-secondary">
            Réserve départ + Entrées − Sorties
          </p>
        </div>
      </div>

      {/* Répartition analytique par rubrique (TR, SF, CR) */}
      {repartitionRubriques.length > 0 && (
        <div className="bg-surface-card border border-border-subtle rounded-xl p-4 shadow-2xs space-y-3" data-testid="repartition-rubriques-container">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-brand" />
              <h3 className="text-xs font-heading font-bold text-text-primary uppercase tracking-wider">
                Répartition des flux par rubrique d’encaisse
              </h3>
            </div>
            <span className="text-[11px] font-sans text-text-secondary">
              Nomenclature comptable (CDC Module 2)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {repartitionRubriques.map((item) => {
              const soldePositif = item.soldeNet >= 0;
              return (
                <div
                  key={item.rubrique.id}
                  data-testid={`rubrique-card-${item.rubrique.compte}`}
                  className="bg-surface-secondary/40 border border-border-subtle rounded-lg p-3 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs bg-brand/10 text-brand px-2 py-0.5 rounded">
                        {item.rubrique.compte}
                      </span>
                      <span className="font-medium text-xs text-text-primary truncate max-w-[170px]" title={item.rubrique.libelle}>
                        {item.rubrique.libelle}
                      </span>
                    </div>
                    <span className="text-[10px] font-sans font-semibold text-text-secondary bg-surface-secondary px-1.5 py-0.5 rounded">
                      {item.count} flux
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1 border-t border-border-subtle">
                    <div>
                      <span className="text-[10px] font-sans text-text-secondary block">Entrées</span>
                      <span className="font-bold text-status-success">
                        +{item.totalEntrees.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} Ar
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-sans text-text-secondary block">Sorties</span>
                      <span className="font-bold text-status-alert">
                        -{item.totalSorties.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} Ar
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-border-subtle font-mono">
                    <span className="text-[10px] font-sans text-text-secondary">Solde net :</span>
                    <span className={`font-bold ${soldePositif ? 'text-brand' : 'text-status-alert'}`}>
                      {soldePositif ? '+' : ''}
                      {item.soldeNet.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} Ar
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Barre de filtres contextuels */}
      <div className="bg-surface-card border border-border-subtle rounded-xl p-4 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Sélection de bureau (Admin / Inspecteur) */}
          <div>
            <label htmlFor="filter-bureau" className="block text-[11px] font-sans font-medium text-text-secondary mb-1">
              Bureau de poste
            </label>
            <select
              id="filter-bureau"
              aria-label="Bureau de poste"
              value={selectedBureauId}
              onChange={(e) => setSelectedBureauId(Number(e.target.value))}
              disabled={role === 'RECEVEUR' || role === 'AGENT_SAISIE'}
              className="w-full text-xs font-sans bg-surface-secondary/40 border border-border-subtle rounded-lg px-2.5 py-1.5 text-text-primary focus:outline-hidden"
            >
              {bureaux.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.ncodique} — {b.nom_bureau}
                </option>
              ))}
            </select>
          </div>

          {/* Sélection de la période */}
          <div>
            <label htmlFor="filter-periode" className="block text-[11px] font-sans font-medium text-text-secondary mb-1">
              Période de gestion
            </label>
            <select
              id="filter-periode"
              aria-label="Période de gestion"
              value={selectedPeriodeId}
              onChange={(e) => setSelectedPeriodeId(Number(e.target.value))}
              className="w-full text-xs font-sans bg-surface-secondary/40 border border-border-subtle rounded-lg px-2.5 py-1.5 text-text-primary focus:outline-hidden"
            >
              {periodes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.date_debut} au {p.date_fin} {p.cloturee ? '(Clôturée)' : '(En cours)'}
                </option>
              ))}
            </select>
          </div>

          {/* Filtre par sens */}
          <div>
            <label htmlFor="filter-sens" className="block text-[11px] font-sans font-medium text-text-secondary mb-1">
              Sens du flux
            </label>
            <select
              id="filter-sens"
              aria-label="Sens du flux"
              value={selectedSens}
              onChange={(e) => setSelectedSens(e.target.value)}
              className="w-full text-xs font-sans bg-surface-secondary/40 border border-border-subtle rounded-lg px-2.5 py-1.5 text-text-primary focus:outline-hidden"
            >
              <option value="">Tous les sens</option>
              <option value="1">Entrées uniquement</option>
              <option value="2">Sorties uniquement</option>
            </select>
          </div>

          {/* Filtre par rubrique */}
          <div>
            <label htmlFor="filter-rubrique" className="block text-[11px] font-sans font-medium text-text-secondary mb-1">
              Rubrique d’encaisse
            </label>
            <select
              id="filter-rubrique"
              aria-label="Rubrique d'encaisse"
              value={selectedRubriqueId}
              onChange={(e) => setSelectedRubriqueId(e.target.value)}
              className="w-full text-xs font-sans bg-surface-secondary/40 border border-border-subtle rounded-lg px-2.5 py-1.5 text-text-primary focus:outline-hidden"
            >
              <option value="">Toutes les rubriques</option>
              {rubriques.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.compte} — {r.libelle}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Barre de recherche instantanée avec pastilles de filtre rapide */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-text-secondary absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Rechercher par compte, désignation ou receveur..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs font-sans bg-surface-secondary/20 border border-border-subtle rounded-lg text-text-primary focus:outline-hidden placeholder:text-text-secondary"
            />
          </div>

          {/* Pastilles filtres rapides de sens */}
          <div className="flex items-center gap-1.5 shrink-0" data-testid="quick-sens-filters">
            <button
              type="button"
              onClick={() => setSelectedSens('')}
              className={`px-2.5 py-1 rounded-md text-xs font-sans font-medium transition-colors ${
                selectedSens === ''
                  ? 'bg-brand text-white shadow-2xs font-semibold'
                  : 'bg-surface-secondary/60 text-text-secondary hover:text-text-primary'
              }`}
            >
              Tous
            </button>
            <button
              type="button"
              onClick={() => setSelectedSens('1')}
              className={`px-2.5 py-1 rounded-md text-xs font-sans font-medium transition-colors ${
                selectedSens === '1'
                  ? 'bg-status-success text-white shadow-2xs font-semibold'
                  : 'bg-surface-secondary/60 text-text-secondary hover:text-text-primary'
              }`}
            >
              Entrées
            </button>
            <button
              type="button"
              onClick={() => setSelectedSens('2')}
              className={`px-2.5 py-1 rounded-md text-xs font-sans font-medium transition-colors ${
                selectedSens === '2'
                  ? 'bg-status-alert text-white shadow-2xs font-semibold'
                  : 'bg-surface-secondary/60 text-text-secondary hover:text-text-primary'
              }`}
            >
              Sorties
            </button>
          </div>
        </div>
      </div>

      {/* Message d'erreur */}
      {error && (
        <div
          role="alert"
          className="p-4 bg-status-alert/10 border border-status-alert/30 rounded-xl text-xs sm:text-sm font-sans text-status-alert flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 shrink-0 text-status-alert" />
          <span>{error}</span>
        </div>
      )}

      {/* Table des flux d'encaisse */}
      <div className="bg-surface-card border border-border-subtle rounded-xl overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-border-subtle flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-heading font-bold text-text-primary">
              Mouvements d'encaisse enregistrés
            </h3>
            <span className="text-xs font-sans text-text-secondary">
              ({filteredMouvements.length} opération{filteredMouvements.length > 1 ? 's' : ''})
            </span>
          </div>
          {isPeriodeCloturee && (
            <span className="text-xs font-sans text-text-secondary flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-text-secondary" />
              Verrouillé en lecture seule
            </span>
          )}
        </div>

        {loading ? (
          <div className="p-8 text-center" data-testid="encaisse-loading-state">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-brand mb-2" />
            <p className="text-xs font-sans text-text-secondary">Chargement des opérations d’encaisse…</p>
          </div>
        ) : filteredMouvements.length === 0 ? (
          <div className="p-8 text-center space-y-2" data-testid="encaisse-empty-state">
            <DollarSign className="w-8 h-8 text-text-secondary/40 mx-auto" />
            <p className="text-sm font-heading font-medium text-text-primary">
              Aucun mouvement d’encaisse constaté
            </p>
            <p className="text-xs font-sans text-text-secondary max-w-sm mx-auto">
              {searchFilter
                ? 'Aucune opération ne correspond à vos critères de recherche.'
                : 'Aucun flux physique de caisse ou coffre enregistré pour cette période.'}
            </p>
            {!isPeriodeCloturee && !searchFilter && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleOpenCreateModal}
                className="mt-3"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Enregistrer la première opération
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans border-collapse">
              <thead>
                <tr className="border-b border-border-subtle bg-surface-secondary/40 text-text-secondary">
                  <th className="py-2.5 px-4 font-semibold">Date</th>
                  <th className="py-2.5 px-4 font-semibold">Rubrique</th>
                  <th className="py-2.5 px-4 font-semibold">Sens</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Montant (Ar)</th>
                  <th className="py-2.5 px-4 font-semibold">Saisi par</th>
                  {!isPeriodeCloturee && <th className="py-2.5 px-4 font-semibold text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {filteredMouvements.map((m) => {
                  const isEntree = m.sens === 1;
                  return (
                    <tr
                      key={m.id}
                      data-testid={`encaisse-row-${m.id}`}
                      className="hover:bg-surface-secondary/20 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono text-text-secondary whitespace-nowrap">
                        {m.date_operation}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-brand bg-brand/10 px-1.5 py-0.5 rounded text-[11px]">
                            {m.rubrique_detail?.compte || 'ENC'}
                          </span>
                          <span className="font-medium text-text-primary">
                            {m.rubrique_detail?.libelle || 'Rubrique sans libellé'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-sans font-semibold px-2 py-0.5 rounded-full ${
                            isEntree
                              ? 'bg-status-success/10 text-status-success'
                              : 'bg-status-alert/10 text-status-alert'
                          }`}
                        >
                          {isEntree ? (
                            <ArrowDownLeft className="w-3 h-3" />
                          ) : (
                            <ArrowUpRight className="w-3 h-3" />
                          )}
                          {m.sens_libelle || (isEntree ? 'Entrée' : 'Sortie')}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-right whitespace-nowrap">
                        <span className={isEntree ? 'text-status-success' : 'text-status-alert'}>
                          {isEntree ? '+' : '-'}
                          {Number(m.montant).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} Ar
                        </span>
                      </td>
                      <td className="py-3 px-4 text-text-secondary whitespace-nowrap">
                        {m.saisi_par_username || '—'}
                      </td>
                      {!isPeriodeCloturee && (
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenEditModal(m)}
                              className="text-text-secondary hover:text-text-primary hover:bg-surface-secondary"
                              title="Modifier cette opération"
                              data-testid={`edit-encaisse-btn-${m.id}`}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeletingMouvement(m)}
                              className="text-status-alert hover:text-status-alert hover:bg-status-alert/10"
                              title="Supprimer cette opération"
                              data-testid={`delete-encaisse-btn-${m.id}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modale d'ajout ou de modification */}
      {selectedPeriode && (
        <EncaisseFormModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingMouvement(null);
          }}
          periode={selectedPeriode}
          rubriques={rubriques}
          initialData={editingMouvement}
          onSubmitSuccess={fetchMouvements}
          onSave={handleSaveMouvement}
        />
      )}

      {/* Confirmation de suppression */}
      {deletingMouvement && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="bg-surface-card rounded-2xl border border-border-subtle shadow-xl w-full max-w-sm p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-10 h-10 rounded-full bg-status-alert/10 text-status-alert flex items-center justify-center mx-auto">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-heading font-bold text-text-primary">
                Supprimer cette opération d’encaisse ?
              </h3>
              <p className="text-xs font-sans text-text-secondary">
                Le montant de{' '}
                <strong className="text-text-primary font-mono">
                  {Number(deletingMouvement.montant).toLocaleString('fr-FR')} Ar
                </strong>{' '}
                sera retiré du solde de caisse.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setDeletingMouvement(null)}
                disabled={isDeleting}
              >
                Annuler
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={handleDeleteConfirm}
                isLoading={isDeleting}
              >
                Confirmer la suppression
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
