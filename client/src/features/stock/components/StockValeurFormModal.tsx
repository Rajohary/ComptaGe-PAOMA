import React, { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import type {
  Bureau,
  PeriodeGestion,
  ProduitPostal,
  StockValeur,
  StockValeurFormData,
  ApiError,
} from '../../../types';
import { Package, Calculator, Info, AlertTriangle } from 'lucide-react';
import { applyServerValidationErrors } from '../../../lib/formErrors';

const baseStockValeurSchema = z.object({
  bureau: z.coerce.number().int().positive('Veuillez sélectionner un bureau valide'),
  periode_gestion: z.coerce.number().int().positive('Veuillez sélectionner une période de gestion'),
  produit: z.coerce.number().int().positive('Veuillez sélectionner un produit postal ou timbre'),
  quantite_initiale: z.coerce
    .number()
    .int('La quantité doit être un nombre entier')
    .min(0, 'La quantité initiale doit être supérieure ou égale à 0'),
  quantite_recue: z.coerce
    .number()
    .int('La quantité doit être un nombre entier')
    .min(0, 'La quantité reçue doit être supérieure ou égale à 0'),
  quantite_vendue: z.coerce
    .number()
    .int('La quantité doit être un nombre entier')
    .min(0, 'La quantité vendue doit être supérieure ou égale à 0'),
});

const stockValeurSchema = baseStockValeurSchema.refine(
  (data) => data.quantite_vendue <= data.quantite_initiale + data.quantite_recue,
  {
    message: 'La quantité vendue ne peut pas dépasser le stock disponible (initiale + reçue)',
    path: ['quantite_vendue'],
  }
);

type StockValeurFormInput = z.input<typeof stockValeurSchema>;
type StockValeurFormOutput = z.output<typeof stockValeurSchema>;

interface StockValeurFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: StockValeurFormData) => Promise<void>;
  bureaux: Bureau[];
  periodes: PeriodeGestion[];
  produits: ProduitPostal[];
  initialData?: StockValeur | null;
  selectedBureauId?: number;
  selectedPeriodeId?: number;
}

