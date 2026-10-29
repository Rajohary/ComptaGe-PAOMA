import React from 'react';
import { Button } from './Button';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export interface PaginationProps {
  currentPage: number;
  totalCount: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
  className?: string;
  itemLabel?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalCount,
  pageSize = 10,
  onPageChange,
  isLoading = false,
  className = '',
  itemLabel = 'enregistrement',
}) => {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  // Toujours afficher même avec 1 seule page si on a des enregistrements, pour indiquer la page et le total
  const startIndex = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, totalCount);

  return (
    <div
      className={`px-4 py-3 border-t border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-3 bg-surface-secondary/30 ${className}`}
      data-testid="pagination-container"
    >
      {/* Information sur les enregistrements et la page courante */}
      <div className="text-xs text-text-secondary flex flex-wrap items-center gap-1.5 font-sans">
        <span>
          Page <strong className="font-semibold text-text-primary">{currentPage}</strong> sur{' '}
          <strong className="font-semibold text-text-primary">{totalPages}</strong>
        </span>
        <span className="text-border-subtle">|</span>
        <span>
          {totalCount > 0 ? (
            <>
              Affichage de <span className="font-mono font-medium text-text-primary">{startIndex}</span> à{' '}
              <span className="font-mono font-medium text-text-primary">{endIndex}</span> sur{' '}
              <span className="font-mono font-semibold text-text-primary">{totalCount}</span> {itemLabel}
              {totalCount > 1 ? 's' : ''}
            </>
          ) : (
            `0 ${itemLabel}`
          )}
        </span>
      </div>

      {/* Boutons de navigation */}
      <div className="flex items-center gap-1 sm:gap-1.5">
        {/* Aller à la première page */}
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={currentPage <= 1 || isLoading}
          title="Première page"
          aria-label="Aller à la première page"
          data-testid="pagination-first-btn"
          className="px-2"
        >
          <ChevronsLeft className="w-4 h-4" />
          <span className="hidden md:inline ml-1 text-xs">Début</span>
        </Button>

        {/* Page précédente */}
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
          disabled={currentPage <= 1 || isLoading}
          title="Page précédente"
          aria-label="Page précédente"
          data-testid="pagination-prev-btn"
        >
          <ChevronLeft className="w-4 h-4 mr-0.5" />
          <span className="text-xs">Précédent</span>
        </Button>

        {/* Indicateur central / badge page */}
        <div className="px-2.5 py-1 text-xs font-mono font-semibold bg-surface-primary border border-border-subtle rounded text-text-primary min-w-[2.2rem] text-center">
          {currentPage}
        </div>

        {/* Page suivante */}
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
          disabled={currentPage >= totalPages || isLoading}
          title="Page suivante"
          aria-label="Page suivante"
          data-testid="pagination-next-btn"
        >
          <span className="text-xs">Suivant</span>
          <ChevronRight className="w-4 h-4 ml-0.5" />
        </Button>

        {/* Aller à la dernière page */}
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage >= totalPages || isLoading}
          title="Dernière page"
          aria-label="Aller à la dernière page"
          data-testid="pagination-last-btn"
          className="px-2"
        >
          <span className="hidden md:inline mr-1 text-xs">Fin</span>
          <ChevronsRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
