import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useReceveurDashboard } from '../../../api/dashboard';
import { formatAriary, formatDate } from '../../../lib/formatters';
import {
  Coins,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Building2,
  ArrowRight,
  RefreshCw,
  Clock,
  Layers,
  ShieldAlert,
} from 'lucide-react';

interface ReceveurDashboardProps {
  bureauId?: number;
}

export default function ReceveurDashboard({ bureauId }: ReceveurDashboardProps) {
  const { user } = useAuth();
  const effectiveBureau = bureauId ?? (user?.bureau_code ?? undefined);

  const { data, isLoading, error, refetch, isFetching } = useReceveurDashboard({
    bureau: effectiveBureau,
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-24 bg-surface-card rounded-xl border border-border-subtle" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-surface-card rounded-xl border border-border-subtle" />
          ))}
        </div>
        <div className="h-64 bg-surface-card rounded-xl border border-border-subtle" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-surface-card rounded-xl border border-status-alert/30 p-8 text-center">
        <ShieldAlert className="w-10 h-10 text-status-alert mx-auto mb-3" />
        <h2 className="text-lg font-heading font-semibold text-text-primary mb-1">
          Impossible de charger le tableau de bord
        </h2>
        <p className="text-sm font-sans text-text-secondary max-w-md mx-auto mb-4">
          {error instanceof Error ? error.message : 'Une erreur réseau est survenue lors de la récupération des données.'}
        </p>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand text-white text-sm font-medium hover:bg-brand-hover transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Réessayer
        </button>
      </div>
    );
  }

  const { bureau, periode, has_active_periode, progression_sections, totaux_mouvements, encaisse } = data;

  return (
    <div className="space-y-6">
      {/* 1. En-tête contextuel Bureau & Période */}
      <div className="bg-surface-card rounded-xl border border-border-subtle p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-lg bg-brand/10 text-brand shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-heading font-bold text-text-primary">
                  {bureau.nom_bureau}
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-mono font-medium bg-surface-secondary text-text-secondary">
                  Codique {bureau.ncodique}
                </span>
                {bureau.classe && (
                  <span className="text-xs px-2 py-0.5 rounded bg-brand/10 text-brand font-medium">
                    Classe {bureau.classe}
                  </span>
                )}
                {bureau.province_nom && (
                  <span className="text-xs text-text-secondary font-sans">
                    • {bureau.province_nom}
                  </span>
                )}
              </div>
              <p className="text-sm font-sans text-text-secondary mt-1">
                {periode ? (
                  <>
                    Gestion du receveur <span className="font-medium text-text-primary">{periode.nom_receveur}</span>
                    {' '}— Période du{' '}
                    <span className="font-medium text-text-primary">{formatDate(periode.date_debut)}</span>
                    {' '}au{' '}
                    <span className="font-medium text-text-primary">{formatDate(periode.date_fin)}</span>
                  </>
                ) : (
                  <span>Aucune période de gestion active.</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            {has_active_periode ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-status-success/15 text-status-success">
                <span className="w-2 h-2 rounded-full bg-status-success animate-pulse" />
                Période en cours (ouverte)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-status-alert/15 text-status-alert">
                Période verrouillée ou absente
              </span>
            )}
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              title="Rafraîchir les données"
              className="p-2 rounded-lg border border-border-subtle hover:bg-surface-secondary text-text-secondary transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Alerte si aucune période ouverte */}
        {!has_active_periode && (
          <div className="mt-4 pt-4 border-t border-border-subtle/60 flex items-center justify-between gap-3 bg-accent/5 p-3 rounded-lg">
            <div className="flex items-center gap-2.5 text-xs text-text-secondary">
              <Calendar className="w-4 h-4 text-accent shrink-0" />
              <span>
                Pour enregistrer de nouvelles écritures comptables G58, ouvrez une période de gestion avec son inventaire initial.
              </span>
            </div>
            <Link
              to="/periodes-gestion"
              className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline shrink-0"
            >
              Gérer les périodes <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>

      {/* 2. Cartes de synthèse clés (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Encaisse physique actuelle */}
        <div className="bg-surface-card rounded-xl border border-border-subtle p-5 shadow-sm">
          <div className="flex items-center justify-between text-text-secondary mb-2">
            <span className="text-xs uppercase tracking-wider font-sans font-medium">Encaisse Actuelle</span>
            <div className="p-2 rounded-lg bg-paoma-blue-soft text-brand">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-sans tabular-nums text-text-primary">
            {formatAriary(encaisse.montant_caisse_actuel)}
          </div>
          <div className="text-xs font-sans text-text-secondary mt-2 flex items-center justify-between">
            <span>Départ : {formatAriary(encaisse.reserve_numeraire_depart, false)}</span>
            <span className={Number(encaisse.variation_nette) >= 0 ? 'text-status-success' : 'text-status-alert'}>
              {Number(encaisse.variation_nette) >= 0 ? '+' : ''}{formatAriary(encaisse.variation_nette, false)}
            </span>
          </div>
        </div>

        {/* Total Débits (Recettes du mois) */}
        <div className="bg-surface-card rounded-xl border border-border-subtle p-5 shadow-sm">
          <div className="flex items-center justify-between text-text-secondary mb-2">
            <span className="text-xs uppercase tracking-wider font-sans font-medium">Recettes (Débit)</span>
            <div className="p-2 rounded-lg bg-status-success/10 text-status-success">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-sans tabular-nums text-status-success">
            {formatAriary(totaux_mouvements.total_debit)}
          </div>
          <div className="text-xs font-sans text-text-secondary mt-2">
            Total des recettes déclarées
          </div>
        </div>

        {/* Total Crédits (Dépenses du mois) */}
        <div className="bg-surface-card rounded-xl border border-border-subtle p-5 shadow-sm">
          <div className="flex items-center justify-between text-text-secondary mb-2">
            <span className="text-xs uppercase tracking-wider font-sans font-medium">Dépenses (Crédit)</span>
            <div className="p-2 rounded-lg bg-status-alert/10 text-status-alert">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-sans tabular-nums text-status-alert">
            {formatAriary(totaux_mouvements.total_credit)}
          </div>
          <div className="text-xs font-sans text-text-secondary mt-2">
            Solde net : <span className="font-medium text-text-primary tabular-nums">{formatAriary(totaux_mouvements.solde_mouvements)}</span>
          </div>
        </div>

        {/* Écritures & Écarts */}
        <div className="bg-surface-card rounded-xl border border-border-subtle p-5 shadow-sm">
          <div className="flex items-center justify-between text-text-secondary mb-2">
            <span className="text-xs uppercase tracking-wider font-sans font-medium">Contrôle Écarts</span>
            <div className={`p-2 rounded-lg ${totaux_mouvements.nb_ecarts > 0 ? 'bg-status-alert/10 text-status-alert' : 'bg-status-success/10 text-status-success'}`}>
              {totaux_mouvements.nb_ecarts > 0 ? (
                <AlertTriangle className="w-4 h-4" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
            </div>
          </div>
          <div className="text-2xl font-bold font-sans tabular-nums text-text-primary">
            {totaux_mouvements.nb_ecarts}{' '}
            <span className="text-xs font-normal text-text-secondary font-sans">
              anomalie{totaux_mouvements.nb_ecarts > 1 ? 's' : ''}
            </span>
          </div>
          <div className="text-xs font-sans text-text-secondary mt-2">
            {totaux_mouvements.nb_mouvements} écriture{totaux_mouvements.nb_mouvements > 1 ? 's' : ''} saisie{totaux_mouvements.nb_mouvements > 1 ? 's' : ''}
            {totaux_mouvements.dernier_mouvement_date && (
              <> • Dernière : {formatDate(totaux_mouvements.dernier_mouvement_date)}</>
            )}
          </div>
        </div>
      </div>

      {/* 3. Tableau de progression de saisie par Section G58 */}
      <div className="bg-surface-card rounded-xl border border-border-subtle overflow-hidden shadow-sm">
        <div className="p-5 border-b border-border-subtle flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-brand" />
            <h2 className="text-base font-heading font-semibold text-text-primary">
              Progression par Section Comptable (G58)
            </h2>
          </div>
          <Link
            to="/saisie"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-brand hover:underline"
          >
            Accéder à la grille de saisie <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {progression_sections.length === 0 ? (
          <div className="p-8 text-center text-sm text-text-secondary">
            Aucune section comptable active trouvée dans le plan comptable.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-surface-secondary/50 text-text-secondary text-xs font-medium border-b border-border-subtle">
                  <th className="py-3 px-4">Section</th>
                  <th className="py-3 px-4">Sens</th>
                  <th className="py-3 px-4 text-center">Écritures</th>
                  <th className="py-3 px-4 text-right">Montant Déclaré</th>
                  <th className="py-3 px-4 text-right">Montant Rectifié</th>
                  <th className="py-3 px-4">Couverture Rubriques</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {progression_sections.map((sec) => {
                  const percent = sec.lignes_total > 0 ? Math.round((sec.lignes_utilisees / sec.lignes_total) * 100) : 0;
                  const isDebit = sec.sens_code === 1;
                  const isCredit = sec.sens_code === 2;

                  return (
                    <tr key={sec.section_id} className="hover:bg-surface-secondary/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded flex items-center justify-center font-heading font-bold text-xs bg-brand/10 text-brand">
                            {sec.code}
                          </span>
                          <span className="font-medium text-text-primary font-sans">
                            {sec.libelle}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-xs px-2 py-0.5 rounded font-medium ${
                            isDebit
                              ? 'bg-status-success/15 text-status-success'
                              : isCredit
                              ? 'bg-status-alert/15 text-status-alert'
                              : 'bg-surface-secondary text-text-secondary'
                          }`}
                        >
                          {sec.sens}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center tabular-nums text-text-primary font-medium">
                        {sec.nb_mouvements}
                      </td>
                      <td className="py-3.5 px-4 text-right tabular-nums text-text-primary font-medium">
                        {formatAriary(sec.total_montant)}
                      </td>
                      <td className="py-3.5 px-4 text-right tabular-nums text-text-primary font-medium">
                        {formatAriary(sec.total_rectifie)}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="w-full max-w-xs flex items-center gap-3">
                          <div className="flex-1 bg-surface-secondary rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-brand h-full rounded-full transition-all duration-300"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <span className="text-xs text-text-secondary tabular-nums shrink-0">
                            {sec.lignes_utilisees}/{sec.lignes_total}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. Détail de l'encaisse & inventaire initial */}
      <div className="bg-surface-card rounded-xl border border-border-subtle p-5 shadow-sm">
        <h3 className="text-sm font-heading font-semibold text-text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-accent" />
          Décomposition de l'Encaisse et Valeurs en Coffre
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div className="p-3.5 rounded-lg bg-surface-secondary/40 border border-border-subtle/50">
            <span className="text-xs text-text-secondary block mb-1">Réserve en numéraire (Espèces)</span>
            <span className="text-base font-bold text-text-primary tabular-nums">
              {formatAriary(encaisse.reserve_numeraire_depart)}
            </span>
          </div>
          <div className="p-3.5 rounded-lg bg-surface-secondary/40 border border-border-subtle/50">
            <span className="text-xs text-text-secondary block mb-1">Valeurs postales (Timbres poste)</span>
            <span className="text-base font-bold text-text-primary tabular-nums">
              {formatAriary(encaisse.valeurs_postales_depart)}
            </span>
          </div>
          <div className="p-3.5 rounded-lg bg-surface-secondary/40 border border-border-subtle/50">
            <span className="text-xs text-text-secondary block mb-1">Timbres fiscaux en stock</span>
            <span className="text-base font-bold text-text-primary tabular-nums">
              {formatAriary(encaisse.timbres_fiscaux_depart)}
            </span>
          </div>
          <div className="p-3.5 rounded-lg bg-brand/5 border border-brand/20">
            <span className="text-xs text-brand block mb-1 font-medium">Total inventaire d'ouverture</span>
            <span className="text-base font-bold text-brand tabular-nums">
              {formatAriary(encaisse.total_inventaire_depart)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
