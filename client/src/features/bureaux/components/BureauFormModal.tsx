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
  province: z.coerce.number().int().positive('Veuillez sélectionner une province valide'),
  faritany: z.string().optional(),
  code_postal: z.string().min(1, 'Le code postal est obligatoire'),
  nom_bureau: z.string().min(2, 'Le nom du bureau doit contenir au moins 2 caractères'),
  classe: z.string().min(1, 'La classe est obligatoire'),
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
      province: provinces[0]?.id || 1,
      faritany: '',
      code_postal: '',
      nom_bureau: '',
      classe: 'R1',
    },
  });

  useEffect(() => {
    if (bureauToEdit) {
      reset({
        province: typeof bureauToEdit.province === 'number'
          ? bureauToEdit.province
          : (bureauToEdit.province_detail?.id || provinces[0]?.id || 1),
        faritany: typeof bureauToEdit.faritany === 'string'
          ? bureauToEdit.faritany
          : '',
        code_postal: bureauToEdit.code_postal || (bureauToEdit.ncodique ? String(bureauToEdit.ncodique) : ''),
        nom_bureau: bureauToEdit.nom_bureau,
        classe: bureauToEdit.classe,
      });
    } else {
      reset({
        province: provinces[0]?.id || 1,
        faritany: '',
        code_postal: '',
        nom_bureau: '',
        classe: 'R1',
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
      province: values.province,
      faritany: values.faritany || '',
      code_postal: values.code_postal,
      nom_bureau: values.nom_bureau,
      classe: values.classe,
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

      {/* 1. Province (Select option alimenté par le serveur) */}
      <Select
        label="Province"
        required
        options={provinceOptions.length > 0 ? provinceOptions : [{ value: 1, label: '1 — Antananarivo' }]}
        error={errors.province?.message}
        {...register('province')}
      />

      {/* 2. Faritany (Input texte) */}
      <Input
        label="Faritany"
        placeholder="Ex: Antananarivo ou Faritany"
        error={errors.faritany?.message}
        {...register('faritany')}
      />

      {/* 3. Code Postal */}
      <Input
        label="Code Postal"
        required
        placeholder="Ex: 101 ou 10101"
        error={errors.code_postal?.message}
        {...register('code_postal')}
      />

      {/* 4. Nom bureau */}
      <Input
        label="Nom du bureau"
        required
        placeholder="Ex: Antaninarenina"
        error={errors.nom_bureau?.message}
        {...register('nom_bureau')}
      />

      {/* 5. Classe */}
      <Select
        label="Classe"
        required
        options={classeOptions}
        error={errors.classe?.message}
        {...register('classe')}
      />

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
