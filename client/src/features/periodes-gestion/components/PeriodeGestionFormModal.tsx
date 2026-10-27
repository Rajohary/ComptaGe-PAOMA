import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import type { Bureau, PeriodeGestionFormData, Province, ApiError } from '../../../types';
import { Coins, Stamp, FileSpreadsheet } from 'lucide-react';
import { applyServerValidationErrors } from '../../../lib/formErrors';
import { parseNumber } from '../../../lib/formatters';

const basePeriodeGestionSchema = z.object({
  bureau: z.coerce.number().int().positive('Veuillez sélectionner un bureau de poste valide'),
  nom_receveur: z.string().min(2, 'Le nom du receveur doit comporter au moins 2 caractères'),
  date_debut: z.string().min(1, 'La date de début est obligatoire'),
  reserve_numeraire: z
    .string()
    .min(1, 'Le montant de réserve en numéraire est obligatoire')
    .refine(
      (val) => !isNaN(parseNumber(val, NaN)) && parseNumber(val) >= 0,
      'La réserve en numéraire doit être un nombre positif ou nul'
    ),
  valeurs_postales: z
    .string()
    .min(1, 'Le montant des valeurs postales est obligatoire')
    .refine(
      (val) => !isNaN(parseNumber(val, NaN)) && parseNumber(val) >= 0,
      'Le montant des valeurs postales doit être un nombre positif ou nul'
    ),
  timbres_fiscaux: z
    .string()
    .min(1, 'Le montant des timbres fiscaux est obligatoire')
    .refine(
      (val) => !isNaN(parseNumber(val, NaN)) && parseNumber(val) >= 0,
      'Le montant des timbres fiscaux doit être un nombre positif ou nul'
    ),
  solde_debiteur_depart: z
    .string()
    .optional()
    .refine(
      (val) => !val || (!isNaN(parseNumber(val, NaN)) && parseNumber(val) >= 0),
      'Le solde débiteur doit être un nombre positif ou nul'
    ),
  solde_crediteur_depart: z
    .string()
    .optional()
    .refine(
      (val) => !val || (!isNaN(parseNumber(val, NaN)) && parseNumber(val) >= 0),
      'Le solde créditeur doit être un nombre positif ou nul'
    ),
});

const periodeGestionSchema = basePeriodeGestionSchema;

type PeriodeGestionFormInput = z.input<typeof periodeGestionSchema>;
type PeriodeGestionFormOutput = z.output<typeof periodeGestionSchema>;

interface PeriodeGestionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PeriodeGestionFormData) => Promise<void>;
  bureaux: Bureau[];
  provinces?: Province[];
  apiErrors?: ApiError;
}

