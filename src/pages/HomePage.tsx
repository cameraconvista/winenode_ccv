
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Settings, FileText, Upload, Users, RotateCcw, Filter, Search, ChevronDown, Package, Archive } from 'lucide-react';
import WineCard from '../components/WineCard';
import WineDetailsModal from '../components/WineDetailsModal';
import FilterModal from '../components/FilterModal';
import InventoryModal from '../components/InventoryModal';
import { useWines } from '../hooks/useWines';

export interface Wine {
  id: string;
  nome: string;
  tipo: string;
  fornitore: string;
  annata: string;
  note?: string;
  quantita?: number;
  prezzo_acquisto?: number;
  posizione?: string;
  created_at?: string;
  updated_at?: string;
}

export interface FilterOptions {
  tipo: string;
  fornitore: string;
  annata: string;
  showOnlyWithStock: boolean;
}

const HomePage: React.FC = () => {
  const [selectedWine, setSelectedWine] = useState<Wine | null>(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({
    tipo: '',
    fornitore: '',
    annata: '',
    showOnlyWithStock: false
  });

  const { 
    wines, 
    loading, 
    error, 
    suppliers, 
    years, 
    types,
    fetchWines, 
    updateWine, 
    deleteWine 
  } = useWines();

  useEffect(() => {
    fetchWines();
  }, []);

  const filteredWines = wines.filter(wine => {
    const matchesSearch = wine.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         wine.fornitore.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !filters.tipo || wine.tipo === filters.tipo;
    const matchesSupplier = !filters.fornitore || wine.fornitore === filters.fornitore;
    const matchesYear = !filters.annata || wine.annata === filters.annata;
    const matchesStock = !filters.showOnlyWithStock || (wine.quantita && wine.quantita > 0);

    return matchesSearch && matchesType && matchesSupplier && matchesYear && matchesStock;
  });

  const activeFiltersCount = Object.values(filters).filter(filter => 
    typeof filter === 'boolean' ? filter : filter !== ''
  ).length;

  const handleWineClick = (wine: Wine) => {
    setSelectedWine(wine);
  };

  const handleCloseModal = () => {
    setSelectedWine(null);
  };

  const handleUpdateWine = async (updatedWine: Wine) => {
    try {
      await updateWine(updatedWine.id, updatedWine);
      setSelectedWine(null);
      fetchWines();
    } catch (error) {
      console.error('Errore durante l\'aggiornamento del vino:', error);
    }
  };

  const handleDeleteWine = async (wineId: string) => {
    try {
      await deleteWine(wineId);
      setSelectedWine(null);
      fetchWines();
    } catch (error) {
      console.error('Errore durante l\'eliminazione del vino:', error);
    }
  };

  const handleApplyFilters = (newFilters: FilterOptions) => {
    setFilters(newFilters);
    setShowFilterModal(false);
  };

  const handleClearFilters = () => {
    setFilters({
      tipo: '',
      fornitore: '',
      annata: '',
      showOnlyWithStock: false
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-cream">Caricamento vini...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">Errore nel caricamento dei vini</p>
          <button 
            onClick={fetchWines}
            className="px-4 py-2 bg-amber-600 text-cream rounded-lg hover:bg-amber-700 transition-colors"
          >
            Riprova
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <img src="/logoapp.png" alt="WineNode" className="w-12 h-12" />
            <div>
              <h1 className="text-2xl font-bold text-cream">WineNode</h1>
              <p className="text-gray-400 text-sm">Gestione Inventario Vini</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowInventoryModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-700 hover:bg-green-600 text-cream rounded-lg transition-colors"
            >
              <Package className="w-4 h-4" />
              Giacenze
            </button>
            
            <Link
              to="/settings/archivi"
              className="flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-600 text-cream rounded-lg transition-colors"
            >
              <Archive className="w-4 h-4" />
              Archivi
            </Link>
            
            <Link
              to="/settings"
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-cream rounded-lg transition-colors"
            >
              <Settings className="w-4 h-4" />
              Impostazioni
            </Link>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Cerca vini o fornitori..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-cream placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            
            <button
              onClick={() => setShowFilterModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-cream rounded-lg transition-colors relative"
            >
              <Filter className="w-4 h-4" />
              Filtri
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-gray-900 text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {activeFiltersCount > 0 && (
              <button
                onClick={handleClearFilters}
                className="flex items-center gap-2 px-3 py-2 bg-red-700 hover:bg-red-600 text-cream rounded-lg transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Wine Count */}
        <div className="mb-6">
          <p className="text-gray-400">
            Mostrando {filteredWines.length} di {wines.length} vini
            {activeFiltersCount > 0 && (
              <span className="ml-2 text-amber-400">
                (filtri attivi: {activeFiltersCount})
              </span>
            )}
          </p>
        </div>

        {/* Wine Grid */}
        {filteredWines.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg mb-4">
              {wines.length === 0 ? 'Nessun vino trovato' : 'Nessun vino corrisponde ai filtri selezionati'}
            </p>
            {wines.length === 0 && (
              <Link
                to="/settings/archivi/manuale"
                className="inline-flex items-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-700 text-cream rounded-lg transition-colors"
              >
                <Upload className="w-5 h-5" />
                Aggiungi il primo vino
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredWines.map((wine) => (
              <WineCard
                key={wine.id}
                wine={wine}
                onClick={handleWineClick}
              />
            ))}
          </div>
        )}

        {/* Modals */}
        {selectedWine && (
          <WineDetailsModal
            wine={selectedWine}
            onClose={handleCloseModal}
            onUpdate={handleUpdateWine}
            onDelete={handleDeleteWine}
          />
        )}

        {showFilterModal && (
          <FilterModal
            isOpen={showFilterModal}
            onClose={() => setShowFilterModal(false)}
            filters={filters}
            onApplyFilters={handleApplyFilters}
            suppliers={suppliers}
            types={types}
            years={years}
          />
        )}

        {showInventoryModal && (
          <InventoryModal
            isOpen={showInventoryModal}
            onClose={() => setShowInventoryModal(false)}
            wines={wines}
          />
        )}
      </div>
    </div>
  );
};

export default HomePage;
