import React, { useState, useEffect, useCallback } from 'react';
import {
  getBureaux,
  getProvinces,
  createBureau,
  updateBureau,
  deleteBureau,
} from '../../api/referentiel';
import type { Bureau, BureauFormData, Province, ApiError } from '../../types';
import { ApiClientError } from '../../api/client';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { BureauFormModal } from './components/BureauFormModal';
import {
  Building2,
  Plus,
  Search,
  Pencil,
  Trash2,
  AlertCircle,
  RefreshCw,
  Building,
  History,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const BureauxPage: React.FC = () => {
  const navigate = useNavigate();
  const [bureaux, setBureaux] = useState<Bureau[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Recherche avec debounce
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');

  // Modales
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingBureau, setEditingBureau] = useState<Bureau | null>(null);
  const [apiErrors, setApiErrors] = useState<ApiError | undefined>();

  const [deletingBureau, setDeletingBureau] = useState<Bureau | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Gestion du debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadProvinces = useCallback(async () => {
    try {
      const res = await getProvinces();
      setProvinces(res.results || []);
    } catch {
      // Si la route province échoue ou non disponible
      console.warn('Impossible de charger les provinces');
    }
  }, []);

  const loadBureaux = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getBureaux({ search: debouncedSearch });
      setBureaux(res.results || []);
      setTotalCount(res.count || 0);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.data.detail || `Erreur serveur (${err.status})`);
      } else {
        setError('Impossible de joindre le serveur pour charger les bureaux.');
      }
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    loadProvinces();
  }, [loadProvinces]);

  useEffect(() => {
    loadBureaux();
  }, [loadBureaux]);

  const handleOpenCreate = () => {
    setEditingBureau(null);
    setApiErrors(undefined);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (bureau: Bureau) => {
    setEditingBureau(bureau);
    setApiErrors(undefined);
    setIsFormOpen(true);
  };

  const handleSaveBureau = async (formData: BureauFormData) => {
    setApiErrors(undefined);
    try {
      if (editingBureau) {
        await updateBureau(editingBureau.id, formData);
      } else {
        await createBureau(formData);
      }
      setIsFormOpen(false);
      loadBureaux();
    } catch (err) {
      if (err instanceof ApiClientError && err.data) {
        setApiErrors(err.data);
      } else {
        setApiErrors({ detail: 'Une erreur inattendue est survenue.' });
      }
    }
  };

  const handleDeleteBureau = async () => {
    if (!deletingBureau) return;
    setIsDeleting(true);
    try {
      await deleteBureau(deletingBureau.id);
      setDeletingBureau(null);
      loadBureaux();
    } catch (err) {
      if (err instanceof ApiClientError && err.data) {
        alert(err.data.detail || 'Erreur lors de la suppression.');
      } else {
        alert('Impossible de supprimer ce bureau.');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* En-tête contextuel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-subtle pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-sans text-text-secondary uppercase tracking-wider">
            <span>Référentiel</span>
            <span>•</span>
            <span className="text-accent font-semibold">Administration</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-text-primary mt-1">
            Gestion des Bureaux de Poste
          </h1>
          <p className="text-sm font-sans text-text-secondary mt-1">
            Création, modification et consultation des bureaux du réseau postal.
          </p>
        </div>

        <Button
          onClick={handleOpenCreate}
          variant="primary"
          className="self-start sm:self-center"
        >
          <Plus className="w-4 h-4" />
          <span>Nouveau Bureau</span>
        </Button>
      </div>

      {/* Barre d'outils (recherche et actions) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-surface-card p-4 rounded border border-border-subtle shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par nom, codique, classe, CCP..."
            className="w-full pl-9 pr-4 py-2 text-sm font-sans bg-surface-secondary border border-border-subtle rounded text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        <div className="flex items-center gap-3 justify-end text-xs font-sans text-text-secondary">
          <span>{totalCount} bureau(x) au total</span>
          <Button
            variant="secondary"
            size="sm"
            onClick={loadBureaux}
            disabled={loading}
            title="Rafraîchir"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Tableau des bureaux */}
      <div className="bg-surface-card rounded border border-border-subtle overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-text-secondary">
            <RefreshCw className="w-6 h-6 animate-spin text-accent" />
            <p className="text-sm font-sans">Chargement des bureaux de poste...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center space-y-3">
            <div className="inline-flex p-3 rounded-full bg-status-alert/10 text-status-alert">
              <AlertCircle className="w-6 h-6" />
            </div>
            <p className="text-sm font-sans text-text-primary font-semibold">{error}</p>
            <Button variant="secondary" size="sm" onClick={loadBureaux}>
              Réessayer
            </Button>
          </div>
        ) : bureaux.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <div className="inline-flex p-3 rounded-full bg-surface-secondary text-text-secondary">
              <Building className="w-8 h-8" />
            </div>
            <div>
              <p className="text-base font-heading font-semibold text-text-primary">
                {searchTerm ? 'Aucun résultat trouvé' : 'Aucun bureau de poste enregistré'}
              </p>
              <p className="text-sm font-sans text-text-secondary mt-1 max-w-sm mx-auto">
                {searchTerm
                  ? `Aucun bureau ne correspond à votre recherche « ${searchTerm} ».`
                  : "Le référentiel ne contient pas encore de bureau de poste. Vous pouvez en créer un dès maintenant."}
              </p>
            </div>
            {!searchTerm && (
              <Button onClick={handleOpenCreate} variant="primary" size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Créer un premier bureau
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm font-sans border-collapse">
              <thead>
                <tr className="border-b border-border-subtle bg-surface-secondary/50 text-text-secondary uppercase text-xs tracking-wider">
                  <th className="py-3 px-4 font-semibold">N° Codique</th>
                  <th className="py-3 px-4 font-semibold">Nom du bureau</th>
                  <th className="py-3 px-4 font-semibold">Classe</th>
                  <th className="py-3 px-4 font-semibold">Province</th>
                  <th className="py-3 px-4 font-semibold">CCP</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {bureaux.map((bureau) => (
                  <tr
                    key={bureau.id}
                    className="hover:bg-surface-secondary/40 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-medium text-text-primary tabular-nums">
                      {bureau.ncodique}
                    </td>
                    <td className="py-3 px-4 font-semibold text-text-primary">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-text-secondary flex-shrink-0" />
                        <span>{bureau.nom_bureau}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-surface-secondary text-text-primary border border-border-subtle">
                        {bureau.classe}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-text-secondary">
                      {bureau.province_detail?.nom || `Province #${bureau.province}`}
                    </td>
                    <td className="py-3 px-4 font-mono text-text-secondary tabular-nums">
                      {bureau.ccp || '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/historique-periodes?bureau=${bureau.id}`)}
                          className="hover:text-brand"
                          aria-label={`Historique des périodes de ${bureau.nom_bureau}`}
                          title="Historique des périodes et passations"
                        >
                          <History className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(bureau)}
                          aria-label={`Modifier ${bureau.nom_bureau}`}
                          title="Modifier"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeletingBureau(bureau)}
                          className="hover:text-status-alert"
                          aria-label={`Supprimer ${bureau.nom_bureau}`}
                          title="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de création / édition */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingBureau ? `Modifier le bureau : ${editingBureau.nom_bureau}` : 'Créer un nouveau bureau'}
      >
        <BureauFormModal
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSubmit={handleSaveBureau}
          bureauToEdit={editingBureau}
          provinces={provinces}
          apiErrors={apiErrors}
        />
      </Modal>

      {/* Modal de confirmation de suppression */}
      <Modal
        isOpen={!!deletingBureau}
        onClose={() => setDeletingBureau(null)}
        title="Confirmation de suppression"
      >
        <div className="space-y-4">
          <p className="text-sm font-sans text-text-primary">
            Êtes-vous sûr de vouloir supprimer le bureau{' '}
            <strong className="text-status-alert">{deletingBureau?.nom_bureau}</strong> (Codique :{' '}
            {deletingBureau?.ncodique}) ?
          </p>
          <p className="text-xs font-sans text-text-secondary">
            Cette action est irréversible et supprimera le rattachement de ce bureau dans le référentiel.
          </p>

          <div className="flex justify-end gap-3 pt-4 border-t border-border-subtle">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setDeletingBureau(null)}
              disabled={isDeleting}
            >
              Annuler
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={handleDeleteBureau}
              isLoading={isDeleting}
            >
              Supprimer définitivement
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
