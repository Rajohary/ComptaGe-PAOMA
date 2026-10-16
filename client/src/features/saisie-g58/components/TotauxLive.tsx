import React from 'react';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

interface TotauxLiveProps {
  /** Montant total en direct saisi pour la section en cours */
  sectionTotalLive?: number;
  /** Code de la section affichée (ex: 'A', 'B', 'D') */
  sectionCode?: string;
  /** Libellé de la section */
  sectionLibelle?: string;
  /** Sens comptable de la section : 1 = Débit, 2 = Crédit */
  sens?: number;
  /** Totaux généraux consolidés */
  totalDebit?: number;
  totalCredit?: number;
  /** Nombre d'écritures saisies sur la section */
  count?: number;
  /** Mode compact ou complet */
  compact?: boolean;
}

export const TotauxLive: React.FC<TotauxLiveProps> = ({
  sectionTotalLive = 0,
  sectionCode = 'A',
  sectionLibelle = 'Section active',
  sens = 1,
  totalDebit,
  totalCredit,
  count = 0,
  compact = false,
}) => {
  const isDebit = sens === 1;

  if (compact) {
    return (
      <div
        data-testid="totaux-live-compact"
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border-subtle bg-surface-secondary/60 text-xs font-sans transition-all duration-200"
      >
        <span className="text-text-secondary font-medium">Total Section {sectionCode} :</span>
        <span
          data-testid="live-section-sum"
          className={`font-mono font-bold ${isDebit ? 'text-brand' : 'text-status-alert'}`}
        >
          {sectionTotalLive.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} Ar
        </span>
      </div>
    );
  }

  const netBalance = (totalDebit ?? 0) - (totalCredit ?? 0);

  return (
    <div
      data-testid="totaux-live-card"
      className="bg-surface-card border border-border-subtle rounded-xl p-4 sm:p-5 shadow-xs space-y-3 transition-all duration-200"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-subtle pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                isDebit ? 'bg-brand/10 text-brand' : 'bg-status-alert/10 text-status-alert'
              }`}
            >
              {isDebit ? 'Débit' : 'Crédit'}
            </span>
            <h4 className="text-sm font-heading font-bold text-text-primary">
              Section {sectionCode} — {sectionLibelle}
            </h4>
          </div>
          <p className="text-xs font-sans text-text-secondary mt-0.5">
            Calcul en temps réel sans soumission requise ({count} écriture{count > 1 ? 's' : ''})
          </p>
        </div>

        {/* Montant total en direct de la section */}
        <div className="text-left sm:text-right">
          <div className="text-[11px] font-sans text-text-secondary">Total cumulé Section {sectionCode}</div>
          <div
            data-testid="live-section-sum"
            className={`font-mono text-xl sm:text-2xl font-bold tracking-tight transition-colors duration-150 ${
              isDebit ? 'text-brand' : 'text-status-alert'
            }`}
          >
            {sectionTotalLive.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}{' '}
            <span className="text-xs font-sans font-normal text-text-secondary">Ar</span>
          </div>
        </div>
      </div>

      {/* Totaux généraux consolidés si fournis */}
      {(totalDebit !== undefined || totalCredit !== undefined) && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          <div className="bg-surface-secondary/40 p-2.5 rounded-lg border border-border-subtle">
            <div className="flex items-center justify-between text-[11px] font-sans text-text-secondary">
              <span>Total Débits (Journal)</span>
              <TrendingUp className="w-3.5 h-3.5 text-brand" />
            </div>
            <div data-testid="live-total-debit" className="font-mono text-sm font-bold text-brand mt-1">
              {(totalDebit ?? 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} Ar
            </div>
          </div>

          <div className="bg-surface-secondary/40 p-2.5 rounded-lg border border-border-subtle">
            <div className="flex items-center justify-between text-[11px] font-sans text-text-secondary">
              <span>Total Crédits (Journal)</span>
              <TrendingDown className="w-3.5 h-3.5 text-status-alert" />
            </div>
            <div data-testid="live-total-credit" className="font-mono text-sm font-bold text-status-alert mt-1">
              {(totalCredit ?? 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} Ar
            </div>
          </div>

          <div className="bg-surface-secondary/40 p-2.5 rounded-lg border border-border-subtle">
            <div className="flex items-center justify-between text-[11px] font-sans text-text-secondary">
              <span>Solde net calculé</span>
              <DollarSign className="w-3.5 h-3.5 text-accent" />
            </div>
            <div data-testid="live-solde-net" className="font-mono text-sm font-bold text-text-primary mt-1">
              {netBalance >= 0 ? '+' : ''}
              {netBalance.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} Ar
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
