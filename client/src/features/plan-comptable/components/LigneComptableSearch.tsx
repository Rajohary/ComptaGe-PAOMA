import React, { useState, useEffect, useRef, useCallback } from 'react';
import type {
  LigneComptable,
  SectionComptable,
  LigneComptableFormData,
  SectionComptableFormData,
  ApiError,
} from '../../../types';
import {
  getLignesComptables,
  getSectionsComptables,
  createLigneComptable,
  updateLigneComptable,
  deleteLigneComptable,
  createSectionComptable,
  updateSectionComptable,
  deleteSectionComptable,
} from '../../../api/comptabilite';
import { useAuth } from '../../../contexts/AuthContext';
import { Button } from '../../../components/ui/Button';
import { LigneComptableModal } from './LigneComptableModal';
import { SectionComptableModal } from './SectionComptableModal';
import {
  Search,
  BookOpen,
  FolderTree,
  FileText,
  Clock,
  X,
  AlertCircle,
  RefreshCw,
  ChevronRight,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  FolderPlus,
} from 'lucide-react';

const RECENT_LINES_KEY_PREFIX = 'comptage_recent_lignes_';

export interface LigneComptableSearchProps {
  /** Bureau code pour compartimenter l'historique des lignes récentes (ex: 101) */
  bureauCode?: number | null;
  /** Callback optionnel lors de la sélection d'une ligne (ex: dans le formulaire G58) */
  onSelectLigne?: (ligne: LigneComptable) => void;
  /** Section pré-filtrée (ex: 'A', 'B', etc.) */
  defaultSection?: string;
  /** N'afficher que les lignes imputables (feuilles) */
  onlyLeaf?: boolean;
  /** Afficher le panneau complet de navigation ou un mode compact pour modal/input */
  variant?: 'page' | 'compact';
}

