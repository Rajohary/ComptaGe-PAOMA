import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { getPeriodesGestion } from '../../../api/referentiel';
import { getSectionsComptables, getTotauxG58 } from '../../../api/comptabilite';
import type { PeriodeGestion, SectionComptable, TotauxG58 } from '../../../types';
import { SectionForm } from '../components/SectionForm';
import { Link } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import {
  FileText,
  Calendar,
  RefreshCw,
  AlertCircle,
  Wallet,
  Scale,
} from 'lucide-react';


export const SaisieG58Page: React.FC = () => {
  const { user } = useAuth();

  // Données de base
  const [periodes, setPeriodes] = useState<PeriodeGestion[]>([]);
  const [sections, setSections] = useState<SectionComptable[]>([]);
  const [selectedPeriodeId, setSelectedPeriodeId] = useState<number>(0);
  const [activeSectionCode, setActiveSectionCode] = useState<string>('A');

  // Totaux consolidés pour toute la période
  const [totauxG58, setTotauxG58] = useState<TotauxG58 | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les périodes de gestion et le référentiel des sections (A à E)
  useEffect(() => {
    let mounted = true;
    Promise.all([getPeriodesGestion(), getSectionsComptables()])
      .then(([resPeriodes, resSections]) => {
        if (!mounted) return;
        const listPeriodes = resPeriodes.results || [];
        const listSections = resSections.results || [];

        setPeriodes(listPeriodes);
        setSections(listSections);

        // Sélectionner par défaut la période en cours (non clôturée)
        const activePeriode = listPeriodes.find((p: PeriodeGestion) => !p.cloturee);
        const defaultPeriodeId = activePeriode ? activePeriode.id : listPeriodes[0]?.id || 0;

        setSelectedPeriodeId(defaultPeriodeId);

        if (listSections.length > 0) {
          setActiveSectionCode(listSections[0].code);
        }
      })
      .catch((err) => {
        console.error('Erreur chargement données de saisie G58', err);
        setError('Impossible de charger les périodes ou les sections comptables.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

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

  const activeSection = useMemo(() => {
    return sections.find((s) => s.code === activeSectionCode) || sections[0] || null;
  }, [sections, activeSectionCode]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* En-tête de la page */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border-subtle">
        <div>
          <div className="flex items-center gap-2 text-xs font-sans uppercase tracking-wider text-text-secondary">
            <FileText className="w-4 h-4 text-brand" />
            <span>Journal de Trésorerie · Cœur comptable</span>
          </div>
          <h1 className="text-2xl font-heading font-bold text-text-primary mt-1">
            Saisie du Journal G58
          </h1>
          <p className="text-xs sm:text-sm font-sans text-text-secondary mt-0.5">
            Imputation des opérations journalières par section macro-comptable (A, B, D…)
          </p>
        </div>

        {/* Sélection de la période de gestion */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-surface-card border border-border-subtle px-3 py-1.5 rounded-lg shadow-2xs">
            <Calendar className="w-4 h-4 text-brand shrink-0" />
            <div className="text-left">
              <label htmlFor="select-periode-g58" className="block text-[10px] font-sans text-text-secondary">
                Période active
              </label>
              <select
                id="select-periode-g58"
                aria-label="Période active"
                value={selectedPeriodeId}
                onChange={(e) => setSelectedPeriodeId(Number(e.target.value))}
                className="text-xs font-sans font-medium bg-transparent text-text-primary focus:outline-hidden"
              >
                {periodes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.date_debut} au {p.date_fin} {p.cloturee ? '(Clôturée)' : '(En cours)'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={fetchTotaux}
            title="Rafraîchir les totaux consolidés"
          >
            <RefreshCw className="w-4 h-4" />
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
              <Scale className="w-3.5 h-3.5 text-brand" />
              <span>Situation comptable</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Onglets de sections macro-comptables (A, B, C, D, E) avec priorité sur A, B, D */}
      <div className="border-b border-border-subtle">
        <div className="flex items-center gap-2 overflow-x-auto pb-1" role="tablist">
          {sections.map((sec) => {
            const isActive = sec.code === activeSectionCode;
            const secTotaux = totauxG58?.totaux_sections?.[sec.code];
            return (
              <button
                key={sec.code}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveSectionCode(sec.code)}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-sans font-medium transition-all duration-150 border-t border-x ${
                  isActive
                    ? 'bg-surface-card border-border-subtle text-text-primary shadow-2xs font-semibold -mb-px border-b-2 border-b-brand'
                    : 'bg-surface-secondary/40 border-transparent text-text-secondary hover:text-text-primary hover:bg-surface-secondary/80'
                }`}
              >
                <span
                  className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs ${
                    isActive ? 'bg-brand text-white' : 'bg-surface-secondary text-text-secondary'
                  }`}
                >
                  {sec.code}
                </span>
                <span className="truncate max-w-[140px] sm:max-w-[200px]">{sec.libelle}</span>
                {secTotaux && Number(secTotaux.total_declare) > 0 && (
                  <span className="text-[10px] font-mono bg-surface-secondary px-1.5 py-0.5 rounded text-text-secondary hidden sm:inline">
                    {Number(secTotaux.total_declare).toLocaleString('fr-FR')} Ar
                  </span>
                )}
              </button>
            );
          })}
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
    </div>
  );
};
