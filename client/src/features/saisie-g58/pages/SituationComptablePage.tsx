import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { getPeriodesGestion, getBureaux } from '../../../api/referentiel';
import { getSituationComptable } from '../../../api/comptabilite';
import type { PeriodeGestion, Bureau, SituationComptable } from '../../../types';
import { Button } from '../../../components/ui/Button';
import {
  RefreshCw,
  AlertCircle,
  Building2,
  Calendar,
  Lock,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Scale,
  Sparkles,
} from 'lucide-react';

export const SituationComptablePage: React.FC = () => {
  const { user, role } = useAuth();

  // Données de base
  const [periodes, setPeriodes] = useState<PeriodeGestion[]>([]);
  const [bureaux, setBureaux] = useState<Bureau[]>([]);
  const [selectedBureauId, setSelectedBureauId] = useState<number>(0);
  const [selectedPeriodeId, setSelectedPeriodeId] = useState<number>(0);

  // Situation comptable
  const [situation, setSituation] = useState<SituationComptable | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les référentiels
  useEffect(() => {
    let mounted = true;
    Promise.all([getBureaux(), getPeriodesGestion()])
      .then(([resBureaux, resPeriodes]) => {
        if (!mounted) return;
        const listBureaux: Bureau[] = resBureaux.results || [];
        const listPeriodes: PeriodeGestion[] = resPeriodes.results || [];

        setBureaux(listBureaux);
        setPeriodes(listPeriodes);

        // Sélectionner par défaut le bureau du receveur ou le premier
        let defaultBureau = listBureaux[0]?.id || 0;
        if (user?.bureau_code) {
          const match = listBureaux.find((b: Bureau) => b.ncodique === user.bureau_code);
          if (match) defaultBureau = match.id;
        }
        setSelectedBureauId(defaultBureau);

        // Sélectionner la période active ou la première
        const activePeriode = listPeriodes.find((p: PeriodeGestion) => !p.cloturee);
        const defaultPeriode = activePeriode ? activePeriode.id : listPeriodes[0]?.id || 0;
        setSelectedPeriodeId(defaultPeriode);
      })
      .catch((err) => {
        console.error('Erreur chargement référentiel situation comptable', err);
        setError('Impossible de charger les bureaux ou périodes de gestion.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [user?.bureau_code]);

  // Charger la situation comptable de la période sélectionnée
  const fetchSituation = useCallback(async () => {
    if (!selectedPeriodeId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getSituationComptable(selectedPeriodeId);
      setSituation(data);
    } catch (err: any) {
      console.error('Erreur chargement situation comptable', err);
      setError(err?.detail || 'Impossible de calculer la situation comptable de cette période.');
    } finally {
      setLoading(false);
    }
  }, [selectedPeriodeId]);

  useEffect(() => {
    fetchSituation();
  }, [fetchSituation]);

  // Filtrer les périodes selon le bureau sélectionné si disponible
  const filteredPeriodes = useMemo(() => {
    if (!selectedBureauId) return periodes;
    const match = periodes.filter((p) => p.bureau === selectedBureauId);
    return match.length > 0 ? match : periodes;
  }, [periodes, selectedBureauId]);

  const selectedPeriode = useMemo(() => {
    return periodes.find((p) => p.id === selectedPeriodeId) || null;
  }, [periodes, selectedPeriodeId]);

  const isPeriodeCloturee = situation?.cloturee ?? selectedPeriode?.cloturee ?? false;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* En-tête */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border-subtle">
        <div>
          <div className="flex items-center gap-2 text-xs font-sans uppercase tracking-wider text-text-secondary">
            <Scale className="w-4 h-4 text-brand" />
            <span>Synthèse officielle · Journal G58</span>
          </div>
          <h1 className="text-2xl font-heading font-bold text-text-primary mt-1">
            Situation comptable mensuelle
          </h1>
          <p className="text-xs sm:text-sm font-sans text-text-secondary mt-0.5">
            Balance générale, report automatique du mois précédent et détermination du solde de clôture
          </p>
        </div>

        {/* Contrôles et sélecteurs de période */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Sélecteur de bureau (si Inspecteur / Admin) */}
          {(role === 'ADMIN' || role === 'INSPECTEUR') && (
            <div className="flex items-center gap-2 bg-surface-card border border-border-subtle px-3 py-1.5 rounded-lg shadow-2xs">
              <Building2 className="w-4 h-4 text-brand shrink-0" />
              <select
                id="select-bureau-situation"
                aria-label="Bureau de poste"
                value={selectedBureauId}
                onChange={(e) => setSelectedBureauId(Number(e.target.value))}
                className="text-xs font-sans font-medium bg-transparent text-text-primary focus:outline-hidden"
              >
                {bureaux.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.ncodique} — {b.nom_bureau}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Sélecteur de période */}
          <div className="flex items-center gap-2 bg-surface-card border border-border-subtle px-3 py-1.5 rounded-lg shadow-2xs">
            <Calendar className="w-4 h-4 text-brand shrink-0" />
            <select
              id="select-periode-situation"
              aria-label="Période de gestion"
              value={selectedPeriodeId}
              onChange={(e) => setSelectedPeriodeId(Number(e.target.value))}
              className="text-xs font-sans font-medium bg-transparent text-text-primary focus:outline-hidden"
            >
              {filteredPeriodes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.date_debut} au {p.date_fin} {p.cloturee ? '(Clôturée)' : '(En cours)'}
                </option>
              ))}
            </select>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={fetchSituation}
            disabled={loading}
            title="Recalculer la situation"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Message d'erreur */}
      {error && !loading && (
        <div
          role="alert"
          className="p-4 bg-status-alert/10 border border-status-alert/30 rounded-xl text-xs sm:text-sm font-sans text-status-alert flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 shrink-0 text-status-alert" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center bg-surface-card border border-border-subtle rounded-xl shadow-2xs" data-testid="situation-loading-state">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-brand mb-3" />
          <p className="text-sm font-heading font-medium text-text-primary">
            Calcul de la situation comptable en cours…
          </p>
          <p className="text-xs font-sans text-text-secondary mt-1">
            Vérification des reports de soldes et consolidation des sections A à E
          </p>
        </div>
      ) : situation ? (
        <div className="space-y-6" data-testid="situation-content">
          {/* Bannière de traçabilité du Report Automatique */}
          <div
            className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              situation.periode_precedente_id
                ? 'bg-brand/5 border-brand/20'
                : 'bg-surface-secondary/40 border-border-subtle'
            }`}
            data-testid="report-banner"
          >
            <div className="flex items-start gap-3">
              <div
                className={`p-2 rounded-lg mt-0.5 ${
                  situation.periode_precedente_id
                    ? 'bg-brand/10 text-brand'
                    : 'bg-surface-secondary text-text-secondary'
                }`}
              >
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs sm:text-sm font-heading font-bold text-text-primary">
                    {situation.periode_precedente_id
                      ? 'Report automatique du solde du mois précédent actif'
                      : 'Solde initial déclaré à l’ouverture'}
                  </h4>
                  {situation.periode_precedente_id && (
                    <span className="text-[10px] font-sans font-semibold bg-brand/10 text-brand px-2 py-0.5 rounded-full">
                      Automatisé
                    </span>
                  )}
                </div>
                <p className="text-xs font-sans text-text-secondary mt-0.5">
                  Origine du report : <strong className="text-text-primary font-medium">{situation.source_report}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-center font-mono text-xs">
              <div className="text-right">
                <span className="text-[10px] uppercase font-sans text-text-secondary block">Report Débiteur</span>
                <span className="font-bold text-brand" data-testid="report-debit">
                  {Number(situation.solde_debiteur_reporte).toLocaleString('fr-FR', {
                    minimumFractionDigits: 2,
                  })}{' '}
                  Ar
                </span>
              </div>
              <div className="h-6 w-px bg-border-subtle" />
              <div className="text-right">
                <span className="text-[10px] uppercase font-sans text-text-secondary block">Report Créditeur</span>
                <span className="font-bold text-status-alert" data-testid="report-credit">
                  {Number(situation.solde_crediteur_reporte).toLocaleString('fr-FR', {
                    minimumFractionDigits: 2,
                  })}{' '}
                  Ar
                </span>
              </div>
            </div>
          </div>

          {/* Tableau de la Balance Générale Débit / Crédit */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Colonne DÉBITS */}
            <div className="bg-surface-card border border-border-subtle rounded-xl shadow-2xs overflow-hidden">
              <div className="bg-brand/10 p-4 border-b border-border-subtle flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-brand" />
                  <h3 className="text-sm font-heading font-bold text-brand">
                    COLONNE DES DÉBITS (Opérations & Reports)
                  </h3>
                </div>
                <span className="text-xs font-mono font-bold text-brand px-2 py-0.5 rounded bg-brand/15">
                  DÉBIT
                </span>
              </div>

              <div className="p-4 space-y-3 font-sans text-xs">
                {/* 1. Solde reporté */}
                <div className="flex items-center justify-between py-2 border-b border-border-subtle">
                  <span className="text-text-secondary">1. Solde débiteur du mois précédent reporté</span>
                  <span className="font-mono font-bold text-text-primary">
                    {Number(situation.solde_debiteur_reporte).toLocaleString('fr-FR', {
                      minimumFractionDigits: 2,
                    })}{' '}
                    Ar
                  </span>
                </div>

                {/* 2. Total des opérations du mois */}
                <div className="flex items-center justify-between py-2 border-b border-border-subtle">
                  <div>
                    <span className="font-medium text-text-primary block">
                      2. Opérations du mois courant (Sections débitrices A, D…)
                    </span>
                    <span className="text-[11px] text-text-secondary">
                      Cumul des écritures déclarées et vérifiées
                    </span>
                  </div>
                  <span className="font-mono font-bold text-brand" data-testid="mois-debit">
                    +{Number(situation.total_debit_mois).toLocaleString('fr-FR', {
                      minimumFractionDigits: 2,
                    })}{' '}
                    Ar
                  </span>
                </div>

                {/* 3. CUMUL GÉNÉRAL DÉBIT */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-surface-secondary/40 font-semibold">
                  <span className="text-text-primary">TOTAL GÉNÉRAL DES DÉBITS (1 + 2)</span>
                  <span className="font-mono text-base font-bold text-brand" data-testid="cumul-debit">
                    {Number(situation.cumul_debit).toLocaleString('fr-FR', {
                      minimumFractionDigits: 2,
                    })}{' '}
                    Ar
                  </span>
                </div>
              </div>
            </div>

            {/* Colonne CRÉDITS */}
            <div className="bg-surface-card border border-border-subtle rounded-xl shadow-2xs overflow-hidden">
              <div className="bg-status-alert/10 p-4 border-b border-border-subtle flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-status-alert" />
                  <h3 className="text-sm font-heading font-bold text-status-alert">
                    COLONNE DES CRÉDITS (Dépenses & Reports)
                  </h3>
                </div>
                <span className="text-xs font-mono font-bold text-status-alert px-2 py-0.5 rounded bg-status-alert/15">
                  CRÉDIT
                </span>
              </div>

              <div className="p-4 space-y-3 font-sans text-xs">
                {/* 1. Solde reporté */}
                <div className="flex items-center justify-between py-2 border-b border-border-subtle">
                  <span className="text-text-secondary">1. Solde créditeur du mois précédent reporté</span>
                  <span className="font-mono font-bold text-text-primary">
                    {Number(situation.solde_crediteur_reporte).toLocaleString('fr-FR', {
                      minimumFractionDigits: 2,
                    })}{' '}
                    Ar
                  </span>
                </div>

                {/* 2. Total des opérations du mois */}
                <div className="flex items-center justify-between py-2 border-b border-border-subtle">
                  <div>
                    <span className="font-medium text-text-primary block">
                      2. Opérations du mois courant (Sections créditrices B, C…)
                    </span>
                    <span className="text-[11px] text-text-secondary">
                      Cumul des écritures déclarées et vérifiées
                    </span>
                  </div>
                  <span className="font-mono font-bold text-status-alert" data-testid="mois-credit">
                    +{Number(situation.total_credit_mois).toLocaleString('fr-FR', {
                      minimumFractionDigits: 2,
                    })}{' '}
                    Ar
                  </span>
                </div>

                {/* 3. CUMUL GÉNÉRAL CRÉDIT */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-surface-secondary/40 font-semibold">
                  <span className="text-text-primary">TOTAL GÉNÉRAL DES CRÉDITS (1 + 2)</span>
                  <span className="font-mono text-base font-bold text-status-alert" data-testid="cumul-credit">
                    {Number(situation.cumul_credit).toLocaleString('fr-FR', {
                      minimumFractionDigits: 2,
                    })}{' '}
                    Ar
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Synthèse finale : Solde de Clôture */}
          <div className="bg-surface-card border border-border-subtle rounded-xl p-6 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-sans text-text-secondary uppercase tracking-wider block">
                  Résultat de la balance périodique
                </span>
                <h3 className="text-lg font-heading font-bold text-text-primary mt-0.5">
                  Solde de Clôture du Bureau au {situation.date_fin}
                </h3>
                <p className="text-xs font-sans text-text-secondary mt-0.5">
                  Ce montant sera automatiquement reporté comme solde initial du mois suivant.
                </p>
              </div>

              <div className="flex items-center gap-4">
                {Number(situation.solde_debiteur_fin) > 0 ? (
                  <div className="text-right p-3 bg-brand/10 border border-brand/20 rounded-xl">
                    <span className="text-[11px] font-sans font-semibold text-brand block uppercase">
                      Solde Débiteur de Clôture
                    </span>
                    <span className="text-xl sm:text-2xl font-mono font-bold text-brand" data-testid="solde-debiteur-fin">
                      +{Number(situation.solde_debiteur_fin).toLocaleString('fr-FR', {
                        minimumFractionDigits: 2,
                      })}{' '}
                      Ar
                    </span>
                  </div>
                ) : Number(situation.solde_crediteur_fin) > 0 ? (
                  <div className="text-right p-3 bg-status-alert/10 border border-status-alert/20 rounded-xl">
                    <span className="text-[11px] font-sans font-semibold text-status-alert block uppercase">
                      Solde Créditeur de Clôture
                    </span>
                    <span className="text-xl sm:text-2xl font-mono font-bold text-status-alert" data-testid="solde-crediteur-fin">
                      -{Number(situation.solde_crediteur_fin).toLocaleString('fr-FR', {
                        minimumFractionDigits: 2,
                      })}{' '}
                      Ar
                    </span>
                  </div>
                ) : (
                  <div className="text-right p-3 bg-surface-secondary border border-border-subtle rounded-xl">
                    <span className="text-[11px] font-sans font-semibold text-text-secondary block uppercase">
                      Balance Parfaitement Équilibrée
                    </span>
                    <span className="text-xl sm:text-2xl font-mono font-bold text-text-primary" data-testid="solde-equilibre">
                      0,00 Ar
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Statut de la période */}
            <div className="mt-4 pt-4 border-t border-border-subtle flex items-center justify-between text-xs font-sans">
              <span className="text-text-secondary">
                Bureau : <strong>{situation.bureau_ncodique} — {situation.bureau_nom}</strong> · Receveur :{' '}
                <strong>{situation.nom_receveur}</strong>
              </span>
              <div className="flex items-center gap-1.5">
                {isPeriodeCloturee ? (
                  <span className="flex items-center gap-1 text-text-secondary font-medium bg-surface-secondary px-2.5 py-1 rounded-full">
                    <Lock className="w-3.5 h-3.5" /> Période officielle clôturée
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-brand font-medium bg-brand/10 px-2.5 py-1 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Période en cours de saisie
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
