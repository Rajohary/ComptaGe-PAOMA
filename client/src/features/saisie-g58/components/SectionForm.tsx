import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type {
  MouvementG58,
  PeriodeGestion,
  SectionComptable,
  LigneComptable,
  ApiError,
} from '../../../types';
import { createMouvement, updateMouvement, deleteMouvement, getMouvements } from '../../../api/comptabilite';
import { TotauxLive } from './TotauxLive';
import { LigneComptableSearch } from './LigneComptableSearch';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { applyServerValidationErrors } from '../../../lib/formErrors';
import {
  FileText,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Pencil,
  AlertTriangle,
  Lock,
  CheckCircle2,
} from 'lucide-react';


const createMouvementSchema = (periode: PeriodeGestion) =>
  z
    .object({
      periode_gestion: z.coerce.number().int().positive('Période de gestion invalide'),
      ligne_comptable: z.coerce.number().int().positive('Veuillez sélectionner une ligne comptable'),
      date_operation: z.string().min(10, 'La date de l’opération est obligatoire'),
      montant: z
        .string()
        .min(1, 'Le montant est obligatoire')
        .refine(
          (val) => !isNaN(Number(val)) && Number(val) > 0,
          'Le montant doit être un nombre strictement positif'
        ),
    })
    .refine(
      (data) => {
        if (!data.date_operation || !periode.date_debut || !periode.date_fin) return true;
        return data.date_operation >= periode.date_debut && data.date_operation <= periode.date_fin;
      },
      {
        message: `La date d'opération doit être comprise dans la période active (du ${periode.date_debut} au ${periode.date_fin})`,
        path: ['date_operation'],
      }
    );

type MouvementFormInput = z.input<ReturnType<typeof createMouvementSchema>>;
type MouvementFormOutput = z.output<ReturnType<typeof createMouvementSchema>>;


interface SectionFormProps {
  /** Période de gestion en cours de saisie */
  periode: PeriodeGestion;
  /** Section macro-comptable active (A, B, C, D, E) */
  section: SectionComptable;
  /** Bureau code pour l'historique récent */
  bureauCode?: number | null;
  /** Callback optionnel lorsqu'une écriture est modifiée / ajoutée */
  onMouvementChanged?: () => void;
  /** Totaux consolidés optionnels pour la barre TotauxLive */
  totalGeneralDebit?: number;
  totalGeneralCredit?: number;
}

