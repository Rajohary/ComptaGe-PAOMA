import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import type { Bureau, BureauFormData, Province, ApiError } from '../../../types';
import { applyServerValidationErrors } from '../../../lib/formErrors';

const bureauSchema = z.object({
  nom_bureau: z.string().min(2, 'Le nom du bureau doit contenir au moins 2 caractères'),
  ncodique: z.coerce.number().int().positive('Le numéro codique doit être un entier positif'),
  province: z.coerce.number().int().positive('Veuillez sélectionner une province valide'),
  classe: z.string().min(1, 'La classe est obligatoire'),
  ccp: z.string().optional(),
  nbur: z.coerce.number().optional(),
  codeclasse: z.coerce.number().optional(),
  ncf: z.coerce.number().optional(),
  cf_codik: z.coerce.number().optional(),
});

type BureauFormInput = z.input<typeof bureauSchema>;
type BureauFormOutput = z.output<typeof bureauSchema>;

interface BureauFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: BureauFormData) => Promise<void>;
  bureauToEdit?: Bureau | null;
  provinces: Province[];
  apiErrors?: ApiError;
}

export const BureauFormModal: React.FC<BureauFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  bureauToEdit,
  provinces,
  apiErrors,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<BureauFormInput, unknown, BureauFormOutput>({
    resolver: zodResolver(bureauSchema),
    defaultValues: {
      nom_bureau: '',
      ncodique: undefined,
      province: provinces[0]?.id || 1,
      classe: 'R1',
      ccp: '',
    },
  });

  useEffect(() => {
    if (bureauToEdit) {
      reset({
        nom_bureau: bureauToEdit.nom_bureau,
        ncodique: bureauToEdit.ncodique,
        province: bureauToEdit.province,
        classe: bureauToEdit.classe,
        ccp: bureauToEdit.ccp || '',
        nbur: bureauToEdit.nbur,
        codeclasse: bureauToEdit.codeclasse,
        ncf: bureauToEdit.ncf,
        cf_codik: bureauToEdit.cf_codik,
      });
    } else {
      reset({
        nom_bureau: '',
        ncodique: undefined,
        province: provinces[0]?.id || 1,
        classe: 'R1',
        ccp: '',
        nbur: undefined,
        codeclasse: undefined,
        ncf: undefined,
        cf_codik: undefined,
      });
    }
  }, [bureauToEdit, provinces, reset, isOpen]);

  // Associer les erreurs de validation renvoyées par le backend aux champs correspondants
  useEffect(() => {
    if (apiErrors) {
      applyServerValidationErrors(
        apiErrors,
        setError,
        Object.keys(bureauSchema.shape) as (keyof BureauFormInput)[]
      );
    }
  }, [apiErrors, setError]);

  const handleFormSubmit = async (values: BureauFormOutput) => {
    await onSubmit({
      nom_bureau: values.nom_bureau,
      ncodique: values.ncodique,
      province: values.province,
      classe: values.classe,
      ccp: values.ccp || '',
      nbur: values.nbur,
      codeclasse: values.codeclasse,
      ncf: values.ncf,
      cf_codik: values.cf_codik,
    });
  };

  const provinceOptions = provinces.map((p) => ({
    value: p.id,
    label: `${p.nprovince} — ${p.nom}`,
  }));

  const classeOptions = [
    { value: 'HC', label: 'Hors Classe (HC)' },
    { value: 'R1', label: 'Recette Principale 1 (R1)' },
    { value: 'R2', label: 'Recette 2 (R2)' },
    { value: 'R3', label: 'Recette 3 (R3)' },
    { value: 'R4', label: 'Recette 4 (R4)' },
    { value: 'D', label: 'Distribution (D)' },
  ];

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} noValidate className="space-y-4">
      {apiErrors?.detail && (
        <div className="p-3 text-sm rounded bg-surface-secondary border border-status-alert text-status-alert">
          {typeof apiErrors.detail === 'string' ? apiErrors.detail : apiErrors.detail[0]}
        </div>
      )}

      <Input
        label="Nom du bureau"
        required
        placeholder="Ex: Antaninarenina"
        error={errors.nom_bureau?.message}
        {...register('nom_bureau')}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="N° Codique"
          required
          type="number"
          placeholder="Ex: 10101"
          error={errors.ncodique?.message}
          {...register('ncodique')}
        />

        <Select
          label="Classe"
          required
          options={classeOptions}
          error={errors.classe?.message}
          {...register('classe')}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Province"
          required
          options={provinceOptions.length > 0 ? provinceOptions : [{ value: 1, label: 'Antananarivo' }]}
          error={errors.province?.message}
          {...register('province')}
        />

        <Input
          label="Numéro de compte CCP"
          placeholder="Ex: 10020"
          error={errors.ccp?.message}
          {...register('ccp')}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-border-subtle">
        <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
          Annuler
        </Button>
        <Button type="submit" variant="primary" isLoading={isSubmitting}>
          {bureauToEdit ? 'Enregistrer les modifications' : 'Créer le bureau'}
        </Button>
      </div>
    </form>
  );
};