export const StockValeurFormModal: React.FC<StockValeurFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  bureaux,
  periodes,
  produits,
  initialData,
  selectedBureauId,
  selectedPeriodeId,
}) => {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<StockValeurFormInput, unknown, StockValeurFormOutput>({
    resolver: zodResolver(stockValeurSchema),
    defaultValues: {
      bureau: selectedBureauId || bureaux[0]?.id || 0,
      periode_gestion: selectedPeriodeId || periodes[0]?.id || 0,
      produit: initialData?.produit || produits[0]?.id || 0,
      quantite_initiale: initialData ? initialData.quantite_initiale : 0,
      quantite_recue: initialData ? initialData.quantite_recue : 0,
      quantite_vendue: initialData ? initialData.quantite_vendue : 0,
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        bureau: initialData.bureau,
        periode_gestion: initialData.periode_gestion,
        produit: initialData.produit,
        quantite_initiale: initialData.quantite_initiale,
        quantite_recue: initialData.quantite_recue,
        quantite_vendue: initialData.quantite_vendue,
      });
    } else {
      reset({
        bureau: selectedBureauId || bureaux[0]?.id || 0,
        periode_gestion: selectedPeriodeId || periodes[0]?.id || 0,
        produit: produits[0]?.id || 0,
        quantite_initiale: 0,
        quantite_recue: 0,
        quantite_vendue: 0,
      });
    }
  }, [initialData, selectedBureauId, selectedPeriodeId, bureaux, periodes, produits, reset]);

  // Surveiller en direct les champs pour les calculs temps réel
  const watchProduitId = watch('produit');
  const watchQteInit = Number(watch('quantite_initiale') || 0);
  const watchQteRecue = Number(watch('quantite_recue') || 0);
  const watchQteVendue = Number(watch('quantite_vendue') || 0);
  const watchPeriodeId = watch('periode_gestion');

  const selectedProduit = useMemo(() => {
    return produits.find((p) => p.id === Number(watchProduitId)) || null;
  }, [produits, watchProduitId]);

  const selectedPeriode = useMemo(() => {
    return periodes.find((p) => p.id === Number(watchPeriodeId)) || null;
  }, [periodes, watchPeriodeId]);

  const valeurFaciale = selectedProduit ? Number(selectedProduit.valeur_faciale) : 0;
  const qteFinaleLive = watchQteInit + watchQteRecue - watchQteVendue;
  const valeurInitialeLive = watchQteInit * valeurFaciale;
  const valeurRecueLive = watchQteRecue * valeurFaciale;
  const valeurVendueLive = watchQteVendue * valeurFaciale;
  const valeurFinaleLive = Math.max(0, qteFinaleLive) * valeurFaciale;

  const isPeriodeCloturee = selectedPeriode?.cloturee ?? false;

  const onFormSubmit = async (data: StockValeurFormOutput) => {
    try {
      await onSubmit({
        bureau: Number(data.bureau),
        periode_gestion: Number(data.periode_gestion),
        produit: Number(data.produit),
        quantite_initiale: Number(data.quantite_initiale),
        quantite_recue: Number(data.quantite_recue),
        quantite_vendue: Number(data.quantite_vendue),
      });
      onClose();
    } catch (err: unknown) {
      applyServerValidationErrors(
        err as ApiError,
        setError,
        Object.keys(baseStockValeurSchema.shape) as (keyof StockValeurFormInput)[]
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-stock-title"
    >
      <div className="bg-surface-card border border-border-subtle rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <form onSubmit={handleSubmit(onFormSubmit)} noValidate>
          {/* Entête */}
          <div className="p-6 border-b border-border-subtle flex items-start justify-between bg-surface-secondary/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center border border-brand/20">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <h2 id="modal-stock-title" className="text-lg font-heading font-bold text-text-primary">
                  {initialData ? 'Modifier l’écriture de stock' : 'Saisir un mouvement de stock'}
                </h2>
                <p className="text-xs font-sans text-text-secondary mt-0.5">
                  Tableau A du Journal G58 · Valeurs postales et timbres fiscaux
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-text-secondary hover:text-text-primary p-1.5 rounded-lg hover:bg-surface-secondary transition-colors"
              aria-label="Fermer la boîte de dialogue"
            >
              ✕
            </button>
          </div>

          <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
            {/* Erreur globale du formulaire */}
            {errors.root && (
              <div
                role="alert"
                className="p-3.5 bg-status-alert/10 border border-status-alert/30 rounded-xl text-xs font-sans font-medium text-status-alert flex items-start gap-2.5"
              >
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-status-alert" />
                <span>{errors.root.message}</span>
              </div>
            )}

            {isPeriodeCloturee && (
              <div
                role="alert"
                className="p-3.5 bg-status-alert/10 border border-status-alert/30 rounded-xl text-xs font-sans text-status-alert flex items-start gap-2.5"
              >
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-status-alert" />
                <span>
                  <strong>Attention :</strong> Cette période de gestion est clôturée. Toute saisie ou modification est verrouillée.
                </span>
              </div>
            )}

            {/* Sélections bureau et période */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Bureau de poste"
                id="stock-bureau"
                options={bureaux.map((b) => ({
                  value: b.id.toString(),
                  label: `${b.ncodique} - ${b.nom_bureau}`,
                }))}
                error={errors.bureau?.message}
                {...register('bureau')}
                disabled={Boolean(initialData)}
              />

              <Select
                label="Période de gestion"
                id="stock-periode"
                options={periodes.map((p) => ({
                  value: p.id.toString(),
                  label: `${p.date_debut} au ${p.date_fin} (${p.cloturee ? 'Clôturée' : 'En cours'})`,
                }))}
                error={errors.periode_gestion?.message}
                {...register('periode_gestion')}
                disabled={Boolean(initialData)}
              />
            </div>

            {/* Produit postal */}
            <div>
              <Select
                label="Produit postal / Timbre fiscal"
                id="stock-produit"
                options={produits.map((p) => ({
                  value: p.id.toString(),
                  label: `[${p.categorie}] ${p.nom} — ${Number(p.valeur_faciale).toLocaleString('fr-FR')} Ar`,
                }))}
                error={errors.produit?.message}
                {...register('produit')}
                disabled={Boolean(initialData)}
              />
              {selectedProduit && (
                <div className="mt-2 text-xs font-sans text-text-secondary flex items-center justify-between px-1">
                  <span>Catégorie : <strong>{selectedProduit.categorie_libelle}</strong></span>
                  <span>Valeur faciale unitaire : <strong className="text-text-primary font-mono">{Number(selectedProduit.valeur_faciale).toLocaleString('fr-FR')} Ar</strong></span>
                </div>
              )}
            </div>

            {/* Saisie des quantités */}
            <div className="bg-surface-secondary/40 p-4 rounded-xl border border-border-subtle space-y-4">
              <h3 className="text-xs font-sans font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5 text-brand" />
                Mouvements physiques (Quantités)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Quantité initiale (report)"
                  id="stock-qte-init"
                  type="number"
                  min="0"
                  error={errors.quantite_initiale?.message}
                  {...register('quantite_initiale')}
                />

                <Input
                  label="Quantité reçue (appro.)"
                  id="stock-qte-recue"
                  type="number"
                  min="0"
                  error={errors.quantite_recue?.message}
                  {...register('quantite_recue')}
                />

                <Input
                  label="Quantité vendue (sorties)"
                  id="stock-qte-vendue"
                  type="number"
                  min="0"
                  error={errors.quantite_vendue?.message}
                  {...register('quantite_vendue')}
                />
              </div>

              {/* Quantité restante calculée */}
              <div className="flex items-center justify-between text-xs font-sans pt-2 border-t border-border-subtle/80">
                <span className="text-text-secondary">Quantité finale en caisse (calculée) :</span>
                <span className={`font-mono font-bold text-sm ${qteFinaleLive < 0 ? 'text-status-alert' : 'text-text-primary'}`}>
                  {qteFinaleLive} unités
                </span>
              </div>
            </div>

            {/* Synthèse financière calculée en direct */}
            <div data-testid="modal-finance-live" className="p-4 rounded-xl border border-brand/20 bg-brand/5 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-sans font-semibold text-brand">
                <span>Calcul automatique des valeurs financières (MGA)</span>
                <Info className="w-4 h-4" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                <div className="bg-surface-card p-2.5 rounded-lg border border-border-subtle text-left">
                  <div className="text-[10px] font-sans text-text-secondary">Valeur initiale</div>
                  <div data-testid="live-val-initiale" className="font-mono text-xs font-bold text-text-primary mt-0.5">
                    {valeurInitialeLive.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} Ar
                  </div>
                </div>
                <div className="bg-surface-card p-2.5 rounded-lg border border-border-subtle text-left">
                  <div className="text-[10px] font-sans text-text-secondary">Valeur reçue</div>
                  <div data-testid="live-val-recue" className="font-mono text-xs font-bold text-text-primary mt-0.5">
                    {valeurRecueLive.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} Ar
                  </div>
                </div>
                <div className="bg-surface-card p-2.5 rounded-lg border border-border-subtle text-left">
                  <div className="text-[10px] font-sans text-status-alert">Valeur vendue</div>
                  <div data-testid="live-val-vendue" className="font-mono text-xs font-bold text-status-alert mt-0.5">
                    {valeurVendueLive.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} Ar
                  </div>
                </div>
                <div className="bg-surface-card p-2.5 rounded-lg border border-brand/30 text-left bg-brand/5">
                  <div className="text-[10px] font-sans text-brand font-medium">Solde final</div>
                  <div data-testid="live-val-finale" className="font-mono text-xs font-bold text-brand mt-0.5">
                    {valeurFinaleLive.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} Ar
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Pied de modal */}
          <div className="p-4 sm:p-6 border-t border-border-subtle flex items-center justify-end gap-3 bg-surface-secondary/40">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
              Annuler
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting || isPeriodeCloturee}
            >
              {isSubmitting
                ? 'Enregistrement…'
                : initialData
                ? 'Mettre à jour l’écriture'
                : 'Enregistrer l’écriture'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
