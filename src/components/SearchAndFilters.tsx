
import React from 'react';
import { Search, Filter, FileText, Zap } from 'lucide-react';

interface SearchAndFiltersProps {
  filters: {
    tipologia: string;
    search: string;
    fornitore: string;
  };
  fontSize: number;
  onFiltersChange: (filters: any) => void;
  onFontSizeChange: (size: number) => void;
}

export default function SearchAndFilters({
  filters,
  fontSize,
  onFiltersChange,
  onFontSizeChange
}: SearchAndFiltersProps) {
  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value });
  };

  const handleFornitoreChange = (value: string) => {
    onFiltersChange({ ...filters, fornitore: value });
  };

  

  

  return (
    <div className="bg-black/20 border border-red-900/30 rounded-lg p-3 mb-3 backdrop-blur-sm">
      <div className="flex flex-wrap gap-3 items-center">
        {/* Search Input */}
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cerca vino, produttore, regione..."
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
            style={{ fontSize: `${fontSize}px` }}
          />
        </div>

        {/* Fornitore Filter */}
        <div className="min-w-[150px]">
          <select
            value={filters.fornitore}
            onChange={(e) => handleFornitoreChange(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            style={{ fontSize: `${fontSize}px` }}
          >
            <option value="">Tutti i fornitori</option>
            <option value="BOLOGNA VINI">BOLOGNA VINI</option>
            <option value="ALTRO">ALTRO</option>
          </select>
        </div>

        

        {/* Font Size Controls */}
        <div className="flex items-center gap-2 bg-gray-800/50 border border-gray-600 rounded-lg px-3 py-2">
          <button
            onClick={() => onFontSizeChange(Math.max(10, fontSize - 1))}
            className="text-white hover:text-amber-400 transition-colors"
            title="Riduci dimensione testo"
          >
            <Zap className="h-4 w-4" />
          </button>
          <span className="text-white text-sm min-w-[24px] text-center">
            {fontSize}
          </span>
          <button
            onClick={() => onFontSizeChange(Math.min(20, fontSize + 1))}
            className="text-white hover:text-amber-400 transition-colors"
            title="Aumenta dimensione testo"
          >
            <Zap className="h-4 w-4" />
          </button>
        </div>

        {/* Excel Button */}
        <button
          className="flex items-center gap-2 px-4 py-2 bg-green-700 hover:bg-green-800 text-white rounded-lg transition-colors"
          onClick={() => window.open("https://docs.google.com/spreadsheets/d/1slvYCYuQ78Yf9fsRL1yR5xkW2kshOcQVe8E2HsvGZ8Y/edit?usp=sharing", "_blank")}
          title="Apri Google Sheet"
        >
          <FileText className="h-4 w-4" />
          EXCEL
        </button>
      </div>

      {/* Active Filters Display */}
      {(filters.search || filters.fornitore || filters.tipologia) && (
        <div className="mt-3 pt-3 border-t border-gray-600">
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="text-gray-300">Filtri attivi:</span>
            {filters.search && (
              <span className="bg-amber-600/20 text-amber-400 px-2 py-1 rounded">
                Ricerca: {filters.search}
              </span>
            )}
            {filters.fornitore && (
              <span className="bg-blue-600/20 text-blue-400 px-2 py-1 rounded">
                Fornitore: {filters.fornitore}
              </span>
            )}
            
          </div>
        </div>
      )}
    </div>
  );
}
