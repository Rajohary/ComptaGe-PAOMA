import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { getPeriodesGestion, getBureaux } from '../../../api/referentiel';
import {
  getSectionsComptables,
  getTotauxG58,
  downloadBordereauG58Pdf,
  exportEcrituresExcel,
} from '../../../api/comptabilite';
import type { PeriodeGestion, SectionComptable, TotauxG58, Bureau } from '../../../types';
import { SectionForm } from '../components/SectionForm';
import { PeriodeSearchModal } from '../components/PeriodeSearchModal';
import { Link } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { formatAriary } from '../../../lib/formatters';
import { triggerBlobDownload } from '../../../lib/download';
import {
  FileText,
  Calendar,
  RefreshCw,
  AlertCircle,
  Wallet,
  Scale,
  Building2,
  CheckCircle2,
  Lock,
  Download,
  FileSpreadsheet,
  Search,
} from 'lucide-react';

export const SaisieG58Page: React.FC = () => {
  const { user, role } = useAuth();
  const isSuperviseur = role === 'ADMIN' || role === 'INSPECTEUR';

  // Données de base
  const [bureaux, setBureaux] = useState<Bureau[]>([]);
  const [periodes, setPeriodes] = useState<PeriodeGestion[]>([]);
  const [sections, setSections] = useState<SectionComptable[]>([]);

  // Sélections actives
  const [selectedBureauId, setSelectedBureauId] = useState<number>(0);
  const [selectedPeriodeId, setSelectedPeriodeId] = useState<number>(0);
  const [activeSens, setActiveSens] = useState<1 | 2>(1); // 1 = Débit, 2 = Crédit
  const [activeSectionCode, setActiveSectionCode] = useState<string>('A');

  // Totaux consolidés pour toute la période
  const [totauxG58, setTotauxG58] = useState<TotauxG58 | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);
  const [pdfDownloadError, setPdfDownloadError] = useState<string | null>(null);
  const [isExportingExcel, setIsExportingExcel] = useState<boolean>(false);
  const [excelExportError, setExcelExportError] = useState<string | null>(null);
  const [isPeriodeSearchOpen, setIsPeriodeSearchOpen] = useState<boolean>(false);

  // Charger les référentiels (bureaux si superviseur, périodes, sections)
  useEffect(() => {
    let mounted = true;
    const promises: [Promise<any>, Promise<any>, Promise<any>] = [
      isSuperviseur ? getBureaux() : Promise.resolve({ results: [] }),
      getPeriodesGestion(),
      getSectionsComptables(),
    ];

    Promise.all(promises)
      .then(([resBureaux, resPeriodes, resSections]) => {
        if (!mounted) return;
        const listBureaux = resBureaux.results || [];
        const listPeriodes = resPeriodes.results || [];
        const listSections = resSections.results || [];

        setBureaux(listBureaux);
        setPeriodes(listPeriodes);
        setSections(listSections);

        // Sélectionner le bureau par défaut (rattaché à l'agent/receveur ou premier bureau)
        let defaultBureau = listBureaux[0]?.id || 0;
        if (user?.bureau_code && listBureaux.length > 0) {
          const match = listBureaux.find((b: Bureau) => b.ncodique === user.bureau_code);
          if (match) defaultBureau = match.id;
        }
        setSelectedBureauId(defaultBureau);

        // Sélectionner par défaut la période en cours
        const activePeriode = listPeriodes.find((p: PeriodeGestion) => !p.cloturee);
        const defaultPeriodeId = activePeriode ? activePeriode.id : listPeriodes[0]?.id || 0;
        setSelectedPeriodeId(defaultPeriodeId);

        if (listSections.length > 0) {
          setActiveSectionCode(listSections[0].code);
        }
      })
      .catch((err) => {
        console.error('Erreur chargement données de saisie G58', err);
        setError('Impossible de charger les bureaux, périodes ou sections comptables.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [user?.bureau_code, isSuperviseur]);

  // Filtrer les périodes si un bureau spécifique est sélectionné (pour superviseurs)
  const availablePeriodes = useMemo(() => {
    if (!selectedBureauId) return periodes;
    const filtered = periodes.filter((p) => p.bureau === selectedBureauId);
    return filtered.length > 0 ? filtered : periodes;
  }, [periodes, selectedBureauId]);

  // Si la période sélectionnée ne fait pas partie des périodes du bureau choisi
  useEffect(() => {
    if (availablePeriodes.length > 0) {
      const exists = availablePeriodes.some((p) => p.id === selectedPeriodeId);
      if (!exists) {
        const activeOne = availablePeriodes.find((p) => !p.cloturee) || availablePeriodes[0];
        setSelectedPeriodeId(activeOne.id);
      }
    }
  }, [availablePeriodes, selectedPeriodeId]);

  // Charger les totaux consolidés dès que la période change
  const fetchTotaux = useCallback(async () => {
    if (!selectedPeriodeId) return;
    try {
      const res = await getTotauxG58({ periode: selectedPeriodeId });
      setTotauxG58(res);
    } catch (err) {
      console.warn('Totaux G58 non disponibles ou en cours de calcul', err);
    }
  }, [selectedPeriodeId]);

  useEffect(() => {
    fetchTotaux();
  }, [fetchTotaux]);

  const selectedPeriode = useMemo(() => {
    return periodes.find((p) => p.id === selectedPeriodeId) || null;
  }, [periodes, selectedPeriodeId]);

  // Filtrer les sections selon le sens actif (Débit = 1, Crédit = 2)
  const currentSensSections = useMemo(() => {
    return sections.filter((s) => s.sens === activeSens);
  }, [sections, activeSens]);

  const activeSection = useMemo(() => {
    const match = currentSensSections.find((s) => s.code === activeSectionCode);
    return match || currentSensSections[0] || null;
  }, [currentSensSections, activeSectionCode]);

  // Si on bascule d'onglet Débit / Crédit, s'assurer que la section active est valide
  const handleSelectSens = (sens: 1 | 2) => {
    setActiveSens(sens);
    const validSections = sections.filter((s) => s.sens === sens);
    if (validSections.length > 0) {
      const alreadyMatches = validSections.some((s) => s.code === activeSectionCode);
      if (!alreadyMatches) {
        setActiveSectionCode(validSections[0].code);
      }
    }
  };

  const currentBureau = useMemo(() => {
    if (selectedPeriode?.bureau_detail) {
      return selectedPeriode.bureau_detail;
    }
    return bureaux.find((b) => b.id === selectedBureauId) || null;
  }, [selectedPeriode, bureaux, selectedBureauId]);

  // Téléchargement du bordereau officiel Journal G58 en PDF
  const handleDownloadPdf = async () => {
    if (!selectedPeriodeId || isDownloadingPdf) return;
    setIsDownloadingPdf(true);
    setPdfDownloadError(null);
    try {
      const blob = await downloadBordereauG58Pdf(selectedPeriodeId);
      const bureauCode = currentBureau?.ncodique || user?.bureau_code || 'bureau';
      const dateDebut = selectedPeriode?.date_debut || 'periode';
      const filename = `Bordereau_G58_${bureauCode}_${dateDebut}.pdf`;
      triggerBlobDownload(blob, filename);
    } catch (err: any) {
      console.error('Erreur téléchargement bordereau G58 PDF', err);
      setPdfDownloadError(
        err?.detail ||
          err?.message ||
          'Impossible de générer le bordereau PDF. Veuillez vérifier votre connexion ou vos droits d’accès.'
      );
      setTimeout(() => setPdfDownloadError(null), 7000);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // Export du classeur Excel (.xlsx) complet du Journal G58
  const handleExportExcel = async () => {
    if (!selectedPeriodeId || isExportingExcel) return;
    setIsExportingExcel(true);
    setExcelExportError(null);
    try {
      const blob = await exportEcrituresExcel(selectedPeriodeId);
      const bureauCode = currentBureau?.ncodique || user?.bureau_code || 'bureau';
      const dateDebut = selectedPeriode?.date_debut || 'periode';
      const filename = `Journal_G58_${bureauCode}_${dateDebut}.xlsx`;
      triggerBlobDownload(blob, filename);
    } catch (err: any) {
      console.error('Erreur export Excel Journal G58', err);
      setExcelExportError(
        err?.detail ||
          err?.message ||
          'Impossible de générer le classeur Excel. Veuillez vérifier votre connexion ou vos droits d’accès.'
      );
      setTimeout(() => setExcelExportError(null), 7000);
    } finally {
      setIsExportingExcel(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* En-tête de la page */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
        <div>
          <div className="flex items-center gap-2 text-xs font-sans uppercase tracking-wider text-text-secondary">
            <FileText className="w-4 h-4 text-brand" />
            <span>Journal Général des Opérations · Bordereau G58</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-text-primary mt-1">
            Saisie du Journal G58
          </h1>
          <p className="text-xs sm:text-sm font-sans text-text-secondary mt-0.5">
            Imputation des débits et crédits journaliers par section (A à E) avec calculs en temps réel
          </p>
        </div>

        {/* Sélecteurs de contexte et raccourcis vers modules financiers */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Sélecteur de Bureau (pour Admin / Inspecteur) */}
          {isSuperviseur && bureaux.length > 0 && (
            <div className="flex items-center gap-2 bg-surface-card border border-border-subtle px-3 py-1.5 rounded-lg shadow-xs">
              <Building2 className="w-4 h-4 text-accent shrink-0" />
              <div className="text-left">
                <label htmlFor="select-bureau-g58" className="block text-[10px] font-sans text-text-secondary">
                  Bureau de poste
                </label>
                <select
                  id="select-bureau-g58"
                  aria-label="Bureau de poste"
                  value={selectedBureauId}
                  onChange={(e) => setSelectedBureauId(Number(e.target.value))}
                  className="text-xs font-sans font-medium bg-transparent text-text-primary focus:outline-none cursor-pointer"
                >
                  {bureaux.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.ncodique} — {b.nom_bureau} ({b.classe})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Sélection de la période de gestion & bouton de recherche avancée */}
          <div className="flex items-center gap-1.5 bg-surface-card border border-border-subtle p-1 rounded-lg shadow-xs">
            <div className="flex items-center gap-2 px-2 py-0.5">
              <Calendar className="w-4 h-4 text-brand shrink-0" />
              <div className="text-left">
                <label htmlFor="select-periode-g58" className="block text-[10px] font-sans text-text-secondary">
                  Période de gestion
                </label>
                <select
                  id="select-periode-g58"
                  aria-label="Période active"
                  value={selectedPeriodeId}
                  onChange={(e) => setSelectedPeriodeId(Number(e.target.value))}
                  className="text-xs font-sans font-medium bg-transparent text-text-primary focus:outline-none cursor-pointer max-w-[210px] sm:max-w-xs truncate"
                >
                  {availablePeriodes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.date_debut} au {p.date_fin ? p.date_fin : 'en cours'} {p.cloturee ? '(Clôturée)' : '(Ouverte)'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsPeriodeSearchOpen(true)}
              className="p-1.5 px-2 text-text-secondary hover:text-brand hover:bg-surface-secondary border-l border-border-subtle rounded-l-none"
              title="Rechercher une période par date, receveur..."
              data-testid="btn-open-search-periode-modal"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Rechercher</span>
            </Button>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={fetchTotaux}
            title="Rafraîchir les totaux consolidés"
            className="p-2"
          >
            <RefreshCw className="w-4 h-4 text-text-secondary hover:text-text-primary" />
          </Button>

          <Link to="/encaisse">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="flex items-center gap-1.5"
              data-testid="link-to-encaisse"
            >
              <Wallet className="w-3.5 h-3.5 text-brand" />
              <span>Détails de l'encaisse</span>
            </Button>
          </Link>

          <Link to="/situation-comptable">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="flex items-center gap-1.5"
              data-testid="link-to-situation"
            >
              <Scale className="w-3.5 h-3.5 text-accent" />
              <span>Situation comptable</span>
            </Button>
          </Link>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleDownloadPdf}
            isLoading={isDownloadingPdf}
            disabled={!selectedPeriodeId || loading || isDownloadingPdf}
            className="flex items-center gap-1.5 text-brand border-brand/30 hover:bg-brand/10"
            data-testid="btn-download-bordereau-g58"
            title="Télécharger le bordereau officiel Journal G58 en PDF"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Bordereau G58 (PDF)</span>
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleExportExcel}
            isLoading={isExportingExcel}
            disabled={!selectedPeriodeId || loading || isExportingExcel}
            className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
            data-testid="btn-export-excel-g58"
            title="Exporter l'ensemble des écritures de la période en classeur Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export Excel</span>
          </Button>
        </div>
      </div>

      {/* Bannière de contexte de gestion du bureau */}
      {selectedPeriode && (
        <div className="bg-surface-secondary/40 border border-border-subtle rounded-xl p-3 sm:px-4 sm:py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs font-sans">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center gap-1.5 text-text-secondary">
              <Building2 className="w-3.5 h-3.5 text-brand" />
              <span>Bureau :</span>
              <strong className="text-text-primary font-medium">
                {currentBureau ? `${currentBureau.nom_bureau} (${currentBureau.ncodique})` : `Bureau #${selectedPeriode.bureau}`}
              </strong>
            </div>
            <span className="text-border-subtle hidden sm:inline">•</span>
            <div className="text-text-secondary">
              Receveur : <strong className="text-text-primary font-medium">{selectedPeriode.nom_receveur}</strong>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {selectedPeriode.cloturee ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-status-alert/15 text-status-alert border border-status-alert/30">
                <Lock className="w-3 h-3" />
                Période clôturée (saisie verrouillée)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-status-success/15 text-status-success border border-status-success/30">
                <CheckCircle2 className="w-3 h-3" />
                Période active et imputable
              </span>
            )}
          </div>
        </div>
      )}

      {/* Alerte erreur téléchargement PDF */}
      {pdfDownloadError && (
        <div
          role="alert"
          className="p-3 bg-status-alert/10 border border-status-alert/30 rounded-xl text-xs font-sans text-status-alert flex items-start justify-between gap-2"
          data-testid="alert-pdf-download-error"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{pdfDownloadError}</span>
          </div>
          <button
            type="button"
            onClick={() => setPdfDownloadError(null)}
            className="text-status-alert hover:underline text-xs"
          >
            Fermer
          </button>
        </div>
      )}

      {/* Alerte erreur export Excel */}
      {excelExportError && (
        <div
          role="alert"
          className="p-3 bg-status-alert/10 border border-status-alert/30 rounded-xl text-xs font-sans text-status-alert flex items-start justify-between gap-2"
          data-testid="alert-excel-export-error"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{excelExportError}</span>
          </div>
          <button
            type="button"
            onClick={() => setExcelExportError(null)}
            className="text-status-alert hover:underline text-xs"
          >
            Fermer
          </button>
        </div>
      )}

      {/* Onglets Débit et Crédit posés au dessus des sections du plan comptable */}
      <div className="flex flex-col space-y-3">
        <div className="flex items-center gap-2 bg-surface-secondary/70 p-1 rounded-xl w-fit border border-border-subtle/60" role="tablist" aria-label="Sens comptable">
          <button
            type="button"
            role="tab"
            data-testid="tab-sens-debit"
            aria-selected={activeSens === 1}
            onClick={() => handleSelectSens(1)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-sans transition-all cursor-pointer ${
              activeSens === 1
                ? 'bg-brand text-white font-bold shadow-xs'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Débit (Recettes)</span>
            {totauxG58?.total_general_debit && (
              <span className={`text-[11px] font-mono ml-1 px-2 py-0.5 rounded ${
                activeSens === 1 ? 'bg-black/20 text-white' : 'bg-surface-secondary text-text-secondary'
              }`}>
                {formatAriary(totauxG58.total_general_debit)}
              </span>
            )}
          </button>

          <button
            type="button"
            role="tab"
            data-testid="tab-sens-credit"
            aria-selected={activeSens === 2}
            onClick={() => handleSelectSens(2)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-sans transition-all cursor-pointer ${
              activeSens === 2
                ? 'bg-status-alert text-white font-bold shadow-xs'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-red-300"></span>
            <span>Crédit (Dépenses)</span>
            {totauxG58?.total_general_credit && (
              <span className={`text-[11px] font-mono ml-1 px-2 py-0.5 rounded ${
                activeSens === 2 ? 'bg-black/20 text-white' : 'bg-surface-secondary text-text-secondary'
              }`}>
                {formatAriary(totauxG58.total_general_credit)}
              </span>
            )}
          </button>
        </div>

        {/* Onglets des sections macro-comptables de la catégorie active */}
        <div className="border-b border-border-subtle">
          {currentSensSections.length === 0 ? (
            <div className="py-3 px-4 text-xs font-sans text-text-secondary italic bg-surface-secondary/30 rounded-t-xl border-t border-x border-border-subtle/50">
              Aucune section configurée pour {activeSens === 1 ? 'le Débit' : 'le Crédit'}.
            </div>
          ) : (
            <div className="flex items-center gap-2 overflow-x-auto pb-1" role="tablist" aria-label={`Sections ${activeSens === 1 ? 'Débit' : 'Crédit'}`}>
              {currentSensSections.map((sec) => {
                const isActive = sec.code === activeSectionCode;
                const secTotaux = totauxG58?.totaux_sections?.[`${sec.sens}_${sec.code}`] || totauxG58?.totaux_sections?.[sec.code];
                const isDebit = sec.sens === 1;

                return (
                  <button
                    key={sec.id}
                    role="tab"
                    data-testid={`tab-section-${sec.code}`}
                    aria-selected={isActive}
                    onClick={() => setActiveSectionCode(sec.code)}
                    className={`flex items-center gap-2.5 px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-sans font-medium transition-all duration-150 border-t border-x cursor-pointer ${
                      isActive
                        ? 'bg-surface-card border-border-subtle text-text-primary shadow-xs font-semibold -mb-px border-b-2 border-b-brand'
                        : 'bg-surface-secondary/40 border-transparent text-text-secondary hover:text-text-primary hover:bg-surface-secondary/80'
                    }`}
                  >
                    <span
                      className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs ${
                        isActive
                          ? isDebit ? 'bg-brand text-white' : 'bg-status-alert text-white'
                          : 'bg-surface-secondary text-text-secondary'
                      }`}
                    >
                      {sec.code}
                    </span>
                    <span className="truncate max-w-[140px] sm:max-w-[200px]">{sec.libelle}</span>

                    {/* Badge sens Débit / Crédit */}
                    <span
                      className={`text-[9px] uppercase px-1.5 py-0.2 rounded font-bold ${
                        isDebit ? 'bg-brand/10 text-brand' : 'bg-status-alert/10 text-status-alert'
                      }`}
                      aria-hidden="true"
                    >
                      {isDebit ? 'Débit' : 'Crédit'}
                    </span>

                    {secTotaux && Number(secTotaux.total_declare) > 0 && (
                      <span className="text-[11px] font-mono bg-surface-secondary px-2 py-0.5 rounded text-text-primary font-bold hidden sm:inline">
                        {formatAriary(secTotaux.total_declare)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Erreur de chargement */}
      {error && !loading && (
        <div
          role="alert"
          className="p-4 bg-status-alert/10 border border-status-alert/30 rounded-xl text-xs sm:text-sm font-sans text-status-alert flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 shrink-0 text-status-alert" />
          <span>{error}</span>
        </div>
      )}

      {/* Formulaire de la section active */}
      {!loading && selectedPeriode && activeSection && (
        <SectionForm
          key={`${selectedPeriode.id}-${activeSection.code}`}
          periode={selectedPeriode}
          section={activeSection}
          bureauCode={user?.bureau_code}
          onMouvementChanged={fetchTotaux}
          totalGeneralDebit={
            totauxG58?.total_general_debit ? Number(totauxG58.total_general_debit) : undefined
          }
          totalGeneralCredit={
            totauxG58?.total_general_credit ? Number(totauxG58.total_general_credit) : undefined
          }
        />
      )}

      {/* Message informatif si aucune section n'est disponible pour le sens actif */}
      {!loading && selectedPeriode && !activeSection && (
        <div className="bg-surface-card border border-border-subtle rounded-xl p-8 text-center text-text-secondary text-sm">
          Aucune section comptable disponible pour la vue {activeSens === 1 ? 'Débit' : 'Crédit'}.
        </div>
      )}

      {/* Modal de recherche rapide de période */}
      <PeriodeSearchModal
        isOpen={isPeriodeSearchOpen}
        onClose={() => setIsPeriodeSearchOpen(false)}
        periodes={availablePeriodes}
        selectedPeriodeId={selectedPeriodeId}
        onSelectPeriode={(p) => setSelectedPeriodeId(p.id)}
        bureauName={
          currentBureau
            ? `${currentBureau.nom_bureau} (${currentBureau.ncodique})`
            : undefined
        }
      />
    </div>
  );
};
