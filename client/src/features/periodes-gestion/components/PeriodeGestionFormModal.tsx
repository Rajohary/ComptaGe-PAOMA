import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import type { Bureau, PeriodeGestionFormData, ApiError } from '../../../types';
import { Coins, Stamp, FileSpreadsheet } from 'lucide-react';
import { applyServerValidationErrors } from '../../../lib/formErrors';

const basePeriodeGestionSchema = z.object({
  bureau: z.coerce.number().int().positive('Veuillez sélectionner un bureau de poste valide'),
  nom_receveur: z.string().min(2, 'Le nom du receveur doit comporter au moins 2 caractères'),
  date_debut: z.string().min(1, 'La date de début est obligatoire'),
  date_fin: z.string().min(1, 'La date de fin est obligatoire'),
  reserve_numeraire: z
    .string()
    .min(1, 'Le montant de réserve en numéraire est obligatoire')
    .refine(
      (val) => !isNaN(Number(val)) && Number(val) >= 0,
      'La réserve en numéraire doit être un nombre positif ou nul'
    ),
  valeurs_postales: z
    .string()
    .min(1, 'Le montant des valeurs postales est obligatoire')
    .refine(
      (val) => !isNaN(Number(val)) && Number(val) >= 0,
      'Le montant des valeurs postales doit être un nombre positif ou nul'
    ),
  timbres_fiscaux: z
    .string()
    .min(1, 'Le montant des timbres fiscaux est obligatoire')
    .refine(
      (val) => !isNaN(Number(val)) && Number(val) >= 0,
      'Le montant des timbres fiscaux doit être un nombre positif ou nul'
    ),
  solde_debiteur_depart: z
    .string()
    .optional()
    .refine(
      (val) => !val || (!isNaN(Number(val)) && Number(val) >= 0),
      'Le solde débiteur doit être un nombre positif ou nul'
    ),
  solde_crediteur_depart: z
    .string()
    .optional()
    .refine(
      (val) => !val || (!isNaN(Number(val)) && Number(val) >= 0),
      'Le solde créditeur doit être un nombre positif ou nul'
    ),
});

const periodeGestionSchema = basePeriodeGestionSchema.refine(
  (data) => {
    if (data.date_debut && data.date_fin) {
      return data.date_fin >= data.date_debut;
    }
    return true;
  },
  {
    message: 'La date de fin de gestion doit être supérieure ou égale à la date de début',
    path: ['date_fin'],
  }
);

type PeriodeGestionFormInput = z.input<typeof periodeGestionSchema>;
type PeriodeGestionFormOutput = z.output<typeof periodeGestionSchema>;

interface PeriodeGestionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PeriodeGestionFormData) => Promise<void>;
  bureaux: Bureau[];
  apiErrors?: ApiError;
}

