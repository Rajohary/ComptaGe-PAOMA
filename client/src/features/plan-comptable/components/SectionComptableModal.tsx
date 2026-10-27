import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { applyServerValidationErrors } from '../../../lib/formErrors';
import type {
  SectionComptable,
  SectionComptableFormData,
  ApiError,
} from '../../../types';
import { AlertCircle, FolderPlus, Save } from 'lucide-react';

const sectionComptableSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, 'Le code de section est obligatoire')
    .max(5, 'Le code ne peut dépasser 5 caractères')
    .transform((val) => val.toUpperCase()),
  libelle: z
    .string()
    .trim()
    .min(3, 'Le libellé doit comporter au moins 3 caractères')
    .max(250, 'Le libellé ne peut dépasser 250 caractères'),
  sens: z.coerce.number().refine((val) => val === 1 || val === 2 || val === 0, {
    message: 'Le sens doit être 1 (Débit) ou 2 (Crédit)',
  }),
  ordre: z.coerce
    .number()
    .int('L’ordre doit être un entier')
    .default(1),
  actif: z.boolean().default(true),
});

type SectionFormInput = z.input<typeof sectionComptableSchema>;
type SectionFormOutput = z.output<typeof sectionComptableSchema>;

interface SectionComptableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SectionComptableFormData) => Promise<void>;
  sectionToEdit?: SectionComptable | null;
  apiErrors?: ApiError | null;
}

export const SectionComptableModal: React.FC<SectionComptableModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  sectionToEdit,
  apiErrors,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SectionFormInput, unknown, SectionFormOutput>({
    resolver: zodResolver(sectionComptableSchema),
    defaultValues: {
      code: '',
      libelle: '',
      sens: 1,
      ordre: 1,
      actif: true,
    },
  });

  useEffect(() => {
    if (sectionToEdit) {
      reset({
        code: sectionToEdit.code,
        libelle: sectionToEdit.libelle,
        sens: sectionToEdit.sens,
        ordre: sectionToEdit.ordre || 1,
        actif: sectionToEdit.actif,
      });
    } else {
      reset({
        code: '',
        libelle: '',
        sens: 1,
        ordre: 1,
        actif: true,
      });
    }
  }, [sectionToEdit, reset, isOpen]);

  // Appliquer les erreurs backend (ex: code déjà existant)
  useEffect(() => {
    if (apiErrors) {
      applyServerValidationErrors(
        apiErrors,
        setError,
        ['code', 'libelle', 'sens', 'ordre', 'actif']
      );
    }
  }, [apiErrors, setError]);

  const handleFormSubmit = async (values: SectionFormOutput) => {
    await onSubmit({
      code: values.code,
      libelle: values.libelle,
      sens: Number(values.sens),
      ordre: Number(values.ordre),
      actif: values.actif,
    });
  };

  const sensOptions = [
    { value: 1, label: 'Débit (Entrées / Recettes)' },
    { value: 2, label: 'Crédit (Sorties / Dépenses)' },
  ];

  const modalTitle = sectionToEdit
    ? `Modifier la Section ${sectionToEdit.code}`
    : 'Ajouter une section macro-comptable';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle}>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        {/* Code et Ordre */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Code de la section"
            type="text"
            placeholder="Ex : F, G"
            {...register('code')}
            error={errors.code?.message}
            disabled={isSubmitting}
          />
          <Input
            label="Ordre d’affichage"
            type="number"
            placeholder="Ex : 6"
            {...register('ordre')}
            error={errors.ordre?.message}
            disabled={isSubmitting}
          />
        </div>

        {/* Libellé */}
        <Input
          label="Libellé de la section"
          type="text"
          placeholder="Ex : Opérations financières exceptionnelles"
          {...register('libelle')}
          error={errors.libelle?.message}
          disabled={isSubmitting}
        />

        {/* Sens comptable normal */}
        <Select
          label="Sens comptable normal"
          options={sensOptions}
          {...register('sens')}
          error={errors.sens?.message}
          disabled={isSubmitting}
        />

        {/* Statut actif */}
        <div className="flex items-center gap-2 pt-1">
          <input
            id="section-actif-checkbox"
            type="checkbox"
            {...register('actif')}
            className="w-4 h-4 rounded text-accent focus:ring-accent border-border-subtle"
            disabled={isSubmitting}
          />
          <label htmlFor="section-actif-checkbox" className="text-xs font-sans text-text-primary">
            Section active
          </label>
        </div>

        {apiErrors?.detail && (
          <div className="p-3 bg-status-alert/10 border border-status-alert/30 rounded-lg text-status-alert text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{apiErrors.detail}</span>
          </div>
        )}

        {/* Boutons d'action */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-subtle">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            className="flex items-center gap-2"
          >
            {sectionToEdit ? <Save className="w-4 h-4" /> : <FolderPlus className="w-4 h-4" />}
            <span>{sectionToEdit ? 'Enregistrer les modifications' : 'Créer la section'}</span>
          </Button>
        </div>
      </form>
    </Modal>
  );
};
