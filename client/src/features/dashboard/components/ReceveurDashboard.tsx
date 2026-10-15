import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getReceveurDashboard } from '../../../api/dashboard';
import type { ReceveurDashboardData } from '../../../types';
import { formatMGA, formatDate } from '../../../lib/formatters';
import { Button } from '../../../components/ui/Button';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Scale,
  AlertTriangle,
  Building2,
  Calendar,
  Layers,
  FileSpreadsheet,
  RefreshCw,
  ArrowRight,
  ShieldAlert,
  Coins,
  Stamp,
  CheckCircle2,
} from 'lucide-react';

interface ReceveurDashboardProps {
  bureauId?: number | string;
}

export const ReceveurDashboard: React.FC<ReceveurDashboardProps> = ({ bureauId }) => {
  const [data, setData] = useState<ReceveurDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getReceveurDashboard({ bureau: bureauId });
      setData(res);
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string }; message?: string };
      setError(e.data?.detail || e.message || 'Impossible de charger le tableau de bord Receveur.');
    } finally {
      setLoading(false);
    }
  }, [bureauId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse" data-testid="dashboard-receveur-loading">
        <div className="h-20 bg-surface-card rounded-xl border border-border-subtle" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-surface-card rounded-xl border border-border-subtle" />
          ))}
        </div>
        <div className="h-64 bg-surface-card rounded-xl border border-border-subtle" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-surface-card rounded-xl border border-status-alert/30 p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-status-alert/10 text-status-alert flex items-center justify-center mx-auto mb-3">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-heading font-semibold text-text-primary mb-1">
          Erreur de chargement
        </h3>
        <p className="text-sm font-sans text-text-secondary max-w-md mx-auto mb-4">
          {error || "Une erreur inattendue est survenue lors de l'accès aux données du bureau."}
        </p>
        <Button onClick={loadData} variant="secondary" className="inline-flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          Réessayer
        </Button>
      </div>
    );
  }

  const { bureau, periode, has_active_periode, progression_sections, totaux_mouvements, encaisse } = data;
  const soldeNum = parseFloat(totaux_mouvements.solde_mouvements || '0');

  return (
    <div className="space-y-6" data-testid="dashboard-receveur">
      {/* 1. En-tête contextuel du bureau et de la période */}
      <div className="bg-surface-card rounded-xl border border-border-subtle p-5 md:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-paoma-blue/10 text-paoma-blue dark:text-accent">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-heading font-bold text-text-primary">
                  {bureau.nom_bureau}
                </h2>
                <span className="text-xs font-sans font-medium px-2.5 py-0.5 rounded-full bg-surface-secondary text-text-secondary tabular-nums">
                  Codique {bureau.ncodique}
                </span>
                {bureau.classe && (
                  <span className="text-xs font-sans font-medium px-2 py-0.5 rounded bg-paoma-blue/10 text-paoma-blue dark:text-accent">
                    Classe {bureau.classe}
                  </span>
                )}
                {bureau.province_nom && (
                  <span className="text-xs font-sans text-text-secondary">
                    • {bureau.province_nom}
                  </span>
                )}
              </div>

              {periode ? (
                <div className="flex items-center gap-2 text-sm text-text-secondary mt-1.5 flex-wrap">
                  <Calendar className="w-4 h-4 text-text-secondary/70" />
                  <span>
                    Période du <strong className="text-text-primary">{formatDate(periode.date_debut)}</strong> au{' '}
                    <strong className="text-text-primary">{formatDate(periode.date_fin)}</strong>
                  </span>
                  <span>•</span>
                  <span>Receveur : <span className="font-medium text-text-primary">{periode.nom_receveur}</span></span>
                </div>
              ) : (
                <p className="text-sm text-status-alert mt-1.5 font-medium">
                  Aucune période de gestion ouverte actuellement pour ce bureau.
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 self-end md:self-center">
            {periode && (
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-sans font-semibold px-3 py-1 rounded-full ${
                  has_active_periode
                    ? 'bg-status-success/15 text-status-success border border-status-success/30'
                    : 'bg-surface-secondary text-text-secondary border border-border-subtle'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    has_active_periode ? 'bg-status-success animate-pulse' : 'bg-text-secondary'
                  }`}
                />
                {has_active_periode ? 'Période active' : 'Période clôturée'}
              </span>
            )}
            <Button onClick={loadData} variant="ghost" size="sm" title="Actualiser les données">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Message d'avertissement si pas de période active */}
        {!has_active_periode && (
          <div className="mt-4 pt-4 border-t border-border-subtle flex items-center justify-between flex-wrap gap-3 text-sm bg-accent/5 -mx-5 -mb-5 p-4 rounded-b-xl">
            <div className="flex items-center gap-2 text-text-primary">
              <ShieldAlert className="w-4 h-4 text-accent" />
              <span>
                {periode
                  ? 'Cette période est verrouillée. Les saisies doivent être enregistrées sur une nouvelle période ouverte.'
                  : 'Veuillez ouvrir une période de gestion pour démarrer les écritures comptables du Journal G58.'}
              </span>
            </div>
            <Link to="/periodes-gestion">
              <Button size="sm" variant="primary" className="inline-flex items-center gap-1">
                Gérer les périodes
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* 2. Cartes de synthèse clés (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Encaisse Actuelle */}
        <div className="bg-surface-card rounded-xl border border-border-subtle p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-text-secondary mb-2">
            <span className="text-xs font-heading font-medium uppercase tracking-wider">
              Caisse actuelle
            </span>
            <div className="p-2 rounded-lg bg-paoma-yellow/20 text-text-primary">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-sans font-bold text-text-primary tabular-nums tracking-tight">
            {formatMGA(encaisse.montant_caisse_actuel)}
          </div>
          <div className="text-xs text-text-secondary mt-2 flex items-center justify-between border-t border-border-subtle/50 pt-2">
            <span>Départ : {formatMGA(encaisse.reserve_numeraire_depart)}</span>
            <span
              className={`font-semibold tabular-nums ${
                parseFloat(encaisse.variation_nette) >= 0 ? 'text-status-success' : 'text-status-alert'
              }`}
            >
              {parseFloat(encaisse.variation_nette) >= 0 ? '+' : ''}
              {formatMGA(encaisse.variation_nette)}
            </span>
          </div>
        </div>

        {/* Total Débits / Recettes */}
        <div className="bg-surface-card rounded-xl border border-border-subtle p-5 shadow-sm">
          <div className="flex items-center justify-between text-text-secondary mb-2">
            <span className="text-xs font-heading font-medium uppercase tracking-wider">
              Recettes (Débit)
            </span>
            <div className="p-2 rounded-lg bg-status-success/15 text-status-success">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-sans font-bold text-text-primary tabular-nums tracking-tight">
            {formatMGA(totaux_mouvements.total_debit)}
          </div>
          <div className="text-xs text-text-secondary mt-2 flex items-center justify-between border-t border-border-subtle/50 pt-2">
            <span>Mouvements Débit</span>
            <span className="font-medium text-text-primary tabular-nums">
              {progression_sections
                .filter((s) => s.sens_code === 1)
                .reduce((acc, s) => acc + s.nb_mouvements, 0)}{' '}
              écritures
            </span>
          </div>
        </div>

        {/* Total Crédits / Dépenses */}
        <div className="bg-surface-card rounded-xl border border-border-subtle p-5 shadow-sm">
          <div className="flex items-center justify-between text-text-secondary mb-2">
            <span className="text-xs font-heading font-medium uppercase tracking-wider">
              Dépenses (Crédit)
            </span>
            <div className="p-2 rounded-lg bg-status-info/15 text-status-info">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-sans font-bold text-text-primary tabular-nums tracking-tight">
            {formatMGA(totaux_mouvements.total_credit)}
          </div>
          <div className="text-xs text-text-secondary mt-2 flex items-center justify-between border-t border-border-subtle/50 pt-2">
            <span>Mouvements Crédit</span>
            <span className="font-medium text-text-primary tabular-nums">
              {progression_sections
                .filter((s) => s.sens_code === 2)
                .reduce((acc, s) => acc + s.nb_mouvements, 0)}{' '}
              écritures
            </span>
          </div>
        </div>

        {/* Solde & Écarts */}
        <div className="bg-surface-card rounded-xl border border-border-subtle p-5 shadow-sm">
          <div className="flex items-center justify-between text-text-secondary mb-2">
            <span className="text-xs font-heading font-medium uppercase tracking-wider">
              Solde net & Alertes
            </span>
            <div
              className={`p-2 rounded-lg ${
                totaux_mouvements.nb_ecarts > 0
                  ? 'bg-status-alert/15 text-status-alert'
                  : 'bg-surface-secondary text-text-secondary'
              }`}
            >
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div
            className={`text-2xl font-sans font-bold tabular-nums tracking-tight ${
              soldeNum >= 0 ? 'text-text-primary' : 'text-status-alert'
            }`}
          >
            {formatMGA(totaux_mouvements.solde_mouvements)}
          </div>
          <div className="text-xs mt-2 flex items-center justify-between border-t border-border-subtle/50 pt-2">
            <span>Écarts détectés :</span>
            <span
              className={`font-semibold tabular-nums px-2 py-0.5 rounded-full ${
                totaux_mouvements.nb_ecarts > 0
                  ? 'bg-status-alert/15 text-status-alert'
                  : 'bg-status-success/15 text-status-success'
              }`}
            >
              {totaux_mouvements.nb_ecarts > 0
                ? `${totaux_mouvements.nb_ecarts} anomalie(s)`
                : 'Aucun écart'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Décomposition physique de l'encaisse */}
      <div className="bg-surface-card rounded-xl border border-border-subtle p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-accent" />
            <h3 className="text-base font-heading font-semibold text-text-primary">
              Composition de l'encaisse & Inventaire d'ouverture
            </h3>
          </div>
          <span className="text-xs text-text-secondary">
            Total inventaire initial :{' '}
            <strong className="text-text-primary tabular-nums">
              {formatMGA(encaisse.total_inventaire_depart)}
            </strong>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Espèces */}
          <div className="p-4 rounded-lg bg-surface-secondary/50 border border-border-subtle/60">
            <div className="flex items-center justify-between text-xs text-text-secondary mb-1">
              <span className="font-medium">Réserve numéraire (espèces)</span>
              <Coins className="w-4 h-4 text-paoma-blue dark:text-accent" />
            </div>
            <div className="text-lg font-sans font-bold text-text-primary tabular-nums">
              {formatMGA(encaisse.reserve_numeraire_depart)}
            </div>
            <p className="text-xs text-text-secondary/80 mt-1">
              Fonds de roulement initial en caisse
            </p>
          </div>

          {/* Valeurs Postales */}
          <div className="p-4 rounded-lg bg-surface-secondary/50 border border-border-subtle/60">
            <div className="flex items-center justify-between text-xs text-text-secondary mb-1">
              <span className="font-medium">Valeurs postales</span>
              <Stamp className="w-4 h-4 text-status-info" />
            </div>
            <div className="text-lg font-sans font-bold text-text-primary tabular-nums">
              {formatMGA(encaisse.valeurs_postales_depart)}
            </div>
            <p className="text-xs text-text-secondary/80 mt-1">
              Stock de valeurs et timbres postaux
            </p>
          </div>

          {/* Timbres Fiscaux */}
          <div className="p-4 rounded-lg bg-surface-secondary/50 border border-border-subtle/60">
            <div className="flex items-center justify-between text-xs text-text-secondary mb-1">
              <span className="font-medium">Timbres fiscaux</span>
              <FileSpreadsheet className="w-4 h-4 text-status-success" />
            </div>
            <div className="text-lg font-sans font-bold text-text-primary tabular-nums">
              {formatMGA(encaisse.timbres_fiscaux_depart)}
            </div>
            <p className="text-xs text-text-secondary/80 mt-1">
              Stock fiscal confié en gestion
            </p>
          </div>
        </div>

        {/* Flux d'encaisse du mois */}
        <div className="mt-4 pt-4 border-t border-border-subtle flex flex-wrap items-center justify-between gap-4 text-xs text-text-secondary">
          <div className="flex items-center gap-4 flex-wrap">
            <span>
              Entrées constatées :{' '}
              <strong className="text-status-success tabular-nums font-semibold">
                +{formatMGA(encaisse.total_entrees_encaisse)}
              </strong>
            </span>
            <span>•</span>
            <span>
              Sorties constatées :{' '}
              <strong className="text-status-alert tabular-nums font-semibold">
                -{formatMGA(encaisse.total_sorties_encaisse)}
              </strong>
            </span>
          </div>
          <div>
            Variation nette d'encaisse :{' '}
            <strong
              className={`tabular-nums font-bold ${
                parseFloat(encaisse.variation_nette) >= 0 ? 'text-status-success' : 'text-status-alert'
              }`}
            >
              {formatMGA(encaisse.variation_nette)}
            </strong>
          </div>
        </div>
      </div>

      {/* 4. Tableau de progression par Section Comptable (G58) */}
      <div className="bg-surface-card rounded-xl border border-border-subtle overflow-hidden shadow-sm">
        <div className="p-5 border-b border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-paoma-blue dark:text-accent" />
              <h3 className="text-base font-heading font-semibold text-text-primary">
                Progression des écritures par Section du Journal G58
              </h3>
            </div>
            <p className="text-xs font-sans text-text-secondary mt-0.5">
              Suivi en temps réel de la complétude des sections A à E du bordereau comptable officiel
            </p>
          </div>

          <Link to="/saisie">
            <Button size="sm" variant="primary" className="inline-flex items-center gap-1.5 self-start sm:self-auto">
              <span>Saisie G58</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {progression_sections.length === 0 ? (
          <div className="p-8 text-center text-text-secondary text-sm">
            Aucune section comptable configurée pour le moment.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-surface-secondary/40 border-b border-border-subtle text-xs font-heading font-semibold text-text-secondary uppercase tracking-wider">
                  <th className="py-3 px-4">Section</th>
                  <th className="py-3 px-4">Sens</th>
                  <th className="py-3 px-4 text-center">Écritures saisies</th>
                  <th className="py-3 px-4 text-right">Montant Déclaré</th>
                  <th className="py-3 px-4 text-right">Montant Rectifié</th>
                  <th className="py-3 px-4 text-right">Couverture Plan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle/70">
                {progression_sections.map((sec) => {
                  const couverturePct =
                    sec.lignes_total > 0
                      ? Math.round((sec.lignes_utilisees / sec.lignes_total) * 100)
                      : 0;

                  return (
                    <tr
                      key={sec.section_id}
                      className="hover:bg-surface-secondary/30 transition-colors"
                      data-testid={`section-row-${sec.code}`}
                    >
                      <td className="py-3.5 px-4 font-medium text-text-primary">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded bg-paoma-blue/10 text-paoma-blue dark:text-accent font-heading font-bold text-xs flex items-center justify-center">
                            {sec.code}
                          </span>
                          <span>{sec.libelle}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            sec.sens_code === 1
                              ? 'bg-status-success/10 text-status-success'
                              : sec.sens_code === 2
                              ? 'bg-status-info/10 text-status-info'
                              : 'bg-surface-secondary text-text-secondary'
                          }`}
                        >
                          {sec.sens}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center tabular-nums">
                        {sec.nb_mouvements > 0 ? (
                          <span className="font-semibold text-text-primary">
                            {sec.nb_mouvements}
                          </span>
                        ) : (
                          <span className="text-text-secondary/60">0</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right tabular-nums font-medium text-text-primary">
                        {formatMGA(sec.total_montant)}
                      </td>
                      <td className="py-3.5 px-4 text-right tabular-nums font-medium text-text-primary">
                        {formatMGA(sec.total_rectifie)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex flex-col items-end gap-1">
                          <div className="flex items-center gap-1.5 text-xs text-text-secondary tabular-nums">
                            <span>
                              {sec.lignes_utilisees}/{sec.lignes_total}
                            </span>
                            <span className="font-medium text-text-primary">({couverturePct}%)</span>
                          </div>
                          <div className="w-20 bg-surface-secondary rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-paoma-blue dark:bg-accent h-full rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(100, couverturePct)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-surface-secondary/50 font-bold text-text-primary border-t-2 border-border-subtle">
                  <td colSpan={2} className="py-3 px-4">
                    TOTAL GÉNÉRAL DU MOIS
                  </td>
                  <td className="py-3 px-4 text-center tabular-nums">
                    {totaux_mouvements.nb_mouvements}
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums text-status-success">
                    {formatMGA(totaux_mouvements.total_debit)}
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums text-status-info">
                    {formatMGA(totaux_mouvements.total_credit)}
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums">
                    <span className="text-xs font-normal text-text-secondary">Solde : </span>
                    <span className={soldeNum >= 0 ? 'text-text-primary' : 'text-status-alert'}>
                      {formatMGA(totaux_mouvements.solde_mouvements)}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
