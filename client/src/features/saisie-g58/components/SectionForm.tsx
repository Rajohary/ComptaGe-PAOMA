import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type {
  MouvementG58,
  PeriodeGestion,
  SectionComptable,
  LigneComptable,
  ApiError,
} from '../../../types';
import { createMouvement, updateMouvement, deleteMouvement, getMouvements } from '../../../api/comptabilite';
import { TotauxLive } from './TotauxLive';
import { LigneComptableSearch } from './LigneComptableSearch';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Pagination } from '../../../components/ui/Pagination';
import { formatAriary, formatDate, parseNumber } from '../../../lib/formatters';
import { applyServerValidationErrors } from '../../../lib/formErrors';
import {
  FileText,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Pencil,
  AlertTriangle,
  Lock,
  CheckCircle2,
  Layers,
  ArrowUpDown,
} from 'lucide-react';

const createMouvementSchema = (periode: PeriodeGestion) =>
  z
    .object({
      periode_gestion: z.coerce.number().int().positive('Période de gestion invalide'),
      ligne_comptable: z.coerce.number().int().positive('Veuillez sélectionner une ligne comptable'),
      date_operation: z.string().min(10, 'La date de l’opération est obligatoire'),
      montant: z
        .string()
        .min(1, 'Le montant est obligatoire')
        .refine(
          (val) => !isNaN(parseNumber(val, NaN)) && parseNumber(val) >= 0,
          'Le montant doit être un nombre positif ou nul'
        ),
      augmentation: z
        .string()
        .optional()
        .refine(
          (val) => !val || (!isNaN(parseNumber(val, NaN)) && parseNumber(val) >= 0),
          'L’augmentation doit être un nombre positif ou nul'
        ),
      diminution: z
        .string()
        .optional()
        .refine(
          (val) => !val || (!isNaN(parseNumber(val, NaN)) && parseNumber(val) >= 0),
          'La diminution doit être un nombre positif ou nul'
        ),
      motif_rectification: z.string().max(250, 'Le motif ne peut dépasser 250 caractères').optional(),
    })
    .refine(
      (data) => {
        const m = parseNumber(data.montant, 0);
        const aug = parseNumber(data.augmentation, 0);
        const dim = parseNumber(data.diminution, 0);
        return m + aug >= dim;
      },
      {
        message: 'La diminution ne peut pas être supérieure au montant initial + augmentation',
        path: ['diminution'],
      }
    )
    .refine(
      (data) => {
        if (!data.date_operation || !periode.date_debut) return true;
        if (data.date_operation < periode.date_debut) return false;
        if (periode.date_fin && data.date_operation > periode.date_fin) return false;
        return true;
      },
      {
        message: periode.date_fin
          ? `La date d'opération doit être comprise dans la période active (du ${periode.date_debut} au ${periode.date_fin})`
          : `La date d'opération doit être postérieure ou égale au ${periode.date_debut}`,
        path: ['date_operation'],
      }
    );

type MouvementFormInput = z.input<ReturnType<typeof createMouvementSchema>>;
type MouvementFormOutput = z.output<ReturnType<typeof createMouvementSchema>>;

interface SectionFormProps {
  /** Période de gestion en cours de saisie */
  periode: PeriodeGestion;
  /** Section macro-comptable active (A, B, C, D, E) */
  section: SectionComptable;
  /** Bureau code pour l'historique récent */
  bureauCode?: number | null;
  /** Callback optionnel lorsqu'une écriture est modifiée / ajoutée */
  onMouvementChanged?: () => void;
  /** Totaux consolidés optionnels pour la barre TotauxLive */
  totalGeneralDebit?: number;
  totalGeneralCredit?: number;
}

