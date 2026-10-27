import React, { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import type { PeriodeGestion } from '../../../types';
import { AlertTriangle, Lock, Calendar, Coins, Stamp, FileSpreadsheet } from 'lucide-react';

interface ClotureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (dateFin: string) => Promise<void>;
  periode: PeriodeGestion | null;
  isLoading: boolean;
  errorMessage?: string | null;
}

export const ClotureModal: React.FC<ClotureModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  periode,
  isLoading,
  errorMessage,
}) => {
  const [dateFin, setDateFin] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );

  if (!isOpen || !periode) return null;

  const formatMoney = (val: string | number) => {
    const num = Number(val) || 0;
    return `${num.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MGA`;
  };

  const handleConfirm = () => {
    onConfirm(dateFin);
  };

  return (
    <div className="space-y-5">
      {errorMessage && (
        <div className="p-3 text-sm rounded bg-surface-secondary border border-status-alert text-status-alert flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Avertissement solennel */}
      <div className="p-4 rounded bg-status-alert/10 border border-status-alert/30 text-status-alert space-y-2">
        <div className="flex items-center gap-2 font-heading font-semibold text-base">
          <Lock className="w-5 h-5 flex-shrink-0" />
          <span>Action définitive de clôture comptable</span>
        </div>
        <p className="text-xs font-sans text-text-primary leading-relaxed">
          La clôture d'une période de gestion verrouille définitivement le Journal G58 de ce bureau.
          Aucun mouvement comptable ne pourra plus être ajouté ou modifié après cette opération.
        </p>
      </div>

      {/* Récapitulatif de la période ciblée */}
      <div className="bg-surface-secondary/60 rounded p-4 border border-border-subtle space-y-3">
        <div className="flex items-center justify-between border-b border-border-subtle pb-2">
          <div>
            <span className="text-xs font-sans text-text-secondary uppercase tracking-wider">
              Bureau de poste
            </span>
            <p className="text-sm font-semibold text-text-primary">
              {periode.bureau_detail?.nom_bureau || `Bureau #${periode.bureau}`}
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs font-sans text-text-secondary uppercase tracking-wider">
              Receveur
            </span>
            <p className="text-sm font-semibold text-text-primary">
              {periode.nom_receveur}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-text-secondary">
          <Calendar className="w-3.5 h-3.5 text-accent" />
          <span>
            Période débutée le {periode.date_debut} {periode.date_fin ? `(actuellement fixée au ${periode.date_fin})` : '(en cours)'}
          </span>
        </div>

        {/* Choix de la date de fin effective de gestion */}
        <div className="pt-2 border-t border-border-subtle">
          <Input
            label="Date de fin de gestion (arrêt comptable)"
            type="date"
            required
            min={periode.date_debut}
            value={dateFin}
            onChange={(e) => setDateFin(e.target.value)}
          />
          <p className="text-[11px] font-sans text-text-secondary mt-1">
            Cette date scellera la période et servira de date d'arrêté pour le Journal G58 et la situation comptable.
          </p>
        </div>

        {/* Rappel des montants d'ouverture */}
        <div className="pt-2 border-t border-border-subtle grid grid-cols-3 gap-2 text-xs">
          <div>
            <div className="flex items-center gap-1 text-text-secondary">
              <Coins className="w-3 h-3 text-accent" />
              <span>Numéraire</span>
            </div>
            <p className="font-mono font-semibold text-text-primary tabular-nums mt-0.5">
              {formatMoney(periode.reserve_numeraire)}
            </p>
          </div>
          <div>
            <div className="flex items-center gap-1 text-text-secondary">
              <Stamp className="w-3 h-3 text-accent" />
              <span>Valeurs postales</span>
            </div>
            <p className="font-mono font-semibold text-text-primary tabular-nums mt-0.5">
              {formatMoney(periode.valeurs_postales)}
            </p>
          </div>
          <div>
            <div className="flex items-center gap-1 text-text-secondary">
              <FileSpreadsheet className="w-3 h-3 text-accent" />
              <span>Timbres fiscaux</span>
            </div>
            <p className="font-mono font-semibold text-text-primary tabular-nums mt-0.5">
              {formatMoney(periode.timbres_fiscaux)}
            </p>
          </div>
        </div>
      </div>

      {/* Confirmation et actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-border-subtle">
        <Button
          type="button"
          variant="secondary"
          onClick={onClose}
          disabled={isLoading}
        >
          Annuler
        </Button>
        <Button
          type="button"
          variant="danger"
          onClick={handleConfirm}
          isLoading={isLoading}
        >
          <Lock className="w-4 h-4 mr-1.5" />
          Confirmer la clôture officielle
        </Button>
      </div>
    </div>
  );
};
