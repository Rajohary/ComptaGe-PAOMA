import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getBureaux, getHistoriquePeriodesBureau } from '../../api/referentiel';
import { downloadBordereauG58Pdf, exportEcrituresExcel } from '../../api/comptabilite';
import type { Bureau, HistoriquePassationResponse, HistoriquePeriodeItem } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { ApiClientError } from '../../api/client';
import { triggerBlobDownload } from '../../lib/download';
import { Button } from '../../components/ui/Button';
import { Pagination } from '../../components/ui/Pagination';
import {
  History,
  Building2,
  ArrowRight,
  Download,
  FileSpreadsheet,
  RefreshCw,
  Search,
  AlertCircle,
  Clock,
  CheckCircle,
  FileText,
  ChevronRight,
  Landmark,
} from 'lucide-react';

export const HistoriquePeriodesPage: React.FC = () => {
  const { user, role } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [bureaux, setBureaux] = useState<Bureau[]>([]);
  const [loadingBureaux, setLoadingBureaux] = useState<boolean>(true);

  // Bureau sélectionné
  const initialBureauParam = searchParams.get('bureau') || '';
  const [selectedBureauId, setSelectedBureauId] = useState<string>(initialBureauParam);

  // Données de l'historique
  const [data, setData] = useState<HistoriquePassationResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Recherche textuelle pour filtrer les périodes (receveur, date, id)
  const [filterText, setFilterText] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const pageSize = 10;

  // Téléchargement / Export
  const [downloadingPdfId, setDownloadingPdfId] = useState<number | null>(null);
  const [exportingExcelId, setExportingExcelId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // 1. Charger les bureaux disponibles
  const loadBureauxList = useCallback(async () => {
    setLoadingBureaux(true);
    try {
      const res = await getBureaux();
      const list = res.results || [];
      setBureaux(list);

      // Si aucun bureau sélectionné dans l'URL :
      if (!selectedBureauId) {
        if (user?.bureau_code) {
          // Si receveur ou agent associé à un code bureau
          const matchingBureau = list.find(
            (b) => b.ncodique === user.bureau_code || b.id === user.bureau_code
          );
          if (matchingBureau) {
            setSelectedBureauId(String(matchingBureau.id));
            setSearchParams({ bureau: String(matchingBureau.id) });
          } else if (list.length > 0) {
            setSelectedBureauId(String(list[0].id));
            setSearchParams({ bureau: String(list[0].id) });
          }
        } else if (list.length > 0) {
          setSelectedBureauId(String(list[0].id));
          setSearchParams({ bureau: String(list[0].id) });
        }
      }
    } catch (err) {
      console.error('Erreur chargement liste bureaux', err);
    } finally {
      setLoadingBureaux(false);
    }
  }, [selectedBureauId, user, setSearchParams]);

  useEffect(() => {
    loadBureauxList();
  }, [loadBureauxList]);

  // 2. Charger l'historique pour le bureau sélectionné
  const loadHistorique = useCallback(async (bureauIdOrCode: string) => {
    if (!bureauIdOrCode) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getHistoriquePeriodesBureau(bureauIdOrCode);
      setData(res);
    } catch (err: any) {
      console.error('Erreur chargement historique passations', err);
      if (err instanceof ApiClientError) {
        setError(err.data.detail || `Erreur serveur (${err.status})`);
      } else {
        setError("Impossible de charger l'historique des périodes de ce bureau.");
      }
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedBureauId) {
      loadHistorique(selectedBureauId);
    }
  }, [selectedBureauId, loadHistorique]);

  const handleBureauChange = (newId: string) => {
    setSelectedBureauId(newId);
    setSearchParams(newId ? { bureau: newId } : {});
  };

  // Actions d'export
  const handleDownloadPdf = async (periode: HistoriquePeriodeItem) => {
    if (!data) return;
    setDownloadingPdfId(periode.id);
    setActionError(null);
    try {
      const blob = await downloadBordereauG58Pdf(periode.id);
      const filename = `Bordereau_G58_${data.bureau.ncodique}_${periode.date_debut}.pdf`;
      triggerBlobDownload(blob, filename);
    } catch (err: any) {
      console.error('Erreur téléchargement PDF période', err);
      setActionError(
        err?.detail ||
          'Erreur lors du téléchargement du bordereau G58. Veuillez vérifier vos autorisations.'
      );
      setTimeout(() => setActionError(null), 6000);
    } finally {
      setDownloadingPdfId(null);
    }
  };

  const handleExportExcel = async (periode: HistoriquePeriodeItem) => {
    if (!data) return;
    setExportingExcelId(periode.id);
    setActionError(null);
    try {
      const blob = await exportEcrituresExcel(periode.id);
      const filename = `Journal_G58_${data.bureau.ncodique}_${periode.date_debut}.xlsx`;
      triggerBlobDownload(blob, filename);
    } catch (err: any) {
      console.error('Erreur export Excel période', err);
      setActionError(
        err?.detail ||
          'Erreur lors de l’export Excel des écritures G58. Veuillez vérifier vos autorisations.'
      );
      setTimeout(() => setActionError(null), 6000);
    } finally {
      setExportingExcelId(null);
    }
  };

  // Filtrage local des périodes
  const filteredHistorique = useMemo(() => {
    if (!data?.historique) return [];
    if (!filterText.trim()) return data.historique;
    const q = filterText.toLowerCase().trim();
    return data.historique.filter(
      (p) =>
        p.nom_receveur.toLowerCase().includes(q) ||
        p.date_debut.includes(q) ||
        (p.date_fin && p.date_fin.includes(q)) ||
        p.id.toString().includes(q)
    );
  }, [data, filterText]);

  // Réinitialiser la pagination lors du changement de filtre ou de bureau
  useEffect(() => {
    setPage(1);
  }, [selectedBureauId, filterText]);

  // Découpage paginé de l'historique
  const paginatedHistorique = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredHistorique.slice(start, start + pageSize);
  }, [filteredHistorique, page, pageSize]);

  const isReceveurRestricted = (role === 'RECEVEUR' || role === 'AGENT_SAISIE') && !!user?.bureau_code;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6" data-testid="historique-periodes-page">
      {/* En-tête contextuel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-subtle pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-brand/10 text-brand">
              <History className="w-5 h-5" />
            </span>
            <h1 className="text-xl md:text-2xl font-heading font-bold text-text-primary tracking-tight">
              Historique des Périodes de Gestion & Passations
            </h1>
          </div>
          <p className="text-xs md:text-sm font-sans text-text-secondary">
            Traçabilité chronologique des receveurs successifs, des soldes d'ouverture et de clôture du bureau de poste.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="secondary"
            onClick={() => selectedBureauId && loadHistorique(selectedBureauId)}
            disabled={loading}
            className="flex items-center gap-1.5"
            data-testid="refresh-historique-btn"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate('/periodes-gestion')}
            className="flex items-center gap-1.5 text-text-secondary hover:text-text-primary"
          >
            <span>Toutes les périodes</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Barre de sélection du bureau et recherche */}
      <div className="bg-surface-card border border-border-subtle rounded-xl p-4 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          {/* Sélecteur de bureau */}
          <div>
            <label
              htmlFor="select-bureau-historique"
              className="block text-xs font-sans font-medium text-text-secondary mb-1.5"
            >
              Bureau de poste
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-text-secondary absolute left-3 top-3 pointer-events-none" />
              <select
                id="select-bureau-historique"
                value={selectedBureauId}
                onChange={(e) => handleBureauChange(e.target.value)}
                disabled={loadingBureaux || isReceveurRestricted}
                className="w-full pl-9 pr-4 py-2 text-sm font-sans bg-surface-secondary/70 dark:bg-surface-secondary border border-border-subtle rounded-lg text-text-primary focus:outline-hidden focus:ring-2 focus:ring-accent disabled:opacity-60 disabled:cursor-not-allowed"
                data-testid="select-bureau-historique"
              >
                {bureaux.map((b) => (
                  <option key={b.id} value={b.id} className="bg-surface-card dark:bg-surface-secondary text-text-primary">
                    {b.ncodique} — {b.nom_bureau} ({b.classe})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Recherche dans l'historique */}
          <div>
            <label
              htmlFor="filter-search-historique"
              className="block text-xs font-sans font-medium text-text-secondary mb-1.5"
            >
              Rechercher une passation ou un receveur
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-text-secondary absolute left-3 top-3 pointer-events-none" />
              <input
                id="filter-search-historique"
                type="text"
                placeholder="Nom du receveur, date (AAAA-MM)..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm font-sans bg-surface-secondary/50 dark:bg-surface-secondary border border-border-subtle rounded-lg text-text-primary placeholder:text-text-secondary/60 focus:outline-hidden focus:ring-2 focus:ring-accent"
                data-testid="search-historique-input"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Message d'erreur d'action */}
      {actionError && (
        <div className="p-3 bg-status-alert/10 border border-status-alert/30 rounded-xl text-xs text-status-alert flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-status-alert mt-0.5" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Message d'erreur de chargement */}
      {error && (
        <div className="p-4 bg-status-alert/10 border border-status-alert/30 rounded-xl text-sm text-status-alert flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-status-alert mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold">Erreur de chargement de l'historique</span>
            <p className="text-xs">{error}</p>
          </div>
        </div>
      )}

      {/* En-tête des métriques du bureau si data chargée */}
      {data && (
        <div className="space-y-4">
          <div className="bg-surface-card border border-border-subtle rounded-xl p-5 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border-subtle pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-brand/10 text-brand flex items-center justify-center font-bold">
                  <Landmark className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-heading font-bold text-text-primary">
                      {data.bureau.nom_bureau}
                    </h2>
                    <span className="font-mono text-xs bg-brand/15 text-brand px-2 py-0.5 rounded font-bold">
                      Code {data.bureau.ncodique}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-surface-secondary text-text-secondary border border-border-subtle">
                      Classe {data.bureau.classe}
                    </span>
                  </div>
                  <p className="text-xs font-sans text-text-secondary mt-0.5">
                    Province : <strong className="text-text-primary">{data.bureau.province || 'Non définie'}</strong>
                    {data.bureau.ccp && (
                      <> • CCP : <span className="font-mono">{data.bureau.ccp}</span></>
                    )}
                  </p>
                </div>
              </div>

              {/* Statuts résumé */}
              <div className="flex items-center gap-4 text-xs">
                <div className="text-right">
                  <span className="text-text-secondary block">Total périodes</span>
                  <span className="font-bold text-text-primary text-base font-mono">
                    {data.total_periodes}
                  </span>
                </div>
                <div className="w-px h-8 bg-border-subtle" />
                <div className="text-right">
                  <span className="text-text-secondary block">Clôturées</span>
                  <span className="font-bold text-status-success text-base font-mono">
                    {data.periodes_cloturees}
                  </span>
                </div>
                <div className="w-px h-8 bg-border-subtle" />
                <div className="text-right">
                  <span className="text-text-secondary block">Période active</span>
                  <span className={`font-bold text-base font-mono ${data.periode_en_cours ? 'text-brand' : 'text-text-secondary'}`}>
                    {data.periode_en_cours ? 'Oui' : 'Aucune'}
                  </span>
                </div>
              </div>
            </div>

            {/* Période en cours active */}
            {data.periode_en_cours ? (
              <div className="p-3.5 bg-brand/5 border border-brand/20 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-brand shrink-0" />
                  <div>
                    <span className="font-medium text-text-primary">
                      Gestion actuelle en cours :{' '}
                      <strong className="text-brand font-semibold">{data.periode_en_cours.nom_receveur}</strong>
                    </span>
                    <span className="text-text-secondary block text-[11px]">
                      Prise de fonction le {data.periode_en_cours.date_debut} • Encaisse initiale déclarée :{' '}
                      <strong className="font-mono text-text-primary">
                        {Number(data.periode_en_cours.total_encaisse_depart).toLocaleString('fr-FR', {
                          minimumFractionDigits: 2,
                        })}{' '}
                        Ar
                      </strong>
                    </span>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-brand/10 text-brand">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
                  Période en cours
                </span>
              </div>
            ) : (
              <div className="p-3 bg-surface-secondary/40 border border-border-subtle rounded-lg text-xs text-text-secondary flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-text-secondary" />
                <span>Toutes les périodes de ce bureau sont actuellement clôturées.</span>
              </div>
            )}
          </div>

          {/* Timeline & Tableau des passations de gestion */}
          <div className="bg-surface-card border border-border-subtle rounded-xl shadow-2xs overflow-hidden">
            <div className="px-5 py-4 border-b border-border-subtle flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-brand" />
                <h3 className="text-sm font-heading font-bold text-text-primary uppercase tracking-wider">
                  Chronologie des Passations de Service & Soldes
                </h3>
              </div>
              <span className="text-xs font-sans text-text-secondary">
                {filteredHistorique.length} sur {data.total_periodes} période(s)
              </span>
            </div>

            {loading ? (
              <div className="p-12 text-center text-text-secondary space-y-3">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-brand" />
                <p className="text-xs">Chargement de la chronologie du bureau...</p>
              </div>
            ) : filteredHistorique.length === 0 ? (
              <div className="p-12 text-center text-text-secondary space-y-2">
                <FileText className="w-8 h-8 mx-auto text-text-secondary/40" />
                <p className="text-sm font-medium text-text-primary">Aucune période de gestion trouvée</p>
                <p className="text-xs">
                  {filterText
                    ? 'Aucun résultat ne correspond à votre filtre de recherche.'
                    : "Ce bureau ne dispose pas encore d'historique de périodes de gestion."}
                </p>
              </div>
            ) : (
              <div>
                <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-sans border-collapse">
                  <thead>
                    <tr className="border-b border-border-subtle bg-surface-secondary/40 text-text-secondary font-semibold">
                      <th className="py-3 px-4">Période & Statut</th>
                      <th className="py-3 px-4">Receveur en charge</th>
                      <th className="py-3 px-4 text-right">Inventaire Départ (Ar)</th>
                      <th className="py-3 px-4 text-right">Solde Débiteur Début</th>
                      <th className="py-3 px-4 text-right">Mouvements & Flux</th>
                      <th className="py-3 px-4 text-right">Solde Clôture (Passation)</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {paginatedHistorique.map((p) => {
                      const isEnCours = !p.cloturee;
                      const debitNum = Number(p.total_debit);
                      const creditNum = Number(p.total_credit);
                      const soldeDebFin = Number(p.solde_debiteur_fin);
                      const soldeCredFin = Number(p.solde_crediteur_fin);

                      return (
                        <tr
                          key={p.id}
                          data-testid={`historique-row-${p.id}`}
                          className={`transition-colors hover:bg-surface-secondary/20 ${
                            isEnCours ? 'bg-brand/5' : ''
                          }`}
                        >
                          {/* Période & Statut */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-bold text-text-primary">
                                  #{p.id}
                                </span>
                                {isEnCours ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand/10 text-brand">
                                    <Clock className="w-2.5 h-2.5" />
                                    En cours
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-status-success/10 text-status-success">
                                    <CheckCircle className="w-2.5 h-2.5" />
                                    Clôturée
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] font-mono text-text-secondary flex items-center gap-1">
                                <span>{p.date_debut}</span>
                                <ArrowRight className="w-3 h-3 text-text-secondary/60" />
                                <span>{p.date_fin || 'En cours'}</span>
                              </div>
                            </div>
                          </td>

                          {/* Receveur */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-surface-secondary flex items-center justify-center font-bold text-text-primary text-[11px] shrink-0 border border-border-subtle">
                                {p.nom_receveur ? p.nom_receveur.slice(0, 2).toUpperCase() : 'RC'}
                              </div>
                              <div>
                                <span className="font-medium text-text-primary block truncate max-w-[200px]" title={p.nom_receveur}>
                                  {p.nom_receveur}
                                </span>
                                <span className="text-[10px] text-text-secondary block">
                                  {p.date_cloture ? `Clôturé le ${p.date_cloture.slice(0, 10)}` : 'Passation active'}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Inventaire de départ */}
                          <td className="py-3 px-4 text-right whitespace-nowrap font-mono">
                            <span className="font-bold text-text-primary block">
                              {Number(p.total_encaisse_depart).toLocaleString('fr-FR', {
                                minimumFractionDigits: 2,
                              })}{' '}
                              Ar
                            </span>
                            <span className="text-[10px] text-text-secondary block" title="Numéraire / Valeurs / Timbres">
                              Num: {Number(p.reserve_numeraire).toLocaleString('fr-FR')} • Val: {Number(p.valeurs_postales).toLocaleString('fr-FR')}
                            </span>
                          </td>

                          {/* Solde Débiteur Début */}
                          <td className="py-3 px-4 text-right whitespace-nowrap font-mono">
                            {Number(p.solde_debiteur_depart) > 0 ? (
                              <span className="text-text-primary font-medium">
                                {Number(p.solde_debiteur_depart).toLocaleString('fr-FR', {
                                  minimumFractionDigits: 2,
                                })}{' '}
                                Ar
                              </span>
                            ) : Number(p.solde_crediteur_depart) > 0 ? (
                              <span className="text-status-alert font-medium">
                                -{Number(p.solde_crediteur_depart).toLocaleString('fr-FR', {
                                  minimumFractionDigits: 2,
                                })}{' '}
                                Ar (Créd.)
                              </span>
                            ) : (
                              <span className="text-text-secondary">0,00 Ar</span>
                            )}
                          </td>

                          {/* Mouvements & Flux */}
                          <td className="py-3 px-4 text-right whitespace-nowrap font-mono">
                            <span className="text-[11px] font-semibold text-text-secondary bg-surface-secondary dark:bg-surface-card px-2 py-0.5 rounded border border-border-subtle/50">
                              {p.nb_mouvements} écriture(s)
                            </span>
                            <div className="text-[10px] pt-1 text-text-secondary">
                              <span className="text-status-success">+{debitNum.toLocaleString('fr-FR')}</span>
                              {' / '}
                              <span className="text-status-alert">-{creditNum.toLocaleString('fr-FR')}</span>
                            </div>
                          </td>

                          {/* Solde Clôture (Passation suivante) */}
                          <td className="py-3 px-4 text-right whitespace-nowrap font-mono">
                            {soldeDebFin > 0 ? (
                              <div>
                                <span className="font-bold text-brand block">
                                  {soldeDebFin.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} Ar
                                </span>
                                <span className="text-[10px] text-text-secondary">Débiteur (final)</span>
                              </div>
                            ) : soldeCredFin > 0 ? (
                              <div>
                                <span className="font-bold text-status-alert block">
                                  {soldeCredFin.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} Ar
                                </span>
                                <span className="text-[10px] text-status-alert">Créditeur (final)</span>
                              </div>
                            ) : (
                              <span className="text-text-secondary font-medium">0,00 Ar</span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownloadPdf(p)}
                                disabled={downloadingPdfId === p.id}
                                className="text-brand hover:text-brand hover:bg-brand/10 p-1.5"
                                title="Télécharger le bordereau G58 PDF officiel"
                                data-testid={`download-pdf-btn-${p.id}`}
                              >
                                <Download
                                  className={`w-3.5 h-3.5 ${
                                    downloadingPdfId === p.id ? 'animate-bounce' : ''
                                  }`}
                                />
                              </Button>

                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleExportExcel(p)}
                                disabled={exportingExcelId === p.id}
                                className="text-status-success hover:text-status-success hover:bg-status-success/10 p-1.5"
                                title="Exporter les écritures au format Excel (.xlsx)"
                                data-testid={`export-excel-btn-${p.id}`}
                              >
                                <FileSpreadsheet
                                  className={`w-3.5 h-3.5 ${
                                    exportingExcelId === p.id ? 'animate-pulse' : ''
                                  }`}
                                />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination des périodes de l'historique */}
              {filteredHistorique.length > 0 && (
                <Pagination
                  currentPage={page}
                  totalCount={filteredHistorique.length}
                  pageSize={pageSize}
                  onPageChange={(newPage) => setPage(newPage)}
                  isLoading={loading}
                  itemLabel="période archivée"
                />
              )}
            </div>
          )}
          </div>
        </div>
      )}
    </div>
  );
};
