import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type {
  PeriodeGestion,
  RubriqueEncaisse,
  MouvementEncaisse,
  MouvementEncaisseFormData,
  ApiError,
} from '../../../types';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { applyServerValidationErrors } from '../../../lib/formErrors';
import { formatThousandsInput, parseNumber } from '../../../lib/formatters';
import { DollarSign, AlertCircle, X } from 'lucide-react';

const createEncaisseSchema = (periode: PeriodeGestion) =>
  z
    .object({
      periode_gestion: z.coerce.number().int().positive('Période invalide'),
      rubrique_encaisse: z.coerce.number().int().positive('Veuillez sélectionner une rubrique d’encaisse'),
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
  rubriques: RubriqueEncaisse[];
  initialData?: MouvementEncaisse | null;
  onSubmitSuccess: () => void;
  onSave: (data: MouvementEncaisseFormData) => Promise<void>;
}

export const EncaisseFormModal: React.FC<EncaisseFormModalProps> = ({
  isOpen,
  onClose,
  periode,
  rubriques,
  initialData,
  onSubmitSuccess,
  onSave,
}) => {
  const schema = React.useMemo(() => createEncaisseSchema(periode), [periode]);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<EncaisseFormInput, unknown, EncaisseFormOutput>({
    resolver: zodResolver(schema),
    defaultValues: {
      periode_gestion: periode.id,
      rubrique_encaisse: initialData?.rubrique_encaisse || rubriques[0]?.id || 0,
      sens: initialData?.sens || 1,
      date_operation: initialData?.date_operation || periode.date_debut || new Date().toISOString().slice(0, 10),
      montant: initialData ? formatThousandsInput(Number(initialData.montant).toString()) : '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        periode_gestion: periode.id,
        rubrique_encaisse: initialData?.rubrique_encaisse || rubriques[0]?.id || 0,
        sens: initialData?.sens || 1,
        date_operation: initialData?.date_operation || periode.date_debut || new Date().toISOString().slice(0, 10),
        montant: initialData ? formatThousandsInput(Number(initialData.montant).toString()) : '',
      });
    }
  }, [isOpen, periode, rubriques, initialData, reset]);

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
        ['periode_gestion', 'rubrique_encaisse', 'sens', 'date_operation', 'montant']
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

          {/* Rubrique d'encaisse */}
          <div>
            <label htmlFor="encaisse-rubrique" className="block text-xs font-sans font-medium text-text-primary mb-1">
              Rubrique d’encaisse <span className="text-status-alert">*</span>
            </label>
            <Select
              id="encaisse-rubrique"
              options={rubriques.map((rub) => ({
                value: rub.id,
                label: `${rub.compte} — ${rub.libelle}`,
              }))}
              {...register('rubrique_encaisse')}
              error={errors.rubrique_encaisse?.message}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              Enregistrer l’opération
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