export const LigneComptableSearch: React.FC<LigneComptableSearchProps> = ({
  bureauCode,
  onSelectLigne,
  defaultSection = '',
  onlyLeaf = false,
  variant: _variant = 'page',
}) => {
  const { role } = useAuth();
  const isAdmin = role === 'ADMIN';

  const [sections, setSections] = useState<SectionComptable[]>([]);
  const [selectedSection, setSelectedSection] = useState<string>(defaultSection);
  const [selectedSens, setSelectedSens] = useState<string>(''); // '' | '1' | '2'

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');

  const [lignes, setLignes] = useState<LigneComptable[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Notifications de succès et d'erreur
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Modales d'administration
  const [isLigneModalOpen, setIsLigneModalOpen] = useState(false);
  const [ligneToEdit, setLigneToEdit] = useState<LigneComptable | null>(null);
  const [ligneApiErrors, setLigneApiErrors] = useState<ApiError | null>(null);

  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [sectionToEdit, setSectionToEdit] = useState<SectionComptable | null>(null);
  const [sectionApiErrors, setSectionApiErrors] = useState<ApiError | null>(null);

  // Historique des lignes récentes
  const [recentLignes, setRecentLignes] = useState<LigneComptable[]>([]);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Stockage de l'historique par bureau dans localStorage
  const storageKey = bureauCode
    ? `${RECENT_LINES_KEY_PREFIX}${bureauCode}`
    : `${RECENT_LINES_KEY_PREFIX}general`;

  // Charger les lignes récentes depuis localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setRecentLignes(JSON.parse(stored));
      } else {
        setRecentLignes([]);
      }
    } catch {
      setRecentLignes([]);
    }
  }, [storageKey]);

  // Ajouter une ligne à l'historique
  const addToRecent = (ligne: LigneComptable) => {
    try {
      const filtered = recentLignes.filter((item) => item.id !== ligne.id);
      const updated = [ligne, ...filtered].slice(0, 5); // Max 5 éléments récents
      setRecentLignes(updated);
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch (e) {
      console.warn('Impossible de sauvegarder la ligne récente dans localStorage', e);
    }
  };

  const clearRecent = () => {
    try {
      localStorage.removeItem(storageKey);
      setRecentLignes([]);
    } catch {
      // Ignorer
    }
  };

  // Debounce de la recherche (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Charger le référentiel des sections
  const fetchSections = useCallback(async () => {
    try {
      const res = await getSectionsComptables();
      setSections(res.results || []);
    } catch (err: unknown) {
      console.warn('Impossible de charger les sections comptables', err);
    }
  }, []);

  useEffect(() => {
    fetchSections();
  }, [fetchSections]);

  // Charger les lignes selon critères
  const fetchLignes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getLignesComptables({
        search: debouncedSearch.trim() || undefined,
        section: selectedSection || undefined,
        sens: selectedSens ? parseInt(selectedSens, 10) : undefined,
        feuille: onlyLeaf ? true : undefined,
      });
      setLignes(res.results || []);
    } catch (err: any) {
      setError(
        err?.detail ||
          'Erreur lors du chargement des lignes comptables. Vérifiez la connexion au serveur.'
      );
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, selectedSection, selectedSens, onlyLeaf]);

  useEffect(() => {
    fetchLignes();
  }, [fetchLignes]);

  const handleSelect = (ligne: LigneComptable) => {
    addToRecent(ligne);
    if (onSelectLigne) {
      onSelectLigne(ligne);
    }
  };

  // Gestion des actions d'administration Lignes
  const handleOpenCreateLigne = () => {
    setLigneToEdit(null);
    setLigneApiErrors(null);
    setIsLigneModalOpen(true);
  };

  const handleOpenEditLigne = (ligne: LigneComptable) => {
    setLigneToEdit(ligne);
    setLigneApiErrors(null);
    setIsLigneModalOpen(true);
  };

  const handleSaveLigne = async (formData: LigneComptableFormData) => {
    setLigneApiErrors(null);
    try {
      if (ligneToEdit) {
        await updateLigneComptable(ligneToEdit.id, formData);
        setSuccessMessage(`Ligne « ${formData.compte} » modifiée avec succès.`);
      } else {
        await createLigneComptable(formData);
        setSuccessMessage(`Ligne « ${formData.compte} » créée avec succès.`);
      }
      setIsLigneModalOpen(false);
      setLigneToEdit(null);
      fetchLignes();
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      setLigneApiErrors(err);
      throw err;
    }
  };

  const handleDeleteLigne = async (ligne: LigneComptable) => {
    if (!window.confirm(`Confirmez-vous la suppression de la ligne « ${ligne.compte} — ${ligne.libelle} » ?`)) {
      return;
    }
    setActionError(null);
    try {
      await deleteLigneComptable(ligne.id);
      setSuccessMessage(`Ligne « ${ligne.compte} » supprimée.`);
      fetchLignes();
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      setActionError(
        err?.detail ||
          'Impossible de supprimer cette ligne comptable. Elle est probablement référencée par des écritures ou des sous-comptes.'
      );
      setTimeout(() => setActionError(null), 6000);
    }
  };

  // Gestion des actions d'administration Sections
  const handleOpenCreateSection = () => {
    setSectionToEdit(null);
    setSectionApiErrors(null);
    setIsSectionModalOpen(true);
  };

  const handleOpenEditSection = (section: SectionComptable) => {
    setSectionToEdit(section);
    setSectionApiErrors(null);
    setIsSectionModalOpen(true);
  };

  const handleSaveSection = async (formData: SectionComptableFormData) => {
    setSectionApiErrors(null);
    try {
      if (sectionToEdit) {
        await updateSectionComptable(sectionToEdit.id, formData);
        setSuccessMessage(`Section ${formData.code} modifiée avec succès.`);
      } else {
        await createSectionComptable(formData);
        setSuccessMessage(`Section ${formData.code} créée avec succès.`);
      }
      setIsSectionModalOpen(false);
      setSectionToEdit(null);
      fetchSections();
      fetchLignes();
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      setSectionApiErrors(err);
      throw err;
    }
  };

  const handleDeleteSection = async (section: SectionComptable) => {
    if (!window.confirm(`Confirmez-vous la suppression de la Section ${section.code} ?`)) {
      return;
    }
    setActionError(null);
    try {
      await deleteSectionComptable(section.id);
      setSuccessMessage(`Section ${section.code} supprimée.`);
      fetchSections();
      fetchLignes();
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      setActionError(
        err?.detail ||
          'Impossible de supprimer cette section. Des lignes comptables lui sont actuellement rattachées.'
      );
      setTimeout(() => setActionError(null), 6000);
    }
  };

  // Grouper les résultats par section (A, B, C, D, E...)
  const groupedLignes = lignes.reduce<Record<string, { section: SectionComptable | null; items: LigneComptable[] }>>(
    (acc, ligne) => {
      const key = ligne.section_code || 'AUTRE';
      if (!acc[key]) {
        const foundSec = sections.find((s) => s.code === key) || null;
        acc[key] = {
          section: foundSec,
          items: [],
        };
      }
      acc[key].items.push(ligne);
      return acc;
    },
    {}
  );

  const sortedSectionKeys = Object.keys(groupedLignes).sort();

  return (
    <div className="w-full space-y-6">
      {/* Messages de retour visuel */}
      {successMessage && (
        <div className="p-4 rounded-lg bg-status-success/15 border border-status-success/30 text-status-success flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium">{successMessage}</span>
        </div>
      )}

      {actionError && (
        <div className="p-4 rounded-lg bg-status-alert/15 border border-status-alert/30 text-status-alert flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium">{actionError}</span>
        </div>
      )}

      {/* Barre d'outils et recherche instantanée */}
      <div className="bg-surface-card border border-border-subtle rounded-xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
          {/* Champ de recherche principal */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input
              ref={searchInputRef}
              type="text"
              role="searchbox"
              id="plan-comptable-search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher par compte (ex: B101, AD01) ou libellé (ex: mandats, timbres)..."
              className="w-full pl-10 pr-9 py-2.5 text-sm font-sans bg-surface-primary border border-border-subtle rounded-lg text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-colors"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  searchInputRef.current?.focus();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-text-secondary hover:text-text-primary rounded-full hover:bg-surface-secondary transition-colors"
                title="Effacer la recherche"
                aria-label="Effacer le texte recherché"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filtre par sens (Débit / Crédit) */}
          <div className="flex items-center gap-1.5 bg-surface-secondary p-1 rounded-lg self-start md:self-auto">
            <button
              type="button"
              onClick={() => setSelectedSens('')}
              className={`px-3 py-1.5 text-xs font-sans font-medium rounded-md transition-colors ${
                selectedSens === ''
                  ? 'bg-surface-card text-text-primary shadow-sm font-semibold'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Tous sens
            </button>
            <button
              type="button"
              onClick={() => setSelectedSens('1')}
              className={`px-3 py-1.5 text-xs font-sans font-medium rounded-md transition-colors ${
                selectedSens === '1'
                  ? 'bg-brand text-white shadow-sm font-semibold'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Débit
            </button>
            <button
              type="button"
              onClick={() => setSelectedSens('2')}
              className={`px-3 py-1.5 text-xs font-sans font-medium rounded-md transition-colors ${
                selectedSens === '2'
                  ? 'bg-status-alert text-white shadow-sm font-semibold'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Crédit
            </button>
          </div>

          {/* Boutons d'action Admin : Ajouter une ligne / Ajouter une section */}
          {isAdmin && (
            <div className="flex items-center gap-2 self-start md:self-auto">
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleOpenCreateLigne}
                className="flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>Nouvelle ligne</span>
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleOpenCreateSection}
                className="flex items-center gap-1.5 text-xs whitespace-nowrap"
              >
                <FolderPlus className="w-4 h-4 text-accent" />
                <span>Section</span>
              </Button>
            </div>
          )}
        </div>

        {/* Pilules de sélection rapide par section macro-comptable */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border-subtle/60">
          <span className="text-xs font-sans font-medium text-text-secondary mr-1">
            Section :
          </span>
          <button
            type="button"
            onClick={() => setSelectedSection('')}
            className={`px-2.5 py-1 text-xs font-sans rounded-full transition-colors ${
              selectedSection === ''
                ? 'bg-brand text-white font-medium'
                : 'bg-surface-secondary text-text-secondary hover:text-text-primary'
            }`}
          >
            Toutes (A-E)
          </button>
          {sections.map((sec) => (
            <div key={sec.code} className="inline-flex items-center group/pill">
              <button
                type="button"
                onClick={() => setSelectedSection(selectedSection === sec.code ? '' : sec.code)}
                className={`px-2.5 py-1 text-xs font-sans rounded-full flex items-center gap-1.5 transition-colors ${
                  selectedSection === sec.code
                    ? 'bg-accent text-text-primary font-semibold shadow-sm'
                    : 'bg-surface-secondary text-text-secondary hover:text-text-primary'
                }`}
              >
                <span className="font-bold">{sec.code}</span>
                <span className="max-w-[120px] truncate text-[11px] opacity-90 hidden sm:inline">
                  {sec.libelle}
                </span>
              </button>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => handleOpenEditSection(sec)}
                  className="opacity-0 group-hover/pill:opacity-100 p-1 text-text-secondary hover:text-accent transition-opacity ml-0.5"
                  title={`Modifier la section ${sec.code}`}
                  aria-label={`Modifier la section ${sec.code}`}
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Historique des lignes récemment utilisées par le bureau */}
      {recentLignes.length > 0 && !searchTerm && (
        <div className="bg-surface-card border border-border-subtle rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-xs font-sans font-semibold text-text-secondary uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5 text-accent" />
              <span>Récemment utilisées {bureauCode ? `(Bureau ${bureauCode})` : ''}</span>
            </div>
            <button
              type="button"
              onClick={clearRecent}
              className="text-[11px] font-sans text-text-secondary hover:text-status-alert transition-colors"
            >
              Effacer l'historique
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {recentLignes.map((recent) => (
              <div
                key={`recent-${recent.id}`}
                onClick={() => handleSelect(recent)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelect(recent);
                  }
                }}
                className="p-2.5 rounded-lg border border-border-subtle bg-surface-primary hover:border-accent/60 hover:bg-surface-secondary/40 transition-colors cursor-pointer text-left group"
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-xs font-mono font-bold text-accent bg-accent/15 px-1.5 py-0.5 rounded">
                    {recent.compte}
                  </span>
                  <span
                    className={`text-[10px] font-sans px-1.5 py-0.5 rounded ${
                      recent.sens === 1
                        ? 'bg-brand/10 text-brand'
                        : 'bg-status-alert/10 text-status-alert'
                    }`}
                  >
                    {recent.sens_libelle || (recent.sens === 1 ? 'Débit' : 'Crédit')}
                  </span>
                </div>
                <div className="text-xs font-sans font-medium text-text-primary line-clamp-2 group-hover:text-brand transition-colors">
                  {recent.libelle}
                </div>
                <div className="text-[10px] font-sans text-text-secondary mt-1">
                  Section {recent.section_code}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* État de chargement */}
      {loading && (
        <div
          data-testid="plan-loading-state"
          className="bg-surface-card border border-border-subtle rounded-xl p-12 text-center flex flex-col items-center justify-center space-y-3"
        >
          <RefreshCw className="w-8 h-8 text-accent animate-spin" />
          <p className="text-sm font-sans font-medium text-text-primary">
            Recherche dans le plan comptable en cours…
          </p>
          <p className="text-xs font-sans text-text-secondary">
            Filtrage instantané des comptes et sous-rubriques
          </p>
        </div>
      )}

      {/* État d'erreur explicite */}
      {error && !loading && (
        <div
          data-testid="plan-error-state"
          className="bg-status-alert/10 border border-status-alert/20 rounded-xl p-6 text-center space-y-3"
          role="alert"
        >
          <AlertCircle className="w-8 h-8 text-status-alert mx-auto" />
          <p className="text-sm font-sans font-medium text-status-alert">{error}</p>
          <button
            type="button"
            onClick={fetchLignes}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-sans font-medium bg-status-alert text-white rounded hover:brightness-110 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Réessayer
          </button>
        </div>
      )}

      {/* État vide explicite — correction directe de l'application legacy */}
      {!loading && !error && lignes.length === 0 && (
        <div
          data-testid="plan-empty-state"
          className="bg-surface-card border border-border-subtle border-dashed rounded-xl p-12 text-center space-y-3"
        >
          <div className="w-12 h-12 rounded-full bg-surface-secondary flex items-center justify-center mx-auto text-text-secondary">
            <BookOpen className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-base font-heading font-semibold text-text-primary">
              Aucune ligne comptable trouvée
            </h3>
            <p className="text-xs sm:text-sm font-sans text-text-secondary mt-1">
              {debouncedSearch
                ? `Aucun compte ou libellé ne correspond à « ${debouncedSearch} ». Essayez avec un autre mot-clé ou vérifiez le filtre de section.`
                : 'Aucune écriture ne correspond aux critères sélectionnés.'}
            </p>
          </div>
          {(searchTerm || selectedSection || selectedSens) && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedSection('');
                setSelectedSens('');
              }}
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-sans font-medium text-text-primary bg-surface-secondary hover:bg-surface-secondary/80 rounded transition-colors"
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>
      )}

      {/* Affichage des résultats groupés par section macro-comptable */}
      {!loading && !error && lignes.length > 0 && (
        <div className="space-y-6" data-testid="plan-results-container">
          <div className="flex items-center justify-between text-xs font-sans text-text-secondary px-1">
            <span>
              {lignes.length} ligne{lignes.length > 1 ? 's' : ''} comptable{lignes.length > 1 ? 's' : ''} trouvée{lignes.length > 1 ? 's' : ''}
            </span>
            {debouncedSearch && (
              <span>
                Résultats pour « <strong className="text-text-primary">{debouncedSearch}</strong> »
              </span>
            )}
          </div>

          {sortedSectionKeys.map((secCode) => {
            const group = groupedLignes[secCode];
            const sectionMeta = group.section;
            return (
              <section
                key={`group-${secCode}`}
                className="bg-surface-card border border-border-subtle rounded-xl overflow-hidden shadow-sm"
                aria-label={`Section ${secCode}`}
              >
                {/* En-tête de section */}
                <div className="bg-surface-secondary/70 border-b border-border-subtle px-4 py-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-brand text-white font-heading font-bold text-sm flex items-center justify-center shadow-xs">
                      {secCode}
                    </span>
                    <div className="min-w-0">
                      <h4 className="text-sm font-heading font-bold text-text-primary truncate">
                        Section {secCode} {sectionMeta ? `— ${sectionMeta.libelle}` : ''}
                      </h4>
                      <div className="text-[11px] font-sans text-text-secondary flex items-center gap-2">
                        <span>
                          Sens normal :{' '}
                          <strong
                            className={
                              sectionMeta?.sens === 1
                                ? 'text-brand'
                                : sectionMeta?.sens === 2
                                ? 'text-status-alert'
                                : 'text-text-primary'
                            }
                          >
                            {sectionMeta?.sens_libelle || (sectionMeta?.sens === 1 ? 'Débit' : 'Crédit')}
                          </strong>
                        </span>
                        <span>•</span>
                        <span>{group.items.length} compte{group.items.length > 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  </div>

                  {/* Boutons d'édition/suppression de la section pour l'admin */}
                  {isAdmin && sectionMeta && (
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEditSection(sectionMeta)}
                        className="text-xs flex items-center gap-1 text-text-secondary hover:text-text-primary"
                        title={`Modifier la section ${secCode}`}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Modifier</span>
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteSection(sectionMeta)}
                        className="text-xs flex items-center gap-1 text-status-alert hover:bg-status-alert/10"
                        title={`Supprimer la section ${secCode}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Liste des lignes de la section */}
                <div className="divide-y divide-border-subtle/50">
                  {group.items.map((ligne) => {
                    return (
                      <div
                        key={ligne.id}
                        onClick={() => handleSelect(ligne)}
                        className={`p-3.5 sm:px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-surface-primary/80 transition-colors ${
                          onSelectLigne ? 'cursor-pointer group' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          {/* Icône selon type : groupe ou feuille */}
                          <div className="mt-0.5 p-1.5 rounded bg-surface-secondary text-text-secondary flex-shrink-0">
                            {ligne.parent ? (
                              <FileText className="w-4 h-4 text-paoma-blue" />
                            ) : (
                              <FolderTree className="w-4 h-4 text-accent" />
                            )}
                          </div>

                          <div className="min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              {/* Numéro de compte */}
                              <span className="font-mono font-bold text-sm text-text-primary bg-surface-secondary px-2 py-0.5 rounded border border-border-subtle/50 tabular-nums">
                                {ligne.compte}
                              </span>

                              {/* Sens de la ligne */}
                              <span
                                className={`text-[10px] font-sans font-medium px-2 py-0.5 rounded-full ${
                                  ligne.sens === 1
                                    ? 'bg-brand/10 text-brand'
                                    : 'bg-status-alert/10 text-status-alert'
                                }`}
                              >
                                {ligne.sens_libelle || (ligne.sens === 1 ? 'Débit' : 'Crédit')}
                              </span>

                              {/* Ligne parente si sous-rubrique */}
                              {ligne.parent_detail && (
                                <span className="text-[11px] font-sans text-text-secondary truncate max-w-[200px]">
                                  rattaché à <strong className="font-mono">{ligne.parent_detail.compte}</strong>
                                </span>
                              )}

                              {/* Indicateur inactif si applicable */}
                              {!ligne.actif && (
                                <span className="text-[10px] font-sans bg-surface-secondary text-text-secondary/70 px-1.5 py-0.5 rounded">
                                  Inactif
                                </span>
                              )}
                            </div>

                            {/* Libellé de la ligne comptable */}
                            <p className="text-sm font-sans font-medium text-text-primary group-hover:text-brand transition-colors">
                              {ligne.libelle}
                            </p>
                          </div>
                        </div>

                        {/* Actions / Sélection / Administration */}
                        <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                          <span className="text-[11px] font-mono text-text-secondary hidden md:inline">
                            Sub #{ligne.menu_sub}
                          </span>

                          {/* Boutons d'édition/suppression pour l'Admin */}
                          {isAdmin && (
                            <div className="flex items-center gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEditLigne(ligne);
                                }}
                                className="text-xs p-1.5 text-text-secondary hover:text-accent"
                                title={`Modifier la ligne ${ligne.compte}`}
                                aria-label={`Modifier la ligne ${ligne.compte}`}
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteLigne(ligne);
                                }}
                                className="text-xs p-1.5 text-status-alert hover:bg-status-alert/10"
                                title={`Supprimer la ligne ${ligne.compte}`}
                                aria-label={`Supprimer la ligne ${ligne.compte}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          )}

                          {onSelectLigne && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelect(ligne);
                              }}
                              className="px-3 py-1.5 text-xs font-sans font-medium bg-surface-secondary hover:bg-accent hover:text-text-primary rounded-md transition-colors flex items-center gap-1 text-text-primary group-hover:bg-accent"
                            >
                              <span>Sélectionner</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* Modal de création / modification d'une ligne comptable */}
      <LigneComptableModal
        isOpen={isLigneModalOpen}
        onClose={() => {
          setIsLigneModalOpen(false);
          setLigneToEdit(null);
          setLigneApiErrors(null);
        }}
        onSubmit={handleSaveLigne}
        ligneToEdit={ligneToEdit}
        sections={sections}
        allLignes={lignes}
        apiErrors={ligneApiErrors}
        defaultSectionId={
          selectedSection
            ? sections.find((s) => s.code === selectedSection)?.id || null
            : null
        }
      />

      {/* Modal de création / modification d'une section macro-comptable */}
      <SectionComptableModal
        isOpen={isSectionModalOpen}
        onClose={() => {
          setIsSectionModalOpen(false);
          setSectionToEdit(null);
          setSectionApiErrors(null);
        }}
        onSubmit={handleSaveSection}
        sectionToEdit={sectionToEdit}
        apiErrors={sectionApiErrors}
      />
    </div>
  );
};
