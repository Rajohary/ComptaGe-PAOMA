import React, { useState, useEffect, useCallback } from 'react';
import {
  getPeriodesGestion,
  createPeriodeGestion,
  cloturerPeriodeGestion,
  getBureaux,
} from '../../api/referentiel';
import type { PeriodeGestion, PeriodeGestionFormData, Bureau, ApiError } from '../../types';
import { ApiClientError } from '../../api/client';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { PeriodeGestionFormModal } from './components/PeriodeGestionFormModal';
import { ClotureModal } from './components/ClotureModal';
import {
  CalendarDays,
  Plus,
  Search,
  RefreshCw,
  AlertCircle,
  Coins,
  Stamp,
  FileSpreadsheet,
  CheckCircle,
  Clock,
  Lock,
} from 'lucide-react';

export const PeriodesGestionPage: React.FC = () => {
  const [periodes, setPeriodes] = useState<PeriodeGestion[]>([]);
  const [bureaux, setBureaux] = useState<Bureau[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Recherche avec debounce
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');

  // Modale d'ouverture
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [apiErrors, setApiErrors] = useState<ApiError | undefined>();

  // Modale de clôture
  const [periodeToCloture, setPeriodeToCloture] = useState<PeriodeGestion | null>(null);
  const [isCloturing, setIsCloturing] = useState<boolean>(false);
  const [clotureError, setClotureError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadBureaux = useCallback(async () => {
    try {
      const res = await getBureaux();
      setBureaux(res.results || []);
    } catch {
      console.warn('Impossible de charger les bureaux pour le sélecteur');
    }
  }, []);

  const loadPeriodes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getPeriodesGestion({ search: debouncedSearch });
      setPeriodes(res.results || []);
      setTotalCount(res.count || 0);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.data.detail || `Erreur serveur (${err.status})`);
      } else {
        setError('Impossible de joindre le serveur pour charger les périodes.');
      }
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    loadBureaux();
  }, [loadBureaux]);

  useEffect(() => {
    loadPeriodes();
  }, [loadPeriodes]);

  const handleOpenCreate = () => {
    setApiErrors(undefined);
    setIsFormOpen(true);
  };

  const handleSavePeriode = async (formData: PeriodeGestionFormData) => {
    setApiErrors(undefined);
    try {
      await createPeriodeGestion(formData);
      setIsFormOpen(false);
      loadPeriodes();
    } catch (err) {
      if (err instanceof ApiClientError && err.data) {
        setApiErrors(err.data);
      } else {
        setApiErrors({ detail: 'Une erreur inattendue est survenue lors de l’ouverture.' });
      }
    }
  };

  const handleOpenCloture = (periode: PeriodeGestion) => {
    setPeriodeToCloture(periode);
    setClotureError(null);
  };

  const handleConfirmCloture = async () => {
    if (!periodeToCloture) return;
    setIsCloturing(true);
    setClotureError(null);
    try {
      await cloturerPeriodeGestion(periodeToCloture.id);
      setPeriodeToCloture(null);
      loadPeriodes();
    } catch (err) {
      if (err instanceof ApiClientError && err.data) {
        setClotureError(err.data.detail || 'Erreur lors de la clôture de la période.');
      } else {
        setClotureError('Impossible de communiquer avec le serveur pour clôturer la période.');
      }
    } finally {
      setIsCloturing(false);
    }
  };

  const formatMoney = (val: string | number) => {
    const num = Number(val) || 0;
    return `${num.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MGA`;
  };

  return (
    <div className="space-y-6">
      {/* En-tête contextuel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-subtle pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-sans text-text-secondary uppercase tracking-wider">
            <span>Référentiel</span>
            <span>•</span>
            <span className="text-accent font-semibold">Gestion Mensuelle</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-text-primary mt-1">
            Périodes de Gestion (Journal G58)
          </h1>
          <p className="text-sm font-sans text-text-secondary mt-1">
            Ouverture, inventaire initial et clôture officielle des exercices comptables.
          </p>
        </div>

        <Button
          onClick={handleOpenCreate}
          variant="primary"
          className="self-start sm:self-center"
        >
          <Plus className="w-4 h-4" />
          <span>Ouvrir une période</span>
        </Button>
      </div>

      {/* Barre d'outils et recherche */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-surface-card p-4 rounded border border-border-subtle shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par receveur, bureau, codique..."
            className="w-full pl-9 pr-4 py-2 text-sm font-sans bg-surface-secondary border border-border-subtle rounded text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        <div className="flex items-center gap-3 justify-end text-xs font-sans text-text-secondary">
          <span>{totalCount} période(s) au total</span>
          <Button
            variant="secondary"
            size="sm"
            onClick={loadPeriodes}
            disabled={loading}
            title="Rafraîchir"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Tableau des périodes de gestion */}
      <div className="bg-surface-card rounded border border-border-subtle overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-text-secondary">
            <RefreshCw className="w-6 h-6 animate-spin text-accent" />
            <p className="text-sm font-sans">Chargement des périodes de gestion...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center space-y-3">
            <div className="inline-flex p-3 rounded-full bg-status-alert/10 text-status-alert">
              <AlertCircle className="w-6 h-6" />
            </div>
            <p className="text-sm font-sans text-text-primary font-semibold">{error}</p>
            <Button variant="secondary" size="sm" onClick={loadPeriodes}>
              Réessayer
            </Button>
          </div>
        ) : periodes.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <div className="inline-flex p-3 rounded-full bg-surface-secondary text-text-secondary">
              <CalendarDays className="w-8 h-8" />
            </div>
            <div>
              <p className="text-base font-heading font-semibold text-text-primary">
                {searchTerm ? 'Aucune période trouvée' : 'Aucune période de gestion enregistrée'}
              </p>
              <p className="text-sm font-sans text-text-secondary mt-1 max-w-sm mx-auto">
                {searchTerm
                  ? `Aucun enregistrement ne correspond à votre recherche « ${searchTerm} ».`
                  : "Aucune période de gestion n'est ouverte actuellement. Vous pouvez initier une première période."}
              </p>
            </div>
            {!searchTerm && (
              <Button onClick={handleOpenCreate} variant="primary" size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Ouvrir une première période
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm font-sans border-collapse">
              <thead>
                <tr className="border-b border-border-subtle bg-surface-secondary/50 text-text-secondary uppercase text-xs tracking-wider">
                  <th className="py-3 px-4 font-semibold">Bureau</th>
                  <th className="py-3 px-4 font-semibold">Receveur</th>
                  <th className="py-3 px-4 font-semibold">Dates de gestion</th>
                  <th className="py-3 px-4 font-semibold text-right">Numéraire</th>
                  <th className="py-3 px-4 font-semibold text-right">Valeurs postales</th>
                  <th className="py-3 px-4 font-semibold text-right">Timbres fiscaux</th>
                  <th className="py-3 px-4 font-semibold text-center">Statut</th>
                  <th className="py-3 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {periodes.map((p) => (
                  <tr key={p.id} className="hover:bg-surface-secondary/40 transition-colors">
                    <td className="py-3 px-4 font-medium text-text-primary">
                      <div>
                        <span>{p.bureau_detail?.nom_bureau || `Bureau #${p.bureau}`}</span>
                        {p.bureau_detail?.ncodique && (
                          <span className="block text-xs font-mono text-text-secondary">
                            N° {p.bureau_detail.ncodique} • {p.bureau_detail.classe}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-text-primary font-semibold">
                      {p.nom_receveur}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-text-secondary">
                      {p.date_debut} → {p.date_fin}
                    </td>
                    <td className="py-3 px-4 font-mono text-right tabular-nums text-text-primary">
                      <div className="flex items-center justify-end gap-1.5">
                        <Coins className="w-3.5 h-3.5 text-accent opacity-75" />
                        <span>{formatMoney(p.reserve_numeraire)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-right tabular-nums text-text-primary">
                      <div className="flex items-center justify-end gap-1.5">
                        <Stamp className="w-3.5 h-3.5 text-accent opacity-75" />
                        <span>{formatMoney(p.valeurs_postales)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-right tabular-nums text-text-primary">
                      <div className="flex items-center justify-end gap-1.5">
                        <FileSpreadsheet className="w-3.5 h-3.5 text-accent opacity-75" />
                        <span>{formatMoney(p.timbres_fiscaux)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {p.cloturee ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-surface-secondary text-text-secondary border border-border-subtle">
                          <CheckCircle className="w-3 h-3 text-status-success" />
                          <span>Clôturée</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-status-success/10 text-status-success border border-status-success/20">
                          <Clock className="w-3 h-3" />
                          <span>En cours</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {!p.cloturee ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenCloture(p)}
                          className="hover:text-status-alert hover:bg-status-alert/10"
                          title="Clôturer la période"
                        >
                          <Lock className="w-3.5 h-3.5 mr-1" />
                          <span>Clôturer</span>
                        </Button>
                      ) : (
                        <span className="text-xs text-text-secondary font-sans italic">
                          Verrouillée
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal d'ouverture de période de gestion */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title="Ouverture d'une période de gestion (Journal G58)"
      >
        <PeriodeGestionFormModal
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSubmit={handleSavePeriode}
          bureaux={bureaux}
          apiErrors={apiErrors}
        />
      </Modal>

      {/* Modal de clôture officielle */}
      <Modal
        isOpen={!!periodeToCloture}
        onClose={() => setPeriodeToCloture(null)}
        title="Clôture officielle de la période de gestion"
      >
        <ClotureModal
          isOpen={!!periodeToCloture}
          onClose={() => setPeriodeToCloture(null)}
          onConfirm={handleConfirmCloture}
          periode={periodeToCloture}
          isLoading={isCloturing}
          errorMessage={clotureError}
        />
      </Modal>
    </div>
  );
};

