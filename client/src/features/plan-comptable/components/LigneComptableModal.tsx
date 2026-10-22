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
  LigneComptable,
  LigneComptableFormData,
  SectionComptable,
  ApiError,
} from '../../../types';
import { AlertCircle, FilePlus, Save } from 'lucide-react';

const ligneComptableSchema = z.object({
  section: z.coerce.number().int().positive('La section est obligatoire'),
  parent: z.coerce
    .number()
    .optional()
    .nullable()
    .transform((val) => (val && val > 0 ? val : null)),
  menu_sub: z.coerce
    .number()
    .int('Le menu_sub doit être un entier')
    .positive('Le menu_sub doit être positif'),
  compte: z
    .string()
    .trim()
    .min(2, 'Le compte doit comporter au moins 2 caractères')
    .max(20, 'Le compte ne peut dépasser 20 caractères'),
  libelle: z
    .string()
    .trim()
    .min(3, 'Le libellé doit comporter au moins 3 caractères')
    .max(250, 'Le libellé ne peut dépasser 250 caractères'),
  actif: z.boolean().default(true),
});

type LigneComptableFormInput = z.input<typeof ligneComptableSchema>;
type LigneComptableFormOutput = z.output<typeof ligneComptableSchema>;

interface LigneComptableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: LigneComptableFormData) => Promise<void>;
  ligneToEdit?: LigneComptable | null;
  sections: SectionComptable[];
  allLignes: LigneComptable[];
  apiErrors?: ApiError | null;
  defaultSectionId?: number | null;
}

export const LigneComptableModal: React.FC<LigneComptableModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  ligneToEdit,
  sections,
  allLignes,
  apiErrors,
  defaultSectionId,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LigneComptableFormInput, unknown, LigneComptableFormOutput>({
    resolver: zodResolver(ligneComptableSchema),
    defaultValues: {
      section: defaultSectionId || sections[0]?.id || 1,
      parent: null,
      menu_sub: undefined as any,
      compte: '',
      libelle: '',
      actif: true,
    },
  });

  const selectedSection = watch('section');

  // Filtrer les parents éligibles : appartenant à la même section et exclure la ligne en cours d'édition
  const eligibleParents = allLignes.filter((l) => {
    const sameSection = Number(l.section) === Number(selectedSection);
    const notSelf = !ligneToEdit || l.id !== ligneToEdit.id;
    return sameSection && notSelf;
  });

  useEffect(() => {
    if (ligneToEdit) {
      reset({
        section: ligneToEdit.section,
        parent: ligneToEdit.parent,
        menu_sub: ligneToEdit.menu_sub,
        compte: ligneToEdit.compte,
        libelle: ligneToEdit.libelle,
        actif: ligneToEdit.actif,
      });
    } else {
      reset({
        section: defaultSectionId || sections[0]?.id || 1,
        parent: null,
        menu_sub: undefined as any,
        compte: '',
        libelle: '',
        actif: true,
      });
    }
  }, [ligneToEdit, defaultSectionId, sections, reset, isOpen]);

  // Appliquer les erreurs backend (ex: menu_sub déjà pris, parent invalide)
  useEffect(() => {
    if (apiErrors) {
      applyServerValidationErrors(
        apiErrors,
        setError,
        ['section', 'parent', 'menu_sub', 'compte', 'libelle', 'actif']
      );
    }
  }, [apiErrors, setError]);

  const handleFormSubmit = async (values: LigneComptableFormOutput) => {
    await onSubmit({
      section: Number(values.section),
      parent: values.parent ? Number(values.parent) : null,
      menu_sub: Number(values.menu_sub),
      compte: values.compte.trim(),
      libelle: values.libelle.trim(),
      actif: values.actif,
    });
  };

  const sectionOptions = sections.map((s) => ({
    value: s.id,
    label: `Section ${s.code} — ${s.libelle} (${s.sens === 1 ? 'Débit' : 'Crédit'})`,
  }));

  const parentOptions = [
    { value: '', label: 'Aucune (Ligne principale / Chapitre)' },
    ...eligibleParents.map((p) => ({
      value: p.id,
      label: `${p.compte} — ${p.libelle}`,
    })),
  ];

  const modalTitle = ligneToEdit
    ? `Modifier la ligne ${ligneToEdit.compte}`
    : 'Ajouter une ligne au plan comptable';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle}>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        {/* Section macro-comptable */}
        <Select
          label="Section macro-comptable"
          options={sectionOptions}
          {...register('section')}
          error={errors.section?.message}
          disabled={isSubmitting}
        />

        {/* Ligne parente (optionnelle) */}
        <Select
          label="Ligne parente (Sous-section)"
          options={parentOptions}
          {...register('parent')}
          error={errors.parent?.message}
          disabled={isSubmitting}
        />

        {/* Menu sub & Compte */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Identifiant menu_sub"
            type="number"
            placeholder="Ex : 201"
            {...register('menu_sub')}
            error={errors.menu_sub?.message}
            disabled={isSubmitting}
          />
          <Input
            label="Numéro de compte"
            type="text"
            placeholder="Ex : B101, AD02"
            {...register('compte')}
            error={errors.compte?.message}
            disabled={isSubmitting}
          />
        </div>

        {/* Libellé comptable */}
        <Input
          label="Libellé de l’opération"
          type="text"
          placeholder="Ex : Mandats ordinaires émis en numéraire"
          {...register('libelle')}
          error={errors.libelle?.message}
          disabled={isSubmitting}
        />

        {/* Statut actif */}
        <div className="flex items-center gap-2 pt-1">
          <input
            id="ligne-actif-checkbox"
            type="checkbox"
            {...register('actif')}
            className="w-4 h-4 rounded text-accent focus:ring-accent border-border-subtle"
            disabled={isSubmitting}
          />
          <label htmlFor="ligne-actif-checkbox" className="text-xs font-sans text-text-primary">
            Ligne active et directement imputable
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
            {ligneToEdit ? <Save className="w-4 h-4" /> : <FilePlus className="w-4 h-4" />}
            <span>{ligneToEdit ? 'Enregistrer les modifications' : 'Créer la ligne'}</span>
          </Button>
        </div>
      </form>
    </Modal>
  );
};
