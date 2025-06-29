import { useState } from 'react'
import { Filter, Settings, Plus, X, Save, Database } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import WineCard from '../components/WineCard'
import FilterModal from '../components/FilterModal'
import WineDetailsModal from '../components/WineDetailsModal'

import { useWines } from '../hooks/useWines'
import { authManager, isSupabaseAvailable, supabase } from '../lib/supabase'

type WineType = {
  id: number;
  name: string;
  type: string;
  supplier: string;
  inventory: number;
  minStock: number;
  price: string;
  vintage: string | null;
  region: string | null;
  description: string | null;
};

export default function HomePage() {
  const navigate = useNavigate()
  const {
    wines,
    suppliers,
    loading,
    error,
    isAuthenticated,
    refreshWines,
    updateWineInventory,
    updateWine
  } = useWines()

  console.log("Vini caricati:", wines)

  const [searchTerm, setSearchTerm] = useState('')
  const [showSearchModal, setShowSearchModal] = useState(false)
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [showWineDetailsModal, setShowWineDetailsModal] = useState(false)
  const [selectedWine, setSelectedWine] = useState<WineType | null>(null)
  const [filters, setFilters] = useState({
    wineType: '',
    supplier: '',
    showAlertsOnly: false
  })
  const [showAddWineModal, setShowAddWineModal] = useState(false)
  const [newWine, setNewWine] = useState({
    name: "",
    type: "rosso",
    price: "",
    minStock: "2",
    supplier: "",
    description: ""
  })
  const [isAddingWine, setIsAddingWine] = useState(false)

  const wineTypes = [
    { value: "rosso", label: "Rosso" },
    { value: "bianco", label: "Bianco" },
    { value: "bollicine", label: "Bollicine" }
  ]

  const handleUpdateInventory = async (wineId: number, newInventory: number) => {
    // Assicurati che la giacenza non sia mai negativa
    const adjustedInventory = Math.max(0, newInventory)
    const success = await updateWineInventory(wineId, adjustedInventory)
    if (!success) {
      console.error('Errore nell\'aggiornamento della giacenza')
    }
  }

  const handleUpdateWine = async (wineId: number, updates: Partial<WineType>) => {
    const success = await updateWine(wineId, updates)
    if (!success) {
      console.error('Errore nell\'aggiornamento del vino')
    }
  }

  const handleWineClick = (wine: WineType) => {
    setSelectedWine(wine)
    setShowWineDetailsModal(true)
  }

  const handleAddWine = async () => {
    if (!newWine.name.trim()) return

    setIsAddingWine(true)
    try {
      if (!isSupabaseAvailable || !authManager.isAuthenticated()) {
        throw new Error('Supabase non configurato o utente non autenticato')
      }

      const userId = authManager.getUserId()
      if (!userId) {
        throw new Error('ID utente non disponibile')
      }

      const { data, error } = await supabase!
        .from('giacenze')
        .insert({
          name: newWine.name,
          type: newWine.type,
          supplier: newWine.supplier || 'Da definire',
          inventory: 0,
          min_stock: parseInt(newWine.minStock) || 2,
          price: newWine.price || '0',
          vintage: null,
          region: null,
          description: newWine.description || null,
          user_id: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error('Errore nell\'aggiunta vino su Supabase:', error)
        throw error
      }

      setNewWine({
        name: "",
        type: "rosso",
        price: "",
        minStock: "2",
        supplier: "",
        description: ""
      })
      setShowAddWineModal(false)

      await refreshWines()
      console.log('Vino aggiunto con successo:', data)
    } catch (error) {
      console.error('Errore nell\'aggiunta del vino:', error)
    } finally {
      setIsAddingWine(false)
    }
  }

  const filteredWines = wines.filter(wine => {
    const matchesType = !filters.wineType || wine.type === filters.wineType
    const matchesSupplier = !filters.supplier || wine.supplier === filters.supplier
    const matchesAlerts = !filters.showAlertsOnly || wine.inventory <= wine.minStock

    return matchesType && matchesSupplier && matchesAlerts
  })

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-cream">Effettua l'accesso per vedere i tuoi vini</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-cream">Caricamento vini...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={refreshWines}
            className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Riprova
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="h-screen max-h-screen overflow-hidden flex flex-col"
      style={{ background: 'linear-gradient(to bottom right, #1f0202, #2d0505, #1f0202)' }}
    >
      <header className="border-b border-red-900/30 bg-black/30 backdrop-blur-sm flex-shrink-0">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex items-center justify-between h-20 sm:h-24">
            <div className="flex items-center justify-between w-full">
              <img src="/logo 2 CCV.png" alt="WINENODE" className="h-32 w-auto object-contain" />
              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  onClick={() => navigate('/settings/archivi')}
                  className="p-2 sm:p-2.5 text-white hover:text-gray-300 transition-colors"
                  aria-label="Archivi"
                  title="Archivi"
                >
                  <Database className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setShowFilterModal(true)}
                  className="p-2 sm:p-2.5 text-cream hover:bg-gray-700 rounded-lg transition-colors"
                  aria-label="Filtri"
                >
                  <Filter className="h-5 w-5" />
                </button>
                <button
                  onClick={() => navigate('/settings')}
                  className="p-2 sm:p-2.5 text-cream hover:bg-gray-700 rounded-lg transition-colors"
                  aria-label="Impostazioni"
                >
                  <Settings className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1 flex flex-col max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-8 w-full overflow-y-auto">
        {filteredWines.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">
              {wines.length === 0 ? 'Nessun vino nel tuo inventario' : 'Nessun vino trovato con i filtri selezionati'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredWines.map(wine => (
              <div
                key={wine.id}
                className="bg-black/20 backdrop-blur-sm border border-red-900/20 rounded-lg p-3 hover:bg-black/30 transition-all duration-200"
              >
                <div className="flex items-center justify-between gap-2">
                  {/* Informazioni vino - una riga compatta */}
                  <div 
                    className="flex-1 cursor-pointer min-w-0"
                    onClick={() => handleWineClick(wine)}
                  >
                    <div className="text-sm text-cream leading-tight truncate">
                      <span className="font-semibold">{wine.name}</span>
                      {wine.description && (
                        <>
                          <span className="text-gray-400 mx-1">·</span>
                          <span className="text-gray-300">{wine.description}</span>
                        </>
                      )}
                      {wine.vintage && (
                        <>
                          <span className="text-gray-400 mx-1">·</span>
                          <span className="text-gray-300">{wine.vintage}</span>
                        </>
                      )}
                      <span className="text-gray-400 mx-1">·</span>
                      <span className={`font-medium ${wine.inventory <= wine.minStock ? 'text-red-400' : 'text-green-400'}`}>
                        {wine.inventory}
                      </span>
                    </div>
                  </div>
                  
                  {/* Controlli giacenza - pulsanti compatti */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpdateInventory(wine.id, wine.inventory - 1);
                      }}
                      disabled={wine.inventory <= 0}
                      className="w-7 h-7 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-full flex items-center justify-center text-sm font-bold transition-colors"
                    >
                      ➖
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpdateInventory(wine.id, wine.inventory + 1);
                      }}
                      className="w-7 h-7 bg-green-600 hover:bg-green-700 text-white rounded-full flex items-center justify-center text-sm font-bold transition-colors"
                    >
                      ➕
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <FilterModal
        open={showFilterModal}
        onOpenChange={setShowFilterModal}
        filters={filters}
        onFiltersChange={setFilters}
      />
      <WineDetailsModal
        wine={selectedWine}
        open={showWineDetailsModal}
        onOpenChange={setShowWineDetailsModal}
        onUpdateWine={handleUpdateWine}
        suppliers={suppliers}
      />
      {!showWineDetailsModal && (
        <button
          onClick={() => setShowAddWineModal(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-black/30 backdrop-blur-sm hover:bg-black/40 text-amber-500 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center z-50 border border-red-900/30"
          title="Aggiungi nuovo vino"
        >
          <Plus className="h-6 w-6" />
        </button>
      )}
      {showAddWineModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-lg w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h3 className="text-xl font-bold text-cream">AGGIUNGI NUOVO VINO</h3>
              <button
                onClick={() => setShowAddWineModal(false)}
                className="text-gray-400 hover:text-cream"
                disabled={isAddingWine}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Nome Vino *</label>
                <input
                  type="text"
                  value={newWine.name}
                  onChange={e => setNewWine(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-cream focus:border-blue-500 focus:outline-none"
                  placeholder="Inserisci il nome del vino"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Colore Vino</label>
                <select
                  value={newWine.type}
                  onChange={e => setNewWine(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-cream focus:border-blue-500 focus:outline-none"
                >
                  <option value="rosso">Rosso</option>
                  <option value="bianco">Bianco</option>
                  <option value="bollicine">Bollicine</option>
                  <option value="rosato">Rosato</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Costo Vino (€)</label>
                  <input
                    type="text"
                    value={newWine.price || ''}
                    onChange={e => setNewWine(prev => ({ ...prev, price: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-cream focus:border-blue-500 focus:outline-none"
                    placeholder="Es: 15.50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Soglia Minima</label>
                  <input
                    type="number"
                    value={newWine.minStock || '2'}
                    onChange={e => setNewWine(prev => ({ ...prev, minStock: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-cream focus:border-blue-500 focus:outline-none"
                    placeholder="2"
                    min="0"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Fornitore</label>
                <select
                  value={newWine.supplier || ''}
                  onChange={e => setNewWine(prev => ({ ...prev, supplier: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-cream focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Seleziona fornitore</option>
                  {suppliers.map((supplier, index) => (
                    <option key={`${supplier}-${index}`} value={supplier}>
                      {supplier}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Descrizione Completa</label>
                <textarea
                  value={newWine.description || ''}
                  onChange={e => setNewWine(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-cream focus:border-blue-500 focus:outline-none resize-none"
                  rows={2}
                  placeholder="Descrizione dettagliata del vino..."
                />
              </div>
            </div>
            <div className="flex gap-2 p-4 border-t border-gray-700">
              <button
                onClick={() => setShowAddWineModal(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-cream rounded px-4 py-2 transition-colors"
                disabled={isAddingWine}
              >
                Annulla
              </button>
              <button
                onClick={handleAddWine}
                disabled={!newWine.name.trim() || isAddingWine}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-cream rounded px-4 py-2 flex items-center justify-center gap-2 transition-colors"
              >
                <Save className="h-4 w-4" />
                {isAddingWine ? 'Aggiungendo...' : 'Salva'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}