export const SectionForm: React.FC<SectionFormProps> = ({
  periode,
  section,
  bureauCode,
  onMouvementChanged,
  totalGeneralDebit,
  totalGeneralCredit,
}) => {
  // Liste des mouvements enregistrés pour cette période et section
  const [mouvements, setMouvements] = useState<MouvementG58[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Recherche / sélection de ligne comptable
  const [selectedLigne, setSelectedLigne] = useState<LigneComptable | null>(null);
  const [showLigneSearch, setShowLigneSearch] = useState<boolean>(false);

  // Filtre et tri local du tableau des écritures
  const [tableSearch, setTableSearch] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Écriture en cours d'édition (si null, mode création)
  const [editingMouvement, setEditingMouvement] = useState<MouvementG58 | null>(null);
  const [deletingMouvement, setDeletingMouvement] = useState<MouvementG58 | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const pageSize = 10;

  // Message de confirmation flash
  const [successFlash, setSuccessFlash] = useState<string | null>(null);

  const isPeriodeCloturee = periode.cloturee;

  const schema = useMemo(() => createMouvementSchema(periode), [periode]);

  // Formulaire React Hook Form
  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    setError: setFormError,
    formState: { errors, isSubmitting },
  } = useForm<MouvementFormInput, unknown, MouvementFormOutput>({
    resolver: zodResolver(schema),
    defaultValues: {
      periode_gestion: periode.id,
      ligne_comptable: 0,
      date_operation: new Date().toISOString().slice(0, 10),
      montant: '',
      augmentation: '0.00',
      diminution: '0.00',
      motif_rectification: '',
    },
  });

  // Charger les écritures pour cette période et section
  const fetchSectionMouvements = useCallback(async () => {
    if (!periode.id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getMouvements({
        periode_gestion: periode.id,
        section: section.code,
      });
      setMouvements(res.results || []);
    } catch (err: any) {
      console.error('Erreur chargement écritures G58', err);
      setError(err?.detail || 'Impossible de charger les écritures de cette section.');
    } finally {
      setLoading(false);
    }
  }, [periode.id, section.code]);

  useEffect(() => {
    fetchSectionMouvements();
  }, [fetchSectionMouvements]);

  // Réinitialiser le formulaire et la pagination lors du changement de section ou période
  useEffect(() => {
    setSelectedLigne(null);
    setEditingMouvement(null);
    setShowLigneSearch(false);
    setPage(1);
    reset({
      periode_gestion: periode.id,
      ligne_comptable: 0,
      date_operation: new Date().toISOString().slice(0, 10),
      montant: '',
      augmentation: '0.00',
      diminution: '0.00',
      motif_rectification: '',
    });
  }, [periode.id, section.code, reset]);

  // Calcul live : somme des écritures enregistrées + montant rectifié en cours de saisie
  const watchMontant = watch('montant');
  const watchAugmentation = watch('augmentation');
  const watchDiminution = watch('diminution');

  const currentLiveRectifie = useMemo(() => {
    const m = parseNumber(watchMontant, 0);
    const aug = parseNumber(watchAugmentation, 0);
    const dim = parseNumber(watchDiminution, 0);
    const res = m + aug - dim;
    return res > 0 ? res : 0;
  }, [watchMontant, watchAugmentation, watchDiminution]);

  // Si on édite une ligne, on remplace son ancien montant rectifié par le nouveau en direct
  const sectionTotalLive = useMemo(() => {
    let base = 0;
    for (const m of mouvements) {
      if (editingMouvement && m.id === editingMouvement.id) {
        continue;
      }
      base += Number(m.montant_rectifie || m.montant || 0);
    }
    return base + currentLiveRectifie;
  }, [mouvements, editingMouvement, currentLiveRectifie]);

  // Soumission du formulaire
  const onFormSubmit = async (data: MouvementFormOutput) => {
    try {
      const payload = {
        periode_gestion: Number(data.periode_gestion),
        ligne_comptable: Number(data.ligne_comptable),
        date_operation: data.date_operation,
        montant: parseNumber(data.montant).toFixed(2),
        augmentation: parseNumber(data.augmentation || 0).toFixed(2),
        diminution: parseNumber(data.diminution || 0).toFixed(2),
        motif_rectification: data.motif_rectification?.trim() || '',
      };

      if (editingMouvement) {
        await updateMouvement(editingMouvement.id, payload);
        setSuccessFlash(`Écriture #${editingMouvement.id} mise à jour avec succès.`);
      } else {
        await createMouvement(payload);
        setSuccessFlash(`Écriture de ${formatAriary(data.montant, false)} imputée avec succès.`);
      }

      // Réinitialiser les champs et maintenir la ligne sélectionnée pour enchaîner
      setValue('montant', '');
      setValue('augmentation', '0.00');
      setValue('diminution', '0.00');
      setValue('motif_rectification', '');
      setEditingMouvement(null);
      await fetchSectionMouvements();
      if (onMouvementChanged) onMouvementChanged();
      setTimeout(() => setSuccessFlash(null), 4000);
    } catch (err: unknown) {
      const apiError = (err as any)?.data || (err as ApiError);
      applyServerValidationErrors(
        apiError,
        setFormError,
        [
          'periode_gestion',
          'ligne_comptable',
          'date_operation',
          'montant',
          'augmentation',
          'diminution',
          'motif_rectification',
        ]
      );
      if (apiError?.detail) {
        setFormError('root', { type: 'server', message: apiError.detail });
      }
    }
  };

  // Sélection d'une ligne comptable
  const handleSelectLigne = (ligne: LigneComptable) => {
    setSelectedLigne(ligne);
    setValue('ligne_comptable', ligne.id, { shouldValidate: true });
    setShowLigneSearch(false);
  };

  // Basculer en mode édition
  const handleStartEdit = (m: MouvementG58) => {
    setEditingMouvement(m);
    if (m.ligne_detail) {
      setSelectedLigne(m.ligne_detail);
    }
    setValue('ligne_comptable', m.ligne_comptable);
    setValue('date_operation', m.date_operation);
    setValue('montant', formatThousandsInput(Number(m.montant).toString()));
    setValue('augmentation', Number(m.augmentation || 0) > 0 ? formatThousandsInput(Number(m.augmentation).toString()) : '0.00');
    setValue('diminution', Number(m.diminution || 0) > 0 ? formatThousandsInput(Number(m.diminution).toString()) : '0.00');
    setValue('motif_rectification', m.motif_rectification || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingMouvement(null);
    setValue('montant', '');
    setValue('augmentation', '0.00');
    setValue('diminution', '0.00');
    setValue('motif_rectification', '');
  };

  // Suppression
  const handleConfirmDelete = async () => {
    if (!deletingMouvement) return;
    setIsDeleting(true);
    try {
      await deleteMouvement(deletingMouvement.id);
      setSuccessFlash(`Écriture #${deletingMouvement.id} supprimée.`);
      setDeletingMouvement(null);
      await fetchSectionMouvements();
      if (onMouvementChanged) onMouvementChanged();
      setTimeout(() => setSuccessFlash(null), 4000);
    } catch (err: any) {
      setError(err?.detail || 'Erreur lors de la suppression de l’écriture.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Écritures filtrées et triées pour le tableau
  const displayedMouvements = useMemo(() => {
    let list = [...mouvements];

    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase().trim();
      list = list.filter((m) => {
        const compte = m.ligne_detail?.compte?.toLowerCase() || '';
        const libelle = m.ligne_detail?.libelle?.toLowerCase() || '';
        const agent = m.saisi_par_username?.toLowerCase() || '';
        return compte.includes(q) || libelle.includes(q) || agent.includes(q);
      });
    }

    if (dateFilter) {
      list = list.filter((m) => m.date_operation === dateFilter);
    }

    list.sort((a, b) => {
      const cmp = a.date_operation.localeCompare(b.date_operation);
      return sortOrder === 'desc' ? -cmp : cmp;
    });

    return list;
  }, [mouvements, tableSearch, dateFilter, sortOrder]);

  // Réinitialiser la page quand les filtres de recherche de tableau changent
  useEffect(() => {
    setPage(1);
  }, [tableSearch, dateFilter, sortOrder]);

  // Découpage paginé des mouvements affichés
  const paginatedMouvements = useMemo(() => {
    const start = (page - 1) * pageSize;
    return displayedMouvements.slice(start, start + pageSize);
  }, [displayedMouvements, page, pageSize]);

  return (
    <div className="space-y-6" data-testid={`section-form-${section.code}`}>
      {/* Composant TotauxLive : calcul et affichage en temps réel sans soumission */}
      <TotauxLive
        sectionTotalLive={sectionTotalLive}
        sectionCode={section.code}
        sectionLibelle={section.libelle}
        sens={section.sens}
        totalDebit={totalGeneralDebit}
        totalCredit={totalGeneralCredit}
        count={mouvements.length}
      />

      {/* Message flash de succès */}
      {successFlash && (
        <div className="p-3.5 bg-status-success/15 border border-status-success/30 rounded-xl text-xs sm:text-sm font-sans text-status-success flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successFlash}</span>
        </div>
      )}

      {/* Avertissement de période clôturée */}
      {isPeriodeCloturee && (
        <div
          role="status"
          className="bg-surface-secondary border border-border-subtle rounded-xl p-4 flex items-center gap-3 text-xs sm:text-sm font-sans text-text-secondary"
        >
          <Lock className="w-5 h-5 text-accent shrink-0" />
          <div>
            <strong className="text-text-primary">Période clôturée :</strong> La saisie et la
            modification d’écritures pour la section {section.code} sont verrouillées conformément
            aux règles d'audit postal.
          </div>
        </div>
      )}

      {/* Formulaire de saisie d'écriture */}
      {!isPeriodeCloturee && (
        <div className="bg-surface-card border border-border-subtle rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-border-subtle pb-3">
            <div className="flex items-center gap-2 text-xs font-sans font-semibold text-text-secondary uppercase tracking-wider">
              <FileText className="w-4 h-4 text-brand" />
              <span>
                {editingMouvement
                  ? `Modifier l'écriture #${editingMouvement.id} (${editingMouvement.ligne_detail?.compte})`
                  : `Nouvelle écriture · Section ${section.code}`}
              </span>
            </div>
            {editingMouvement && (
              <Button type="button" variant="ghost" size="sm" onClick={handleCancelEdit}>
                Annuler modification
              </Button>
            )}
          </div>

          <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4" noValidate>
            {errors.root && (
              <div
                role="alert"
                className="p-3 bg-status-alert/10 border border-status-alert/30 rounded-lg text-xs font-sans text-status-alert flex items-start gap-2"
              >
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errors.root.message}</span>
              </div>
            )}

            {/* Ligne comptable sélectionnée */}
            <div>
              <label className="block text-xs font-sans font-medium text-text-secondary mb-1">
                Ligne comptable (imputation budgétaire) <span className="text-status-alert">*</span>
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <div
                  className={`flex-1 p-2.5 rounded-lg border text-xs font-sans flex items-center justify-between transition-colors ${
                    selectedLigne
                      ? 'bg-surface-primary border-border-subtle'
                      : 'bg-surface-secondary/40 border-border-subtle text-text-secondary'
                  }`}
                >
                  {selectedLigne ? (
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono font-bold text-accent bg-accent/15 px-2 py-0.5 rounded shrink-0">
                        {selectedLigne.compte}
                      </span>
                      <span className="font-medium text-text-primary truncate">
                        {selectedLigne.libelle}
                      </span>
                    </div>
                  ) : (
                    <span>Aucune ligne comptable sélectionnée. Cliquez pour rechercher un compte.</span>
                  )}
                  {selectedLigne && (
                    <CheckCircle2 className="w-4 h-4 text-status-success shrink-0 ml-2" />
                  )}
                </div>

                <Button
                  type="button"
                  variant={selectedLigne ? 'secondary' : 'primary'}
                  onClick={() => setShowLigneSearch(!showLigneSearch)}
                  className="flex items-center gap-1.5 shrink-0"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>{selectedLigne ? 'Changer de compte' : 'Rechercher un compte'}</span>
                </Button>
              </div>
              {errors.ligne_comptable && (
                <p className="text-xs font-sans text-status-alert mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{errors.ligne_comptable.message}</span>
                </p>
              )}
            </div>

            {/* Sélecteur LigneComptableSearch escamotable */}
            {showLigneSearch && (
              <div className="p-4 rounded-xl border border-accent/40 bg-surface-secondary/30 space-y-3 animate-in fade-in duration-150">
                <div className="flex items-center justify-between text-xs font-sans font-semibold text-text-secondary">
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-accent" />
                    Recherche instantanée dans le plan comptable (Section {section.code})
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowLigneSearch(false)}
                    className="text-text-secondary hover:text-text-primary text-xs cursor-pointer p-1"
                  >
                    Masquer ✕
                  </button>
                </div>
                <LigneComptableSearch
                  bureauCode={bureauCode}
                  defaultSection={section.code}
                  onlyLeaf={true}
                  onSelectLigne={handleSelectLigne}
                />
              </div>
            )}

            {/* Champs Date d'opération et Montant */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Date de l'opération"
                id="g58-date-operation"
                type="date"
                min={periode.date_debut}
                max={periode.date_fin || undefined}
                error={errors.date_operation?.message}
                {...register('date_operation')}
              />

              <Input
                label="Montant initial déclaré (Ariary)"
                id="g58-montant"
                type="text"
                inputMode="decimal"
                formatThousands
                placeholder="Ex : 25 000.00"
                error={errors.montant?.message}
                {...register('montant')}
              />
            </div>

            {/* Champs d'ajustement comptable : Augmentation, Diminution, Montant Rectifié & Motif */}
            <div className="p-4 rounded-xl border border-border-subtle bg-surface-secondary/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-sans font-semibold text-text-secondary uppercase tracking-wider">
                  Ajustement & Rectification (Optionnel)
                </span>
                <span className="text-xs font-sans text-text-secondary">
                  Montant Rectifié Net :{' '}
                  <strong className="text-accent font-mono text-sm">
                    {formatAriary(currentLiveRectifie)}
                  </strong>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input
                  label="Augmentation (+)"
                  id="g58-augmentation"
                  type="text"
                  inputMode="decimal"
                  formatThousands
                  placeholder="0.00"
                  error={errors.augmentation?.message}
                  {...register('augmentation')}
                />

                <Input
                  label="Diminution (-)"
                  id="g58-diminution"
                  type="text"
                  inputMode="decimal"
                  formatThousands
                  placeholder="0.00"
                  error={errors.diminution?.message}
                  {...register('diminution')}
                />

                <div>
                  <label className="block text-xs font-sans font-medium text-text-secondary mb-1">
                    Montant rectifié (calculé)
                  </label>
                  <div className="h-10 px-3 flex items-center bg-surface-secondary/60 border border-border-subtle rounded-lg font-mono font-bold text-text-primary text-sm tabular-nums">
                    {formatAriary(currentLiveRectifie)}
                  </div>
                </div>
              </div>

              <div>
                <Input
                  label="Motif de rectification / Justification"
                  id="g58-motif-rectification"
                  type="text"
                  placeholder="Ex : Régularisation d'écart, erreur de quittance, etc."
                  error={errors.motif_rectification?.message}
                  {...register('motif_rectification')}
                />
              </div>
            </div>

            {/* Bouton de validation rapide */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting || !selectedLigne}
                className="flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>
                  {isSubmitting
                    ? 'Enregistrement…'
                    : editingMouvement
                    ? 'Mettre à jour l’écriture'
                    : 'Ajouter au Journal G58'}
                </span>
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* État de chargement */}
      {loading && (
        <div
          data-testid="section-mouvements-loading"
          className="bg-surface-card border border-border-subtle rounded-xl p-10 text-center flex flex-col items-center justify-center space-y-2"
        >
          <RefreshCw className="w-6 h-6 text-brand animate-spin" />
          <p className="text-xs font-sans text-text-secondary">
            Chargement des écritures comptables de la Section {section.code}…
          </p>
        </div>
      )}

      {/* État d'erreur */}
      {error && !loading && (
        <div
          role="alert"
          className="p-4 bg-status-alert/10 border border-status-alert/30 rounded-xl text-xs font-sans text-status-alert flex items-start gap-2.5"
        >
          <AlertTriangle className="w-4 h-4 shrink-0 text-status-alert mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* État vide si aucune écriture */}
      {!loading && !error && mouvements.length === 0 && (
        <div
          data-testid="section-mouvements-empty"
          className="bg-surface-card border border-border-subtle border-dashed rounded-xl p-10 text-center space-y-2"
        >
          <FileText className="w-8 h-8 text-text-secondary/50 mx-auto" />
          <h4 className="text-sm font-heading font-semibold text-text-primary">
            Aucune écriture enregistrée pour la Section {section.code}
          </h4>
          <p className="text-xs font-sans text-text-secondary max-w-md mx-auto">
            Utilisez le formulaire ci-dessus pour imputer vos opérations du mois selon la nomenclature postale.
          </p>
        </div>
      )}

      {/* Tableau des écritures de la section */}
      {!loading && !error && mouvements.length > 0 && (
        <div className="bg-surface-card border border-border-subtle rounded-xl overflow-hidden shadow-xs space-y-0">
          {/* Barre d'outils du tableau : recherche rapide et filtres */}
          <div className="p-3.5 bg-surface-secondary/40 border-b border-border-subtle flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-[240px]">
              <span className="text-xs font-sans font-semibold text-text-secondary uppercase tracking-wider shrink-0">
                Écritures ({displayedMouvements.length} / {mouvements.length})
              </span>

              {/* Recherche textuelle dans le tableau */}
              <div className="relative flex-1 max-w-xs">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-text-secondary" />
                <input
                  type="text"
                  placeholder="Filtrer compte, libellé…"
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1 text-xs font-sans bg-surface-primary border border-border-subtle rounded-md text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              {/* Filtre Date */}
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                title="Filtrer par date"
                className="text-xs font-sans bg-surface-primary border border-border-subtle rounded-md px-2 py-1 text-text-secondary focus:outline-none focus:ring-1 focus:ring-accent"
              />

              {(tableSearch || dateFilter) && (
                <button
                  type="button"
                  onClick={() => {
                    setTableSearch('');
                    setDateFilter('');
                  }}
                  className="text-[11px] font-sans text-accent hover:underline cursor-pointer"
                >
                  Effacer
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                title="Inverser le tri chronologique"
                className="text-xs flex items-center gap-1 text-text-secondary hover:text-text-primary"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
                <span>Date {sortOrder === 'desc' ? 'récente' : 'ancienne'}</span>
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={fetchSectionMouvements}
                title="Rafraîchir"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse" data-testid="table-section-mouvements">
              <thead>
                <tr className="border-b border-border-subtle bg-surface-secondary/20 text-[11px] font-sans font-semibold text-text-secondary uppercase tracking-wider">
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">Compte</th>
                  <th className="py-2.5 px-4">Libellé</th>
                  <th className="py-2.5 px-4 text-right">Montant</th>
                  <th className="py-2.5 px-4 text-right text-accent">Augm. (+)</th>
                  <th className="py-2.5 px-4 text-right text-status-alert">Dim. (-)</th>
                  <th className="py-2.5 px-4 text-right">Net Rectifié</th>
                  <th className="py-2.5 px-4">Motif</th>
                  <th className="py-2.5 px-4 text-center">Saisi par</th>
                  <th className="py-2.5 px-4 text-center w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle text-xs font-sans">
                {paginatedMouvements.map((m) => (
                  <tr
                    key={m.id}
                    className="hover:bg-surface-secondary/30 transition-colors"
                    data-testid={`mouvement-row-${m.id}`}
                  >
                    <td className="py-3 px-4 font-mono text-text-secondary whitespace-nowrap">
                      {formatDate(m.date_operation)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-accent bg-accent/15 px-1.5 py-0.5 rounded text-[11px]">
                        {m.ligne_detail?.compte || `ID:${m.ligne_comptable}`}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-text-primary font-medium">
                      {m.ligne_detail?.libelle || 'Écriture comptable'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-text-secondary tabular-nums whitespace-nowrap">
                      {formatAriary(m.montant)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums whitespace-nowrap text-accent">
                      {Number(m.augmentation || 0) > 0 ? `+${formatAriary(m.augmentation)}` : '—'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums whitespace-nowrap text-status-alert">
                      {Number(m.diminution || 0) > 0 ? `-${formatAriary(m.diminution)}` : '—'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-text-primary tabular-nums whitespace-nowrap">
                      {formatAriary(m.montant_rectifie || m.montant)}
                    </td>
                    <td className="py-3 px-4 text-text-secondary text-[11px] max-w-[150px] truncate" title={m.motif_rectification}>
                      {m.motif_rectification || '—'}
                    </td>
                    <td className="py-3 px-4 text-center text-text-secondary text-[11px] whitespace-nowrap">
                      {m.saisi_par_username}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(m)}
                          disabled={isPeriodeCloturee}
                          className="p-1.5 text-text-secondary hover:text-brand rounded-md hover:bg-surface-secondary transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                          title="Modifier"
                          aria-label={`Modifier écriture #${m.id}`}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingMouvement(m)}
                          disabled={isPeriodeCloturee}
                          className="p-1.5 text-text-secondary hover:text-status-alert rounded-md hover:bg-surface-secondary transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                          title="Supprimer"
                          aria-label={`Supprimer écriture #${m.id}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination des écritures G58 */}
          {!loading && displayedMouvements.length > 0 && (
            <Pagination
              currentPage={page}
              totalCount={displayedMouvements.length}
              pageSize={pageSize}
              onPageChange={(newPage) => setPage(newPage)}
              isLoading={loading}
              itemLabel="écriture"
            />
          )}
        </div>
      )}

      {/* Confirmation de suppression */}
      {deletingMouvement && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-surface-card border border-border-subtle rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-status-alert/10 text-status-alert shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-heading font-bold text-text-primary">
                  Supprimer l'écriture #{deletingMouvement.id} ?
                </h3>
                <p className="text-xs font-sans text-text-secondary mt-1">
                  Cette action supprimera définitivement cette imputation de{' '}
                  <strong className="text-text-primary font-mono">
                    {formatAriary(deletingMouvement.montant)}
                  </strong>{' '}
                  sur le compte{' '}
                  <strong className="text-text-primary font-mono">
                    {deletingMouvement.ligne_detail?.compte}
                  </strong>.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
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
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeleting ? 'Suppression…' : 'Confirmer la suppression'}</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
