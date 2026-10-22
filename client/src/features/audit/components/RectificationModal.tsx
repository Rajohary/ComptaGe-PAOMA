import React, { useMemo, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { formatAriary, formatDate } from '../../../lib/formatters';
import type { EcartItem, RectificationInput } from '../../../types';
import { Calculator, AlertCircle, ArrowUpRight, ArrowDownRight, Scale } from 'lucide-react';

const rectificationSchema = z
  .object({
    motif: z
      .string()
      .trim()
      .min(3, 'Le motif de rectification est obligatoire (au moins 3 caractères)'),
    augmentation: z
      .string()
      .refine(
        (val) => !val || (!isNaN(Number(val)) && Number(val) >= 0),
        'L’augmentation doit être un nombre positif ou nul'
      ),
    diminution: z
      .string()
      .refine(
        (val) => !val || (!isNaN(Number(val)) && Number(val) >= 0),
        'La diminution doit être un nombre positif ou nul'
      ),
  })
  .refine(
    (data) => {
      const aug = Number(data.augmentation || 0);
      const dim = Number(data.diminution || 0);
      return aug > 0 || dim > 0;
    },
    {
      message: 'Veuillez renseigner au moins une augmentation ou une diminution supérieure à zéro',
      path: ['motif'],
    }
  );

type RectificationFormData = {
  motif: string;
  augmentation: string;
  diminution: string;
};

interface RectificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  ecart: EcartItem | null;
  onSubmit: (data: RectificationInput) => Promise<void>;
  isSubmitting?: boolean;
}

