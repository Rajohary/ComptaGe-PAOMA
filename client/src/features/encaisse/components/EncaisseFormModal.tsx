import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type {
  PeriodeGestion,
  Bureau,
  RubriqueEncaisse,
  MouvementEncaisse,
  MouvementEncaisseFormData,
  RubriqueEncaisseFormData,
  ApiError,
  RubriqueEncaisseParent,
  RubriqueEncaisseParentFormData,
} from '../../../types';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { applyServerValidationErrors } from '../../../lib/formErrors';
import { formatThousandsInput, parseNumber } from '../../../lib/formatters';
import { DollarSign, AlertCircle, X, Plus } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';

const createEncaisseSchema = (periode: PeriodeGestion) =>
  z
    .object({
      periode_gestion: z.coerce.number().int().positive('Période invalide'),
      rubrique_parent: z.coerce.number().int().positive('Veuillez sélectionner une rubrique d’encaisse'),
      rubrique_encaisse: z.coerce.number().int().positive('Veuillez sélectionner une sous-rubrique'),
      sens: z.coerce.number().refine((val) => val === 1 || val === 2, 'Sens d’opération invalide'),
      date_operation: z.string().min(10, 'La date de l’opération est obligatoire'),
      montant: z
        .string()
        .min(1, 'Le montant est obligatoire')
        .refine(
          (val) => !isNaN(parseNumber(val, NaN)) && parseNumber(val) > 0,
          'Le montant doit être strictement supérieur à zéro'
        ),
    })
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

type EncaisseFormInput = z.input<ReturnType<typeof createEncaisseSchema>>;
type EncaisseFormOutput = z.output<ReturnType<typeof createEncaisseSchema>>;

interface EncaisseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  periode: PeriodeGestion;
  periodes: PeriodeGestion[];
  bureaus: Bureau[];
  selectedBureauId: number;
  rubriques: RubriqueEncaisse[];
  rubriquesParentes: RubriqueEncaisseParent[];
  initialData?: MouvementEncaisse | null;
  onSubmitSuccess: () => void;
  onSave: (data: MouvementEncaisseFormData) => Promise<void>;
  onCreateRubrique: (data: RubriqueEncaisseFormData) => Promise<RubriqueEncaisse>;
  onCreateRubriqueParent: (data: RubriqueEncaisseParentFormData) => Promise<RubriqueEncaisseParent>;
  onAdminSelectionChange?: (bureauId: number, periodeId: number) => void;
}

