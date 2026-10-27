import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LigneComptableSearch } from './components/LigneComptableSearch';
import { BookOpen } from 'lucide-react';

export const PlanComptablePage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* En-tête institutionnel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-subtle pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-sans text-text-secondary uppercase tracking-wider mb-1">
            <BookOpen className="w-4 h-4 text-accent" />
            <span>Nomenclature & Référentiel</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-text-primary">
            Plan comptable des bureaux de poste
          </h1>
          <p className="text-sm font-sans text-text-secondary mt-1 max-w-2xl">
            Consultation et recherche instantanée des comptes et rubriques budgétaires organisés par section (A à E).
          </p>
        </div>
      </div>

      {/* Composant de recherche et exploration du plan comptable */}
      <LigneComptableSearch bureauCode={user?.bureau_code} variant="page" />
    </div>
  );
};