export const RectificationModal: React.FC<RectificationModalProps> = ({
  isOpen,
  onClose,
  ecart,
  onSubmit,
  isSubmitting = false,
}) => {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<RectificationFormData>({
    resolver: zodResolver(rectificationSchema) as any,
    defaultValues: {
      motif: '',
      augmentation: '0',
      diminution: '0',
    },
  });

  // Réinitialiser les champs quand l'écart change
  useEffect(() => {
    if (ecart) {
      reset({
        motif: ecart.motif_rectification || '',
        augmentation: ecart.augmentation && Number(ecart.augmentation) > 0 ? ecart.augmentation : '0',
        diminution: ecart.diminution && Number(ecart.diminution) > 0 ? ecart.diminution : '0',
      });
    }
  }, [ecart, reset]);

  // Surveillance en temps réel pour calcul automatique de montant_rectifie
  const augmentationWatch = useWatch({ control, name: 'augmentation' });
  const diminutionWatch = useWatch({ control, name: 'diminution' });

  const montantInitial = useMemo(() => {
    if (!ecart) return 0;
    return parseFloat(ecart.montant) || 0;
  }, [ecart]);

  const { augmentationNum, diminutionNum, montantRectifieCalcule } = useMemo(() => {
    const aug = parseFloat(augmentationWatch || '0') || 0;
    const dim = parseFloat(diminutionWatch || '0') || 0;
    const rectifie = montantInitial + aug - dim;
    return {
      augmentationNum: aug,
      diminutionNum: dim,
      montantRectifieCalcule: rectifie,
    };
  }, [montantInitial, augmentationWatch, diminutionWatch]);

  const onFormSubmit = async (data: RectificationFormData) => {
    await onSubmit({
      motif: data.motif.trim(),
      augmentation: data.augmentation || '0',
      diminution: data.diminution || '0',
      montant_rectifie: montantRectifieCalcule.toFixed(2),
    });
  };

  if (!ecart) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Rectification d'écriture comptable (Audit UC-04)"
    >
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-5">
        {/* Rappel du contexte de l'écriture */}
        <div className="bg-surface-secondary/40 border border-border-subtle rounded-lg p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs text-text-secondary">
            <span>
              Bureau : <strong className="text-text-primary font-medium">{ecart.bureau.nom_bureau}</strong> ({ecart.bureau.ncodique})
            </span>
            <span>Date : {formatDate(ecart.date_operation)}</span>
          </div>
          <div className="text-xs text-text-secondary">
            Ligne : <strong className="text-text-primary font-mono">{ecart.ligne_comptable.compte}</strong> — {ecart.ligne_comptable.libelle}
          </div>
          <div className="pt-2 border-t border-border-subtle flex items-center justify-between">
            <span className="text-xs text-text-secondary font-medium">Montant déclaré initial :</span>
            <span className="text-sm font-mono font-bold text-text-primary">
              {formatAriary(ecart.montant)}
            </span>
          </div>
        </div>

        {/* Motif obligatoire */}
        <div>
          <label className="block text-xs font-semibold text-text-primary uppercase tracking-wider mb-1.5">
            Motif du redressement <span className="text-status-alert font-bold">*</span>
          </label>
          <textarea
            {...register('motif')}
            rows={2}
            placeholder="Ex : Erreur de saisie guichet constatée lors du pointage contradictoire..."
            className="w-full px-3 py-2 text-sm bg-surface-primary border border-border-subtle rounded-md text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-colors"
          />
          {errors.motif && (
            <p className="mt-1 text-xs text-status-alert flex items-center gap-1 font-medium">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.motif.message}
            </p>
          )}
        </div>

        {/* Champs d'ajustement : Augmentation et Diminution */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1 flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5 text-status-success" />
              Augmentation (MGA)
            </label>
            <Input
              type="number"
              step="any"
              min="0"
              placeholder="0.00"
              {...register('augmentation')}
              error={errors.augmentation?.message}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1 flex items-center gap-1">
              <ArrowDownRight className="w-3.5 h-3.5 text-status-alert" />
              Diminution (MGA)
            </label>
            <Input
              type="number"
              step="any"
              min="0"
              placeholder="0.00"
              {...register('diminution')}
              error={errors.diminution?.message}
            />
          </div>
        </div>

        {/* Bloc interactif d'équation comptable et calcul automatique */}
        <div className="bg-surface-secondary/60 border border-border-subtle rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent">
            <Calculator className="w-4 h-4" />
            <span>Équation de contrôle automatique</span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2 bg-surface-primary rounded border border-border-subtle">
              <div className="text-[11px] text-text-secondary">Montant déclaré</div>
              <div className="font-mono font-medium text-text-primary mt-0.5">
                {formatAriary(montantInitial)}
              </div>
            </div>
            <div className="p-2 bg-surface-primary rounded border border-border-subtle">
              <div className="text-[11px] text-text-secondary">Variation nette</div>
              <div
                className={`font-mono font-medium mt-0.5 ${
                  augmentationNum - diminutionNum >= 0
                    ? 'text-status-success'
                    : 'text-status-alert'
                }`}
              >
                {augmentationNum - diminutionNum >= 0 ? '+' : ''}
                {formatAriary(augmentationNum - diminutionNum)}
              </div>
            </div>
            <div className="p-2 bg-surface-primary rounded border border-border-subtle">
              <div className="text-[11px] text-text-secondary">Montant rectifié</div>
              <div className="font-mono font-bold text-accent mt-0.5">
                {formatAriary(montantRectifieCalcule)}
              </div>
            </div>
          </div>

          {/* Affichage explicite de l'équation */}
          <div className="text-[11px] font-mono text-center text-text-secondary pt-1 flex items-center justify-center gap-1.5 flex-wrap">
            <span>{formatAriary(montantInitial)}</span>
            <span className="text-text-primary font-bold">+</span>
            <span className="text-status-success font-semibold">{formatAriary(augmentationNum)}</span>
            <span className="text-text-primary font-bold">-</span>
            <span className="text-status-alert font-semibold">{formatAriary(diminutionNum)}</span>
            <span className="text-text-primary font-bold">=</span>
            <span className="text-accent font-bold bg-accent/10 px-1.5 py-0.5 rounded">
              {formatAriary(montantRectifieCalcule)}
            </span>
          </div>

          {montantRectifieCalcule < 0 && (
            <div className="text-xs text-status-alert font-medium flex items-center gap-1.5 bg-status-alert/10 p-2 rounded">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>Attention : Le montant rectifié ne peut pas être négatif.</span>
            </div>
          )}
        </div>

        {/* Boutons d'action */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-subtle">
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
            disabled={isSubmitting || montantRectifieCalcule < 0}
            className="flex items-center gap-2"
          >
            <Scale className="w-4 h-4" />
            <span>Valider la rectification</span>
          </Button>
        </div>
      </form>
    </Modal>
  );
};
