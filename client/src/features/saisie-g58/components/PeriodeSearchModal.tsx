import React, { useState, useMemo } from 'react';
import type { PeriodeGestion } from '../../../types';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { formatDate, formatAriary } from '../../../lib/formatters';
import {
  Calendar,
  Search,
  CheckCircle2,
  Clock,
  Lock,
  User,
  Building2,
  Coins,
  ArrowRight,
  Filter,
} from 'lucide-react';

interface PeriodeSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  periodes: PeriodeGestion[];
  selectedPeriodeId: number;
  onSelectPeriode: (periode: PeriodeGestion) => void;
  bureauName?: string;
}

export const PeriodeSearchModal: React.FC<PeriodeSearchModalProps> = ({
  isOpen,
  onClose,
  periodes,
  selectedPeriodeId,
  onSelectPeriode,
  bureauName,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'CLOSED'>('ALL');
  const [yearFilter, setYearFilter] = useState<string>('ALL');

  // Extraire les années disponibles
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    periodes.forEach((p) => {
      if (p.date_debut) {
        years.add(p.date_debut.slice(0, 4));
      }
    });
    return Array.from(years).sort().reverse();
  }, [periodes]);

  // Filtrer les périodes
  const filteredPeriodes = useMemo(() => {
    return periodes.filter((p) => {
      // Filtre statut
      if (statusFilter === 'ACTIVE' && p.cloturee) return false;
      if (statusFilter === 'CLOSED' && !p.cloturee) return false;

      // Filtre année
      if (yearFilter !== 'ALL' && !p.date_debut?.startsWith(yearFilter)) return false;

      // Recherche par mot-clé (date, mois, receveur, codique)
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const receveur = (p.nom_receveur || '').toLowerCase();
        const dateDebut = p.date_debut || '';
        const dateFin = p.date_fin || '';
        const dateDebutFr = formatDate(p.date_debut).toLowerCase();
        const dateFinFr = formatDate(p.date_fin).toLowerCase();
        const bureauNom = (p.bureau_detail?.nom_bureau || '').toLowerCase();
        const ncodique = String(p.bureau_detail?.ncodique || p.bureau || '');

        const matches =
          receveur.includes(query) ||
          dateDebut.includes(query) ||
          dateFin.includes(query) ||
          dateDebutFr.includes(query) ||
          dateFinFr.includes(query) ||
          bureauNom.includes(query) ||
          ncodique.includes(query);

        if (!matches) return false;
      }

      return true;
    });
  }, [periodes, statusFilter, yearFilter, searchTerm]);

  const handleSelect = (periode: PeriodeGestion) => {
    onSelectPeriode(periode);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Rechercher et sélectionner une période de gestion"
    >
      <div className="space-y-4 p-1">
        {/* En-tête info contexte bureau */}
        {bureauName && (
          <div className="flex items-center gap-2 text-xs font-sans text-text-secondary bg-surface-secondary/50 p-2.5 rounded-lg border border-border-subtle">
            <Building2 className="w-3.5 h-3.5 text-brand shrink-0" />
            <span>
              Bureau actif : <strong className="text-text-primary font-medium">{bureauName}</strong>
            </span>
          </div>
        )}

        {/* Barre de recherche rapide */}
        <div className="relative">
          <Search className="w-4 h-4 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            data-testid="input-search-periode-modal"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par date (ex: 2026, 06/2026), receveur..."
            className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm font-sans bg-surface-secondary border border-border-subtle rounded-lg text-text-primary placeholder:text-text-secondary/60 focus:outline-hidden focus:ring-2 focus:ring-accent"
            autoFocus
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-text-secondary hover:text-text-primary p-0.5 cursor-pointer"
              title="Effacer la recherche"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filtres rapides : Statut & Année */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-sans">
          <div className="flex items-center gap-1.5 bg-surface-secondary/70 p-1 rounded-lg border border-border-subtle/60">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-brand text-white font-semibold'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Toutes ({periodes.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('ACTIVE')}
              className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                statusFilter === 'ACTIVE'
                  ? 'bg-status-success text-white font-semibold'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              En cours
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('CLOSED')}
              className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                statusFilter === 'CLOSED'
                  ? 'bg-surface-secondary text-text-primary font-semibold border border-border-subtle'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Clôturées
            </button>
          </div>

          {availableYears.length > 1 && (
            <div className="flex items-center gap-1.5 text-xs text-text-secondary">
              <Filter className="w-3.5 h-3.5 text-accent" />
              <span>Année :</span>
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="text-xs bg-surface-secondary border border-border-subtle rounded px-2 py-1 text-text-primary focus:outline-hidden"
              >
                <option value="ALL">Toutes années</option>
                {availableYears.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Liste des périodes filtrées */}
        <div className="max-h-72 overflow-y-auto space-y-2 pr-1 divide-y divide-border-subtle/30" data-testid="list-periodes-modal">
          {filteredPeriodes.length === 0 ? (
            <div className="p-8 text-center text-xs font-sans text-text-secondary bg-surface-secondary/30 rounded-lg">
              Aucune période ne correspond aux critères de recherche « {searchTerm} ».
            </div>
          ) : (
            filteredPeriodes.map((p) => {
              const isSelected = p.id === selectedPeriodeId;
              const isClosed = p.cloturee;

              return (
                <div
                  key={p.id}
                  onClick={() => handleSelect(p)}
                  data-testid={`periode-item-${p.id}`}
                  className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-3 text-left ${
                    isSelected
                      ? 'border-brand bg-brand/5 shadow-2xs ring-1 ring-brand/30'
                      : 'border-border-subtle hover:border-brand/50 hover:bg-surface-secondary/40'
                  }`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSelect(p);
                    }
                  }}
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-brand shrink-0" />
                      <span className="font-heading font-semibold text-xs sm:text-sm text-text-primary">
                        Du {formatDate(p.date_debut)} au{' '}
                        {p.date_fin ? formatDate(p.date_fin) : 'en cours'}
                      </span>

                      {/* Statut badge */}
                      {isClosed ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-surface-secondary text-text-secondary border border-border-subtle">
                          <Lock className="w-2.5 h-2.5" />
                          Clôturée
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-status-success/15 text-status-success border border-status-success/30">
                          <Clock className="w-2.5 h-2.5 animate-pulse" />
                          Active
                        </span>
                      )}

                      {isSelected && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-brand bg-brand/10 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3 text-brand" />
                          Sélectionnée
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-secondary">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-accent" />
                        <span>{p.nom_receveur}</span>
                      </span>

                      {p.reserve_numeraire && (
                        <span className="flex items-center gap-1 font-mono text-[11px]">
                          <Coins className="w-3 h-3 text-text-secondary/70" />
                          <span>Inventaire : {formatAriary(p.reserve_numeraire)}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <ArrowRight className="w-4 h-4 text-text-secondary/50 group-hover:text-brand shrink-0" />
                </div>
              );
            })
          )}
        </div>

        {/* Pied du modal */}
        <div className="flex items-center justify-between pt-2 border-t border-border-subtle text-xs text-text-secondary">
          <span>{filteredPeriodes.length} période(s) affichée(s)</span>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Fermer
          </Button>
        </div>
      </div>
    </Modal>
  );
};