export const PeriodeGestionFormModal: React.FC<PeriodeGestionFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  bureaux,
  apiErrors,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PeriodeGestionFormInput, unknown, PeriodeGestionFormOutput>({
    resolver: zodResolver(periodeGestionSchema),
    defaultValues: {
      bureau: bureaux[0]?.id || 1,
      nom_receveur: '',
      date_debut: new Date().toISOString().slice(0, 7) + '-01',
      date_fin: new Date().toISOString().slice(0, 10),
      reserve_numeraire: '0.00',
      valeurs_postales: '0.00',
      timbres_fiscaux: '0.00',
      solde_debiteur_depart: '0.00',
      solde_crediteur_depart: '0.00',
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        bureau: bureaux[0]?.id || 1,
        nom_receveur: '',
        date_debut: new Date().toISOString().slice(0, 7) + '-01',
        date_fin: new Date().toISOString().slice(0, 10),
        reserve_numeraire: '0.00',
        valeurs_postales: '0.00',
        timbres_fiscaux: '0.00',
        solde_debiteur_depart: '0.00',
        solde_crediteur_depart: '0.00',
      });
    }
  }, [isOpen, bureaux, reset]);

  // Associer les erreurs de validation renvoyées par le backend Django
  useEffect(() => {
    if (apiErrors) {
      applyServerValidationErrors(
        apiErrors,
        setError,
        Object.keys(basePeriodeGestionSchema.shape) as (keyof PeriodeGestionFormInput)[]
      );
    }
  }, [apiErrors, setError]);

  const handleFormSubmit = async (values: PeriodeGestionFormOutput) => {
    await onSubmit({
      bureau: values.bureau,
      nom_receveur: values.nom_receveur,
      date_debut: values.date_debut,
      date_fin: values.date_fin,
      reserve_numeraire: Number(values.reserve_numeraire).toFixed(2),
      valeurs_postales: Number(values.valeurs_postales).toFixed(2),
      timbres_fiscaux: Number(values.timbres_fiscaux).toFixed(2),
      solde_debiteur_depart: Number(values.solde_debiteur_depart || 0).toFixed(2),
      solde_crediteur_depart: Number(values.solde_crediteur_depart || 0).toFixed(2),
    });
  };

  // Calcul instantané du total de l'inventaire initial
  const watchNumeraire = Number(watch('reserve_numeraire') || 0);
  const watchValeurs = Number(watch('valeurs_postales') || 0);
  const watchTimbres = Number(watch('timbres_fiscaux') || 0);
  const totalInventaireInitial = (isNaN(watchNumeraire) ? 0 : watchNumeraire) +
    (isNaN(watchValeurs) ? 0 : watchValeurs) +
    (isNaN(watchTimbres) ? 0 : watchTimbres);

  const bureauOptions = bureaux.map((b) => ({
    value: b.id,
    label: `${b.ncodique} — ${b.nom_bureau} (${b.classe})`,
  }));

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} noValidate className="space-y-5">
      {apiErrors?.detail && (
        <div className="p-3 text-sm rounded bg-surface-secondary border border-status-alert text-status-alert font-sans">
          {typeof apiErrors.detail === 'string' ? apiErrors.detail : apiErrors.detail[0]}
        </div>
      )}

      {/* Informations générales de la période */}
      <div className="space-y-4">
        <h4 className="text-xs font-sans font-semibold text-text-secondary uppercase tracking-wider">
          1. Rattachement & Dates de gestion
        </h4>

        <Select
          label="Bureau de poste"
          required
          options={bureauOptions.length > 0 ? bureauOptions : [{ value: 1, label: 'Aucun bureau disponible' }]}
          error={errors.bureau?.message}
          {...register('bureau')}
        />

        <Input
          label="Nom du receveur gestionnaire"
          required
          placeholder="Ex: Rakoto Jean"
          error={errors.nom_receveur?.message}
          {...register('nom_receveur')}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Date de début"
            required
            type="date"
            error={errors.date_debut?.message}
            {...register('date_debut')}
          />
          <Input
            label="Date de fin"
            required
            type="date"
            error={errors.date_fin?.message}
            {...register('date_fin')}
          />
        </div>
      </div>

      {/* Inventaire initial obligatoire */}
      <div className="space-y-4 pt-3 border-t border-border-subtle">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-sans font-semibold text-text-secondary uppercase tracking-wider">
            2. Inventaire initial obligatoire (Ariary)
          </h4>
          <span className="text-xs text-text-secondary font-sans italic">
            * Champs requis au démarrage
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-text-secondary">
              <Coins className="w-3.5 h-3.5 text-accent" />
              <span>Numéraire en caisse</span>
            </div>
            <Input
              type="number"
              step="0.01"
              required
              placeholder="0.00"
              className="tabular-nums font-mono text-right"
              error={errors.reserve_numeraire?.message}
              {...register('reserve_numeraire')}
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-text-secondary">
              <Stamp className="w-3.5 h-3.5 text-accent" />
              <span>Valeurs postales</span>
            </div>
            <Input
              type="number"
              step="0.01"
              required
              placeholder="0.00"
              className="tabular-nums font-mono text-right"
              error={errors.valeurs_postales?.message}
              {...register('valeurs_postales')}
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-text-secondary">
              <FileSpreadsheet className="w-3.5 h-3.5 text-accent" />
              <span>Timbres fiscaux</span>
            </div>
            <Input
              type="number"
              step="0.01"
              required
              placeholder="0.00"
              className="tabular-nums font-mono text-right"
              error={errors.timbres_fiscaux?.message}
              {...register('timbres_fiscaux')}
            />
          </div>
        </div>

        {/* Encadré récapitulatif live du total inventaire */}
        <div className="p-3 rounded bg-surface-secondary/70 border border-border-subtle flex items-center justify-between">
          <span className="text-xs font-sans font-medium text-text-secondary">
            Total inventaire initial :
          </span>
          <span className="text-sm font-mono font-bold text-accent tabular-nums">
            {totalInventaireInitial.toLocaleString('fr-FR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{' '}
            MGA
          </span>
        </div>
      </div>

      {/* Soldes de départ facultatifs */}
      <div className="space-y-3 pt-3 border-t border-border-subtle">
        <h4 className="text-xs font-sans font-semibold text-text-secondary uppercase tracking-wider">
          3. Soldes de passation / départ (Optionnels)
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Solde débiteur de départ"
            type="number"
            step="0.01"
            placeholder="0.00"
            className="tabular-nums font-mono text-right"
            error={errors.solde_debiteur_depart?.message}
            {...register('solde_debiteur_depart')}
          />

          <Input
            label="Solde créditeur de départ"
            type="number"
            step="0.01"
            placeholder="0.00"
            className="tabular-nums font-mono text-right"
            error={errors.solde_crediteur_depart?.message}
            {...register('solde_crediteur_depart')}
          />
        </div>
      </div>

      {/* Boutons d'actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-border-subtle">
        <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
          Annuler
        </Button>
        <Button type="submit" variant="primary" isLoading={isSubmitting}>
          Ouvrir la période de gestion
        </Button>
      </div>
    </form>
  );
};