export const PeriodeGestionFormModal: React.FC<PeriodeGestionFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  bureaux,
  provinces = [],
  apiErrors,
}) => {
  const [selectedProvince, setSelectedProvince] = useState<string>('');

  // Filtrer les bureaux selon la province sélectionnée
  const filteredBureaux = useMemo(() => {
    if (!selectedProvince) return bureaux;
    const provId = Number(selectedProvince);
    return bureaux.filter((b) => b.province === provId || b.province_detail?.id === provId);
  }, [bureaux, selectedProvince]);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PeriodeGestionFormInput, unknown, PeriodeGestionFormOutput>({
    resolver: zodResolver(periodeGestionSchema),
    defaultValues: {
      bureau: bureaux[0]?.id || 1,
      nom_receveur: '',
      date_debut: new Date().toISOString().slice(0, 7) + '-01',
      reserve_numeraire: '0.00',
      valeurs_postales: '0.00',
      timbres_fiscaux: '0.00',
      solde_debiteur_depart: '0.00',
      solde_crediteur_depart: '0.00',
    },
  });

  useEffect(() => {
    if (isOpen) {
      setSelectedProvince('');
      reset({
        bureau: bureaux[0]?.id || 1,
        nom_receveur: '',
        date_debut: new Date().toISOString().slice(0, 7) + '-01',
        reserve_numeraire: '0.00',
        valeurs_postales: '0.00',
        timbres_fiscaux: '0.00',
        solde_debiteur_depart: '0.00',
        solde_crediteur_depart: '0.00',
      });
    }
  }, [isOpen, bureaux, reset]);

  // Si la liste filtrée change et que le bureau actuellement sélectionné n'est plus dedans, sélectionner le premier
  const currentBureau = watch('bureau');
  useEffect(() => {
    if (filteredBureaux.length > 0) {
      const exists = filteredBureaux.some((b) => b.id === Number(currentBureau));
      if (!exists) {
        setValue('bureau', filteredBureaux[0].id);
      }
    }
  }, [filteredBureaux, currentBureau, setValue]);

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
      date_fin: null,
      reserve_numeraire: parseNumber(values.reserve_numeraire).toFixed(2),
      valeurs_postales: parseNumber(values.valeurs_postales).toFixed(2),
      timbres_fiscaux: parseNumber(values.timbres_fiscaux).toFixed(2),
      solde_debiteur_depart: parseNumber(values.solde_debiteur_depart || 0).toFixed(2),
      solde_crediteur_depart: parseNumber(values.solde_crediteur_depart || 0).toFixed(2),
    });
  };

  // Calcul instantané du total de l'inventaire initial
  const watchNumeraire = parseNumber(watch('reserve_numeraire') || 0);
  const watchValeurs = parseNumber(watch('valeurs_postales') || 0);
  const watchTimbres = parseNumber(watch('timbres_fiscaux') || 0);
  const totalInventaireInitial = (isNaN(watchNumeraire) ? 0 : watchNumeraire) +
    (isNaN(watchValeurs) ? 0 : watchValeurs) +
    (isNaN(watchTimbres) ? 0 : watchTimbres);

  // Déduire les provinces des bureaux ou utiliser les provinces passées en props
  const provinceOptions = useMemo(() => {
    const map = new Map<number, string>();
    if (provinces.length > 0) {
      provinces.forEach((p) => map.set(p.id, p.nom));
    } else {
      bureaux.forEach((b) => {
        if (b.province_detail) {
          map.set(b.province_detail.id, b.province_detail.nom);
        } else if (b.province) {
          map.set(b.province, `Province #${b.province}`);
        }
      });
    }

    return [
      { value: '', label: 'Toutes les provinces (sans filtre)' },
      ...Array.from(map.entries())
        .sort((a, b) => a[1].localeCompare(b[1]))
        .map(([id, nom]) => ({
          value: id.toString(),
          label: nom,
        })),
    ];
  }, [provinces, bureaux]);

  const bureauOptions = filteredBureaux.map((b) => ({
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

        {/* Sélection de province pour filtrer les bureaux */}
        <Select
          label="Province (Faritany)"
          id="periode-province-select"
          value={selectedProvince}
          onChange={(e) => setSelectedProvince(e.target.value)}
          options={provinceOptions}
          helperText="Sélectionnez une province pour filtrer la liste des bureaux ci-dessous"
        />

        <Select
          label="Bureau de poste"
          id="periode-bureau-select"
          required
          options={
            bureauOptions.length > 0
              ? bureauOptions
              : [{ value: 0, label: 'Aucun bureau correspondant dans cette province' }]
          }
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

        <div>
          <Input
            label="Date de début"
            required
            type="date"
            error={errors.date_debut?.message}
            {...register('date_debut')}
          />
          <p className="text-[11px] font-sans text-text-secondary mt-1">
            La date de fin sera automatiquement déterminée lors de la clôture officielle de cette période.
          </p>
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
              type="text"
              inputMode="decimal"
              formatThousands
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
              type="text"
              inputMode="decimal"
              formatThousands
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
              type="text"
              inputMode="decimal"
              formatThousands
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
            type="text"
            inputMode="decimal"
            formatThousands
            placeholder="0.00"
            className="tabular-nums font-mono text-right"
            error={errors.solde_debiteur_depart?.message}
            {...register('solde_debiteur_depart')}
          />

          <Input
            label="Solde créditeur de départ"
            type="text"
            inputMode="decimal"
            formatThousands
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
