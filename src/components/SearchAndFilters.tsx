import React from 'react';
import { Button } from '@/components/ui/button';

interface SearchAndFiltersProps {
  filters: {
    tipologia: string;
    search: string;
    fornitore: string;
  };
  modalFilters: {
    fornitore: string;
    tipologie: string[];
    isActive: boolean;
  };
  fontSize: number;
  onFiltersChange: (filters: any) => void;
  onModalFiltersChange: (modalFilters: any) => void;
  onShowFornitoreModal: () => void;
  onFontSizeChange: (size: number) => void;
}

export default function SearchAndFilters({
  filters,
  modalFilters,
  fontSize,
  onFiltersChange,
  onModalFiltersChange,
  onShowFornitoreModal,
  onFontSizeChange
}: SearchAndFiltersProps) {
  return (
    <div className="mb-4 flex items-center justify-between gap-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            placeholder="Cerca vini..."
            value={filters.search}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
            className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-cream placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />

          <button
            onClick={onShowFornitoreModal}
            className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-cream hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500 min-w-[200px] text-left flex items-center justify-between"
          >
            <span>{filters.fornitore || 'Filtra per fornitore...'}</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-3">
          {modalFilters.isActive && (
            <div className="flex items-center gap-2 px-3 py-1 bg-blue-600/20 border border-blue-600/50 rounded-lg text-blue-200 text-sm">
              <span>
                Filtro: {modalFilters.fornitore || 'Tutti i fornitori'}
                {modalFilters.tipologie.length > 0 && modalFilters.tipologie.includes('TUTTE') 
                  ? ' - Tutte le tipologie' 
                  : modalFilters.tipologie.length > 0 
                  ? ` - ${modalFilters.tipologie.length} tipologie` 
                  : ''}
              </span>
              <button
                onClick={() => {
                  onModalFiltersChange({ fornitore: '', tipologie: [], isActive: false });
                  onFiltersChange({ ...filters, fornitore: '' });
                }}
                className="ml-1 hover:text-blue-100"
                title="Rimuovi filtro modale"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {!modalFilters.isActive && filters.fornitore && (
            <div className="flex items-center gap-2 px-3 py-1 bg-amber-600/20 border border-amber-600/50 rounded-lg text-amber-200 text-sm">
              <span>Fornitore: {filters.fornitore}</span>
              <button
                onClick={() => onFiltersChange({ ...filters, fornitore: '' })}
                className="ml-1 hover:text-amber-100"
                title="Rimuovi filtro fornitore"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={() => onFontSizeChange(Math.max(10, fontSize - 5))}
              className="flex items-center justify-center px-2 py-2 bg-[#3A1E18] hover:border-[#A97B50] hover:shadow-md text-[#F5EEDC] rounded-md transition-all text-sm font-bold"
              disabled={fontSize <= 10}
              style={{ opacity: fontSize <= 10 ? 0.5 : 1 }}
            >
              -
            </button>
            <button
              className="flex items-center gap-2 px-3 py-2 bg-[#3A1E18] hover:border-[#A97B50] hover:shadow-md text-[#F5EEDC] transition-all text-sm font-medium rounded-md"
              style={{ cursor: "default" }}
            >
              Aa
            </button>
            <button
              onClick={() => onFontSizeChange(Math.min(24, fontSize + 5))}
              className="flex items-center justify-center px-2 py-2 bg-[#3A1E18] hover:border-[#A97B50] hover:shadow-md text-[#F5EEDC] rounded-md transition-all text-sm font-bold"
              disabled={fontSize >= 24}
              style={{ opacity: fontSize >= 24 ? 0.5 : 1 }}
            >
              +
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => console.log("Esporta")}
          className="flex items-center gap-2 bg-[#3A1E18] text-[#F5EEDC] rounded-md px-3 py-2 text-sm shadow-sm hover:border-[#A97B50] hover:shadow-md transition-all"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Esporta
        </button>

        <Button
          variant="outline"
          className="ml-2 bg-green-700 text-white hover:bg-green-800"
          onClick={() =>
            window.open("https://docs.google.com/spreadsheets/d/1slvYCYuQ78Yf9fsRL1yR5xkW2kshOcQVe8E2HsvGZ8Y/edit?usp=sharing", "_blank")
          }
        >
          EXCEL
        </Button>

        <button
          onClick={() => {
            // Backup logic here
            alert("Backup creato e scaricato con successo!");
          }}
          className="flex items-center gap-2 bg-[#3A1E18] text-[#F5EEDC] rounded-md px-3 py-2 text-sm shadow-sm hover:border-[#A97B50] hover:shadow-md transition-all"
          title="Crea backup dati"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7,10 12,15 17,10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Backup
        </button>
      </div>
    </div>
  );
}