export const SectionForm: React.FC<SectionFormProps> = ({
  periode,
  section,
  bureauCode,
  onMouvementChanged,
  totalGeneralDebit,
  totalGeneralCredit,
}) => {
  // Liste des mouvements enregistrés pour cette période et section
  const [mouvements, setMouvements] = useState<MouvementG58[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Recherche / sélection de ligne comptable
  const [selectedLigne, setSelectedLigne] = useState<LigneComptable | null>(null);
  const [showLigneSearch, setShowLigneSearch] = useState<boolean>(false);

  // Écriture en cours d'édition (si null, mode création)
  const [editingMouvement, setEditingMouvement] = useState<MouvementG58 | null>(null);
  const [deletingMouvement, setDeletingMouvement] = useState<MouvementG58 | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const isPeriodeCloturee = periode.cloturee;

  const schema = useMemo(() => createMouvementSchema(periode), [periode]);

  // Formulaire React Hook Form
  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    setError: setFormError,
    formState: { errors, isSubmitting },
  } = useForm<MouvementFormInput, unknown, MouvementFormOutput>({
    resolver: zodResolver(schema),
    defaultValues: {
      periode_gestion: periode.id,
      ligne_comptable: 0,
      date_operation: new Date().toISOString().slice(0, 10),
      montant: '',
    },
  });


  // Charger les écritures pour cette période et section
  const fetchSectionMouvements = useCallback(async () => {
    if (!periode.id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getMouvements({
        periode_gestion: periode.id,
        section: section.code,
      });
      setMouvements(res.results || []);
    } catch (err: any) {
      console.error('Erreur chargement écritures G58', err);
      setError(err?.detail || 'Impossible de charger les écritures de cette section.');
    } finally {
      setLoading(false);
    }
  }, [periode.id, section.code]);

  useEffect(() => {
    fetchSectionMouvements();
  }, [fetchSectionMouvements]);

  // Réinitialiser le formulaire lors du changement de section ou période
  useEffect(() => {
    setSelectedLigne(null);
    setEditingMouvement(null);
    reset({
      periode_gestion: periode.id,
      ligne_comptable: 0,
      date_operation: new Date().toISOString().slice(0, 10),
      montant: '',
    });
  }, [periode.id, section.code, reset]);

  // Calcul live : somme des écritures enregistrées + montant en cours de saisie
  const watchMontant = watch('montant');
  const currentLiveInput = useMemo(() => {
    const val = Number(watchMontant);
    return isNaN(val) || val < 0 ? 0 : val;
  }, [watchMontant]);

  // Si on édite une ligne, on remplace son ancien montant par le nouveau montant en direct
  const sectionTotalLive = useMemo(() => {
    let base = 0;
    for (const m of mouvements) {
      if (editingMouvement && m.id === editingMouvement.id) {
        continue;
      }
      base += Number(m.montant_rectifie || m.montant || 0);
    }
    return base + currentLiveInput;
  }, [mouvements, editingMouvement, currentLiveInput]);

  // Soumission du formulaire
  const onFormSubmit = async (data: MouvementFormOutput) => {
    try {
      if (editingMouvement) {
        await updateMouvement(editingMouvement.id, {
          montant: Number(data.montant).toFixed(2),
        });
      } else {
        await createMouvement({
          periode_gestion: Number(data.periode_gestion),
          ligne_comptable: Number(data.ligne_comptable),
          date_operation: data.date_operation,
          montant: Number(data.montant).toFixed(2),
        });
      }

      // Réinitialiser l'entrée de saisie rapide
      setValue('montant', '');
      setEditingMouvement(null);
      await fetchSectionMouvements();
      if (onMouvementChanged) onMouvementChanged();
    } catch (err: unknown) {
      const apiError = (err as any)?.data || (err as ApiError);
      applyServerValidationErrors(
        apiError,
        setFormError,
        ['periode_gestion', 'ligne_comptable', 'date_operation', 'montant']
      );
      if (apiError?.detail) {
        setFormError('root', { type: 'server', message: apiError.detail });
      }
    }
  };

  // Sélection d'une ligne comptable
  const handleSelectLigne = (ligne: LigneComptable) => {
    setSelectedLigne(ligne);
    setValue('ligne_comptable', ligne.id, { shouldValidate: true });
    setShowLigneSearch(false);
  };

  // Basculer en mode édition
  const handleStartEdit = (m: MouvementG58) => {
    setEditingMouvement(m);
    if (m.ligne_detail) {
      setSelectedLigne(m.ligne_detail);
    }
    setValue('ligne_comptable', m.ligne_comptable);
    setValue('date_operation', m.date_operation);
    setValue('montant', Number(m.montant).toString());
  };

  const handleCancelEdit = () => {
    setEditingMouvement(null);
    setValue('montant', '');
  };

  // Suppression
  const handleConfirmDelete = async () => {
    if (!deletingMouvement) return;
    setIsDeleting(true);
    try {
      await deleteMouvement(deletingMouvement.id);
      setDeletingMouvement(null);
      await fetchSectionMouvements();
      if (onMouvementChanged) onMouvementChanged();
    } catch (err: any) {
      setError(err?.detail || 'Erreur lors de la suppression de l’écriture.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6" data-testid={`section-form-${section.code}`}>
      {/* Composant TotauxLive : calcul et affichage en temps réel sans soumission */}
      <TotauxLive
        sectionTotalLive={sectionTotalLive}
        sectionCode={section.code}
        sectionLibelle={section.libelle}
        sens={section.sens}
        totalDebit={totalGeneralDebit}
        totalCredit={totalGeneralCredit}
        count={mouvements.length}
      />

      {/* Avertissement de période clôturée */}
      {isPeriodeCloturee && (
        <div
          role="status"
          className="bg-surface-secondary border border-border-subtle rounded-xl p-4 flex items-center gap-3 text-xs sm:text-sm font-sans text-text-secondary"
        >
          <Lock className="w-5 h-5 text-accent shrink-0" />
          <div>
            <strong className="text-text-primary">Période clôturée :</strong> La saisie et la
            modification d’écritures pour la section {section.code} sont verrouillées.
          </div>
        </div>
      )}

      {/* Formulaire de saisie d'écriture */}
      {!isPeriodeCloturee && (
        <div className="bg-surface-card border border-border-subtle rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-border-subtle pb-3">
            <div className="flex items-center gap-2 text-xs font-sans font-semibold text-text-secondary uppercase tracking-wider">
              <FileText className="w-4 h-4 text-brand" />
              <span>
                {editingMouvement
                  ? `Modifier l'écriture #${editingMouvement.id}`
                  : `Nouvelle écriture · Section ${section.code}`}
              </span>
            </div>
            {editingMouvement && (
              <Button type="button" variant="ghost" size="sm" onClick={handleCancelEdit}>
                Annuler modification
              </Button>
            )}
          </div>

          <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4" noValidate>
            {errors.root && (
              <div
                role="alert"
                className="p-3 bg-status-alert/10 border border-status-alert/30 rounded-lg text-xs font-sans text-status-alert flex items-start gap-2"
              >
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errors.root.message}</span>
              </div>
            )}

            {/* Ligne comptable sélectionnée */}

            <div>
              <label className="block text-xs font-sans font-medium text-text-secondary mb-1">
                Ligne comptable (imputation)
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <div
                  className={`flex-1 p-2.5 rounded-lg border text-xs font-sans flex items-center justify-between ${
                    selectedLigne
                      ? 'bg-surface-primary border-border-subtle'
                      : 'bg-surface-secondary/40 border-border-subtle text-text-secondary'
                  }`}
                >
                  {selectedLigne ? (
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-accent bg-accent/15 px-2 py-0.5 rounded">
                        {selectedLigne.compte}
                      </span>
                      <span className="font-medium text-text-primary line-clamp-1">
                        {selectedLigne.libelle}
                      </span>
                    </div>
                  ) : (
                    <span>Aucune ligne comptable sélectionnée</span>
                  )}
                  {selectedLigne && (
                    <CheckCircle2 className="w-4 h-4 text-status-success shrink-0" />
                  )}
                </div>

                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowLigneSearch(!showLigneSearch)}
                  className="flex items-center gap-1.5 shrink-0"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>{selectedLigne ? 'Changer de compte' : 'Rechercher un compte'}</span>
                </Button>
              </div>
              {errors.ligne_comptable && (
                <p className="text-xs font-sans text-status-alert mt-1">
                  {errors.ligne_comptable.message}
                </p>
              )}
            </div>

            {/* Sélecteur LigneComptableSearch escamotable */}
            {showLigneSearch && (
              <div className="p-4 rounded-xl border border-accent/40 bg-surface-secondary/30 space-y-2">
                <div className="flex items-center justify-between text-xs font-sans font-semibold text-text-secondary">
                  <span>Recherche instantanée dans le plan comptable</span>
                  <button
                    type="button"
                    onClick={() => setShowLigneSearch(false)}
                    className="text-text-secondary hover:text-text-primary text-xs"
                  >
                    Masquer ✕
                  </button>
                </div>
                <LigneComptableSearch
                  bureauCode={bureauCode}
                  defaultSection={section.code}
                  onlyLeaf={true}
                  onSelectLigne={handleSelectLigne}
                />
              </div>
            )}

            {/* Champs Date d'opération et Montant */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Date de l'opération"
                id="g58-date-operation"
                type="date"
                min={periode.date_debut}
                max={periode.date_fin}
                error={errors.date_operation?.message}
                {...register('date_operation')}
              />

              <Input
                label="Montant de l'opération (Ariary - MGA)"
                id="g58-montant"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="Ex : 25000.00"
                error={errors.montant?.message}
                {...register('montant')}
              />
            </div>

            {/* Bouton de validation rapide */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting || !selectedLigne}
                className="flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>
                  {isSubmitting
                    ? 'Enregistrement…'
                    : editingMouvement
                    ? 'Mettre à jour l’écriture'
                    : 'Ajouter au Journal'}
                </span>
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* État de chargement */}
      {loading && (
        <div
          data-testid="section-mouvements-loading"
          className="bg-surface-card border border-border-subtle rounded-xl p-10 text-center flex flex-col items-center justify-center space-y-2"
        >
          <RefreshCw className="w-6 h-6 text-brand animate-spin" />
          <p className="text-xs font-sans text-text-secondary">
            Chargement des écritures comptables de la Section {section.code}…
          </p>
        </div>
      )}

      {/* État d'erreur */}
      {error && !loading && (
        <div
          role="alert"
          className="p-4 bg-status-alert/10 border border-status-alert/30 rounded-xl text-xs font-sans text-status-alert flex items-start gap-2.5"
        >
          <AlertTriangle className="w-4 h-4 shrink-0 text-status-alert mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* État vide si aucune écriture */}
      {!loading && !error && mouvements.length === 0 && (
        <div
          data-testid="section-mouvements-empty"
          className="bg-surface-card border border-border-subtle border-dashed rounded-xl p-10 text-center space-y-2"
        >
          <FileText className="w-8 h-8 text-text-secondary/50 mx-auto" />
          <h4 className="text-sm font-heading font-semibold text-text-primary">
            Aucune écriture enregistrée pour la Section {section.code}
          </h4>
          <p className="text-xs font-sans text-text-secondary">
            Utilisez le formulaire ci-dessus pour imputer vos opérations du mois.
          </p>
        </div>
      )}

      {/* Tableau des écritures de la section */}
      {!loading && !error && mouvements.length > 0 && (
        <div className="bg-surface-card border border-border-subtle rounded-xl overflow-hidden shadow-2xs">
          <div className="p-3.5 bg-surface-secondary/40 border-b border-border-subtle flex items-center justify-between">
            <span className="text-xs font-sans font-semibold text-text-secondary uppercase tracking-wider">
              Écritures comptables ({mouvements.length})
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={fetchSectionMouvements}
              title="Rafraîchir"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse" data-testid="table-section-mouvements">
              <thead>
                <tr className="border-b border-border-subtle bg-surface-secondary/20 text-[11px] font-sans font-semibold text-text-secondary uppercase tracking-wider">
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">Compte</th>
                  <th className="py-2.5 px-4">Libellé</th>
                  <th className="py-2.5 px-4 text-right">Montant déclaré</th>
                  <th className="py-2.5 px-4 text-center">Saisi par</th>
                  <th className="py-2.5 px-4 text-center w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle text-xs font-sans">
                {mouvements.map((m) => (
                  <tr
                    key={m.id}
                    className="hover:bg-surface-secondary/30 transition-colors"
                    data-testid={`mouvement-row-${m.id}`}
                  >
                    <td className="py-3 px-4 font-mono text-text-secondary">
                      {m.date_operation}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-accent bg-accent/15 px-1.5 py-0.5 rounded text-[11px]">
                        {m.ligne_detail?.compte || `ID:${m.ligne_comptable}`}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-text-primary font-medium">
                      {m.ligne_detail?.libelle || 'Écriture comptable'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-text-primary">
                      {Number(m.montant).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} Ar
                    </td>
                    <td className="py-3 px-4 text-center text-text-secondary text-[11px]">
                      {m.saisi_par_username}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(m)}
                          disabled={isPeriodeCloturee}
                          className="p-1.5 text-text-secondary hover:text-brand rounded-md hover:bg-surface-secondary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          title="Modifier"
                          aria-label={`Modifier écriture #${m.id}`}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingMouvement(m)}
                          disabled={isPeriodeCloturee}
                          className="p-1.5 text-text-secondary hover:text-status-alert rounded-md hover:bg-surface-secondary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          title="Supprimer"
                          aria-label={`Supprimer écriture #${m.id}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirmation de suppression */}
      {deletingMouvement && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-surface-card border border-border-subtle rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-status-alert">
              <Trash2 className="w-5 h-5" />
              <h3 className="text-base font-heading font-bold text-text-primary">
                Supprimer cette écriture comptable ?
              </h3>
            </div>
            <p className="text-xs sm:text-sm font-sans text-text-secondary">
              Êtes-vous certain de vouloir supprimer l’écriture de{' '}
              <strong>
                {Number(deletingMouvement.montant).toLocaleString('fr-FR')} Ar
              </strong>{' '}
              sur le compte{' '}
              <strong>{deletingMouvement.ligne_detail?.compte || deletingMouvement.ligne_comptable}</strong> ?
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setDeletingMouvement(null)}
                disabled={isDeleting}
              >
                Annuler
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="bg-status-alert hover:bg-status-alert/90"
              >
                {isDeleting ? 'Suppression…' : 'Confirmer'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