export const EncaisseFormModal: React.FC<EncaisseFormModalProps> = ({
  isOpen,
  onClose,
  periode,
  periodes,
  bureaus,
  selectedBureauId,
  rubriques,
  rubriquesParentes,
  initialData,
  onSubmitSuccess,
  onSave,
  onCreateRubrique,
  onCreateRubriqueParent,
  onAdminSelectionChange,
}) => {
  const { role } = useAuth();
  const [modalBureauId, setModalBureauId] = useState(selectedBureauId);
  const [modalPeriodeId, setModalPeriodeId] = useState(periode.id);
  const effectivePeriode = periodes.find((item) => item.id === modalPeriodeId) || periode;
  const schema = React.useMemo(() => createEncaisseSchema(effectivePeriode), [effectivePeriode]);
  const initialParent = initialData?.rubrique_detail?.rubrique_parent || rubriques[0]?.rubrique_parent || 0;
  const initialRubrique = initialData?.rubrique_encaisse
    || rubriques.find((rub) => rub.rubrique_parent === initialParent)?.id
    || 0;
  const [isCreateRubriqueOpen, setIsCreateRubriqueOpen] = useState(false);
  const [quickCompte, setQuickCompte] = useState('');
  const [quickLibelle, setQuickLibelle] = useState('');
  const [quickError, setQuickError] = useState<string | null>(null);
  const [isCreatingRubrique, setIsCreatingRubrique] = useState(false);
  const [isCreateParentOpen, setIsCreateParentOpen] = useState(false);
  const [quickParentLibelle, setQuickParentLibelle] = useState('');
  const [quickParentError, setQuickParentError] = useState<string | null>(null);
  const [isCreatingParent, setIsCreatingParent] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EncaisseFormInput, unknown, EncaisseFormOutput>({
    resolver: zodResolver(schema),
    defaultValues: {
      periode_gestion: periode.id,
      rubrique_parent: initialParent,
      rubrique_encaisse: initialRubrique,
      sens: initialData?.sens || 1,
      date_operation: initialData?.date_operation || periode.date_debut || new Date().toISOString().slice(0, 10),
      montant: initialData ? formatThousandsInput(Number(initialData.montant).toString()) : '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      setModalBureauId(selectedBureauId);
      setModalPeriodeId(periode.id);
      reset({
        periode_gestion: periode.id,
        rubrique_parent: initialParent,
        rubrique_encaisse: initialRubrique,
        sens: initialData?.sens || 1,
        date_operation: initialData?.date_operation || periode.date_debut || new Date().toISOString().slice(0, 10),
        montant: initialData ? formatThousandsInput(Number(initialData.montant).toString()) : '',
      });
    }
  }, [isOpen, periode, selectedBureauId, rubriques, initialData, reset]);

  const selectedParent = Number(watch('rubrique_parent') || 0);
  const parentOptions = rubriquesParentes.length > 0
    ? rubriquesParentes.map((parent) => ({ value: parent.id, label: parent.libelle }))
    : Array.from(
        new Map(rubriques.map((rub) => [rub.rubrique_parent, {
          value: rub.rubrique_parent,
          label: rub.parent_libelle,
        }])).values()
      );
  const sousRubriques = rubriques.filter((rub) => rub.rubrique_parent === selectedParent);

  useEffect(() => {
    if (!isOpen) return;
    const firstSousRubrique = sousRubriques[0]?.id || 0;
    const currentSousRubrique = Number(watch('rubrique_encaisse') || 0);
    const stillValid = sousRubriques.some((rub) => rub.id === currentSousRubrique);
    if (!stillValid) setValue('rubrique_encaisse', firstSousRubrique);
  }, [selectedParent, isOpen, rubriques, setValue, watch]);

  const bureauPeriodes = periodes.filter((item) => item.bureau === modalBureauId);
  const bureauPeriodeOptions = bureauPeriodes.map((item) => ({
    value: item.id,
    label: `${item.date_debut} au ${item.date_fin || 'en cours'}${item.cloturee ? ' (Clôturée)' : ' (En cours)'}`,
  }));

  const handleBureauChange = (bureauId: number) => {
    setModalBureauId(bureauId);
    const nextPeriodes = periodes.filter((item) => item.bureau === bureauId);
    const nextPeriode = nextPeriodes.find((item) => !item.cloturee) || nextPeriodes[0] || null;
    if (nextPeriode) {
      setModalPeriodeId(nextPeriode.id);
      setValue('periode_gestion', nextPeriode.id);
      setValue('date_operation', nextPeriode.date_debut || new Date().toISOString().slice(0, 10));
      onAdminSelectionChange?.(bureauId, nextPeriode.id);
    } else {
      setModalPeriodeId(0);
      setValue('periode_gestion', 0);
      onAdminSelectionChange?.(bureauId, 0);
    }
  };

  const handlePeriodeChange = (periodeId: number) => {
    const nextPeriode = periodes.find((item) => item.id === periodeId);
    if (!nextPeriode) return;
    setModalPeriodeId(nextPeriode.id);
    setValue('periode_gestion', nextPeriode.id);
    setValue('date_operation', nextPeriode.date_debut || new Date().toISOString().slice(0, 10));
    onAdminSelectionChange?.(modalBureauId, nextPeriode.id);
  };

  const handleQuickCreateRubrique = async () => {
    setQuickError(null);
    if (!selectedParent) {
      setQuickError('Sélectionnez d’abord une rubrique d’encaisse.');
      return;
    }
    if (!quickCompte.trim() || !quickLibelle.trim()) {
      setQuickError('Le code et le libellé sont obligatoires.');
      return;
    }
    setIsCreatingRubrique(true);
    try {
      const created = await onCreateRubrique({
        rubrique_parent: selectedParent,
        compte: quickCompte.trim(),
        libelle: quickLibelle.trim(),
      });
      setValue('rubrique_encaisse', created.id);
      setQuickCompte('');
      setQuickLibelle('');
      setIsCreateRubriqueOpen(false);
    } catch (err: unknown) {
      const apiError = (err as any)?.data || (err as ApiError);
      setQuickError(apiError?.detail || apiError?.libelle?.[0] || apiError?.menu_sub?.[0] || 'Impossible de créer la sous-rubrique.');
    } finally {
      setIsCreatingRubrique(false);
    }
  };

  const handleQuickCreateParent = async () => {
    setQuickParentError(null);
    if (!quickParentLibelle.trim()) {
      setQuickParentError('Le libellé de la rubrique d’encaisse est obligatoire.');
      return;
    }
    setIsCreatingParent(true);
    try {
      const created = await onCreateRubriqueParent({ libelle: quickParentLibelle.trim() });
      setValue('rubrique_parent', created.id);
      setQuickParentLibelle('');
      setIsCreateParentOpen(false);
    } catch (err: unknown) {
      const apiError = (err as any)?.data || (err as ApiError);
      setQuickParentError(apiError?.detail || apiError?.libelle?.[0] || 'Impossible de créer la rubrique d’encaisse.');
    } finally {
      setIsCreatingParent(false);
    }
  };

  if (!isOpen) return null;

  const onFormSubmit = async (data: EncaisseFormOutput) => {
    try {
      await onSave({
        periode_gestion: Number(data.periode_gestion),
        rubrique_encaisse: Number(data.rubrique_encaisse),
        sens: Number(data.sens),
        date_operation: data.date_operation,
        montant: parseNumber(data.montant).toFixed(2),
      });
      onSubmitSuccess();
      onClose();
    } catch (err: unknown) {
      const apiError = (err as any)?.data || (err as ApiError);
      applyServerValidationErrors(
        apiError,
        setError,
        ['periode_gestion', 'rubrique_parent', 'rubrique_encaisse', 'sens', 'date_operation', 'montant']
      );
      if (apiError?.detail) {
        setError('root', { type: 'server', message: apiError.detail });
      }
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-encaisse-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="bg-surface-card rounded-2xl border border-border-subtle shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand/10 text-brand flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 id="modal-encaisse-title" className="text-base font-heading font-bold text-text-primary">
                {initialData ? 'Modifier le mouvement d’encaisse' : 'Enregistrer un mouvement d’encaisse'}
              </h3>
              <p className="text-xs font-sans text-text-secondary">
                {initialData ? `Écriture #${initialData.id} — flux de caisse ou coffre` : 'Entrée ou sortie physique de caisse ou coffre-fort'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary p-1.5 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Fermer la boîte de dialogue"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onFormSubmit)} className="p-6 space-y-4">
          {errors.root && (
            <div
              role="alert"
              className="p-3 bg-status-alert/10 border border-status-alert/30 rounded-xl text-xs font-sans text-status-alert flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-status-alert mt-0.5" />
              <span>{errors.root.message}</span>
            </div>
          )}

          {role === 'ADMIN' && !initialData && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" data-testid="encaisse-admin-context">
              <Select
                label="Bureau de poste"
                id="encaisse-bureau"
                options={bureaus.map((bureau) => ({ value: bureau.id, label: `${bureau.ncodique} — ${bureau.nom_bureau}` }))}
                value={modalBureauId}
                onChange={(event) => handleBureauChange(Number(event.target.value))}
                required
              />
              <Select
                label="Période de gestion"
                id="encaisse-periode"
                options={bureauPeriodeOptions}
                value={modalPeriodeId || ''}
                onChange={(event) => handlePeriodeChange(Number(event.target.value))}
                required
              />
            </div>
          )}

          {/* Rubrique d'encaisse */}
          <div>
            <label htmlFor="encaisse-rubrique-parent" className="block text-xs font-sans font-medium text-text-primary mb-1">
              Rubrique d’encaisse <span className="text-status-alert">*</span>
            </label>
            <div className="flex items-center gap-2">
              <Select
                id="encaisse-rubrique-parent"
                options={parentOptions}
                {...register('rubrique_parent')}
                error={errors.rubrique_parent?.message}
              />
              {role === 'ADMIN' && (
                <Button
                  type="button"
                  variant="secondary"
                  className="h-10 px-3"
                  onClick={() => setIsCreateParentOpen((open) => !open)}
                  aria-label="Créer une rubrique d’encaisse"
                  title="Créer une rubrique d’encaisse"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {isCreateParentOpen && role === 'ADMIN' && (
            <div className="rounded-xl border border-border-subtle bg-surface-secondary p-3 space-y-3">
              <p className="text-xs font-sans font-medium text-text-primary">
                Nouvelle rubrique d’encaisse
              </p>
              <Input
                id="quick-parent-libelle"
                label="Libellé"
                value={quickParentLibelle}
                onChange={(event) => setQuickParentLibelle(event.target.value)}
                placeholder="Ex: ENCAISSEMENT SPÉCIAL"
              />
              {quickParentError && (
                <p role="alert" className="text-xs text-status-alert">{quickParentError}</p>
              )}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setIsCreateParentOpen(false)}>
                  Annuler
                </Button>
                <Button type="button" variant="primary" isLoading={isCreatingParent} onClick={handleQuickCreateParent}>
                  Créer la rubrique
                </Button>
              </div>
            </div>
          )}

          {/* Sous-rubrique */}
          <div>
            <label htmlFor="encaisse-rubrique" className="block text-xs font-sans font-medium text-text-primary mb-1">
              Sous-rubrique <span className="text-status-alert">*</span>
            </label>
            <div className="flex items-center gap-2">
              <Select
                id="encaisse-rubrique"
                options={sousRubriques.map((rub) => ({
                  value: rub.id,
                  label: `${rub.compte || '—'} — ${rub.libelle}`,
                }))}
                {...register('rubrique_encaisse')}
                error={errors.rubrique_encaisse?.message}
              />
              {role === 'ADMIN' && (
                <Button
                  type="button"
                  variant="secondary"
                  className="h-10 px-3"
                  onClick={() => setIsCreateRubriqueOpen((open) => !open)}
                  aria-label="Créer une sous-rubrique pour cette rubrique d’encaisse"
                  title="Créer une sous-rubrique"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {isCreateRubriqueOpen && role === 'ADMIN' && (
            <div className="rounded-xl border border-border-subtle bg-surface-secondary p-3 space-y-3">
              <p className="text-xs font-sans font-medium text-text-primary">
                Nouvelle sous-rubrique pour {parentOptions.find((parent) => parent.value === selectedParent)?.label || 'la rubrique sélectionnée'}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  id="quick-rubrique-compte"
                  label="Code"
                  value={quickCompte}
                  onChange={(event) => setQuickCompte(event.target.value)}
                  placeholder="Ex: TR2"
                />
                <Input
                  id="quick-rubrique-libelle"
                  label="Libellé"
                  value={quickLibelle}
                  onChange={(event) => setQuickLibelle(event.target.value)}
                  placeholder="Ex: Réserve secondaire"
                />
              </div>
              {quickError && (
                <p role="alert" className="text-xs text-status-alert">{quickError}</p>
              )}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setIsCreateRubriqueOpen(false)}>
                  Annuler
                </Button>
                <Button type="button" variant="primary" isLoading={isCreatingRubrique} onClick={handleQuickCreateRubrique}>
                  Créer la sous-rubrique
                </Button>
              </div>
            </div>
          )}

          {/* Sens du flux */}
          <div>
            <label htmlFor="encaisse-sens" className="block text-xs font-sans font-medium text-text-primary mb-1">
              Sens du flux <span className="text-status-alert">*</span>
            </label>
            <Select
              id="encaisse-sens"
              options={[
                { value: 1, label: 'Entrée (Caisse / Coffre)' },
                { value: 2, label: 'Sortie (Décaissement)' },
              ]}
              {...register('sens')}
              error={errors.sens?.message}
            />
          </div>

          {/* Date d'opération */}
          <div>
            <label htmlFor="encaisse-date" className="block text-xs font-sans font-medium text-text-primary mb-1">
              Date d’opération <span className="text-status-alert">*</span>
            </label>
            <Input
              id="encaisse-date"
              type="date"
              {...register('date_operation')}
              error={errors.date_operation?.message}
            />
          </div>

          {/* Montant en Ariary */}
          <div>
            <label htmlFor="encaisse-montant" className="block text-xs font-sans font-medium text-text-primary mb-1">
              Montant du flux (Ar) <span className="text-status-alert">*</span>
            </label>
            <Input
              id="encaisse-montant"
              type="text"
              inputMode="decimal"
              formatThousands
              placeholder="Ex: 50 000"
              {...register('montant')}
              error={errors.montant?.message}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-subtle">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
              Annuler
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting} data-testid="submit-encaisse-btn">
              {initialData ? 'Mettre à jour' : 'Enregistrer'} le mouvement
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
