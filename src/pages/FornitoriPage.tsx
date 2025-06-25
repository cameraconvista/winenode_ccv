
import { useState } from "react";
import {
  ArrowLeft,
  Truck,
  ChevronRight,
  Plus,
  Edit,
  Home,
  Trash2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import AddSupplierModal from "../components/AddSupplierModal";
import EditSupplierModal from "../components/EditSupplierModal";
import { useSuppliers, Supplier } from "../hooks/useSuppliers";
import { supabase, authManager, isSupabaseAvailable } from "../lib/supabase";

export default function FornitoriPage() {
  const navigate = useNavigate();
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [showEditSupplierModal, setShowEditSupplierModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const { suppliers, isLoading, error, refreshSuppliers } = useSuppliers();

  const handleEditSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setShowEditSupplierModal(true);
  };

  const handleResetSuppliers = async () => {
    if (!isSupabaseAvailable || !authManager.isAuthenticated()) {
      alert('Errore di autenticazione');
      return;
    }

    const userId = authManager.getUserId();
    if (!userId) {
      alert('ID utente non disponibile');
      return;
    }

    setIsResetting(true);

    try {
      // Elimina tutti i fornitori dell'utente
      const { error: suppliersError } = await supabase!
        .from('fornitori')
        .delete()
        .eq('user_id', userId);

      if (suppliersError) {
        console.error('Errore nell\'eliminazione fornitori:', suppliersError);
        throw suppliersError;
      }

      console.log('Reset fornitori completato con successo');

      // Aggiorna la lista e chiudi il modal
      refreshSuppliers();
      setShowResetConfirm(false);

    } catch (error) {
      console.error('Errore durante il reset fornitori:', error);
      alert('Errore durante il reset dei fornitori. Riprova.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div
      className="h-screen max-h-screen overflow-hidden flex flex-col"
      style={{
        background:
          "linear-gradient(to bottom right, #1f0202, #2d0505, #1f0202)",
      }}
    >
      <header className="border-b border-red-900/30 bg-black/30 backdrop-blur-sm flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <button
              onClick={() => navigate('/settings')}
              className="p-2 text-white hover:text-cream hover:bg-white/10 rounded-full transition-all duration-200 hover:scale-105"
              title="Torna alle impostazioni"
              style={{
                filter: "brightness(1.3)",
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255, 255, 255, 0.2)"
              }}
            >
              <svg 
                className="h-6 w-6" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>
            <img
              src="/logo2.png"
              alt="WINENODE"
              className="h-32 w-auto object-contain"
            />
            <button
              onClick={() => navigate('/')}
              className="p-2 text-white hover:bg-gray-700 rounded-lg transition-colors"
              title="Torna alla home"
            >
              <Home className="h-6 w-6" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full overflow-hidden">
        <div className="space-y-3">
          <div
            className="bg-gray-800/50 border border-gray-700 p-4 rounded-xl text-left transition-all duration-200 group hover:bg-gray-700/50 hover:border-gray-600 cursor-pointer"
            onClick={() => setShowAddSupplierModal(true)}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-700/50 rounded-lg group-hover:bg-gray-600/50 transition-colors">
                <Plus className="h-4 w-4 text-gray-300" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-cream">
                  NUOVO FORNITORE
                </h3>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-500 group-hover:text-gray-400 transition-colors" />
            </div>
          </div>

          {/* Pulsante Reset Fornitori */}
          {suppliers.length > 0 && (
            <div
              className="bg-red-800/30 border border-red-700/50 p-4 rounded-xl text-left transition-all duration-200 group hover:bg-red-700/30 hover:border-red-600/50 cursor-pointer"
              onClick={() => setShowResetConfirm(true)}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-700/50 rounded-lg group-hover:bg-red-600/50 transition-colors">
                  <Trash2 className="h-4 w-4 text-red-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-red-300">
                    RESET FORNITORI
                  </h3>
                  <p className="text-xs text-red-400/70">
                    Elimina tutti i fornitori
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-red-500 group-hover:text-red-400 transition-colors" />
              </div>
            </div>
          )}

          {/* Elenco fornitori */}
          <div className="mt-6 space-y-2">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Fornitori Attivi
            </h4>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-gray-600 border-t-amber-500 rounded-full animate-spin"></div>
                <span className="ml-2 text-gray-500">Caricamento fornitori...</span>
              </div>
            ) : error ? (
              <div className="bg-red-500/20 border border-red-500/30 text-red-300 p-3 rounded-lg text-sm">
                {error}
              </div>
            ) : suppliers.length === 0 ? (
              <div className="text-center py-8">
                <Truck className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500">Nessun fornitore attivo</p>
                <p className="text-gray-600 text-sm">Aggiungi il tuo primo fornitore!</p>
              </div>
            ) : (
              suppliers.map((supplier) => (
                <div
                  key={supplier.id}
                  className="bg-gray-800/30 border border-gray-700/50 p-3 rounded-lg text-left transition-all duration-200 group hover:bg-gray-700/30 hover:border-gray-600/50 cursor-pointer"
                  onClick={() => handleEditSupplier(supplier)}
                  title="Clicca per modificare le informazioni del fornitore"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-gray-700/30 rounded-md">
                      <Truck className="h-3.5 w-3.5 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="text-sm font-medium text-cream uppercase">
                        {supplier.nome.toUpperCase()}
                      </h5>
                    </div>
                    <div className="p-1.5 text-gray-500 rounded-md">
                      <Edit className="h-3.5 w-3.5" />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex-1"></div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <div className="text-gray-400" style={{ fontSize: "8px" }}>
            <div className="mb-1">Versione: 1.0.0</div>
            <div>
              Ultimo aggiornamento: {new Date().toLocaleDateString("it-IT")} -{" "}
              {new Date().toLocaleTimeString("it-IT", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        </div>
      </main>

      {/* Modale Nuovo Fornitore */}
      <AddSupplierModal
        isOpen={showAddSupplierModal}
        onClose={() => setShowAddSupplierModal(false)}
        onSupplierAdded={() => {
          refreshSuppliers();
          setShowAddSupplierModal(false);
        }}
      />

      {/* Modale Modifica Fornitore */}
      <EditSupplierModal
        isOpen={showEditSupplierModal}
        onClose={() => {
          setShowEditSupplierModal(false);
          setSelectedSupplier(null);
        }}
        onSupplierUpdated={() => {
          refreshSuppliers();
          setShowEditSupplierModal(false);
          setSelectedSupplier(null);
        }}
        supplier={selectedSupplier}
      />

      {/* Modal Conferma Reset Fornitori */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg max-w-md w-full p-6 border border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-700/20 rounded-lg">
                <Trash2 className="h-5 w-5 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">
                Conferma Reset Fornitori
              </h3>
            </div>
            
            <p className="text-gray-300 mb-6">
              Sei sicuro di voler eliminare <strong>tutti i fornitori</strong>? 
              Questa operazione non può essere annullata.
            </p>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowResetConfirm(false)}
                disabled={isResetting}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                Annulla
              </button>
              <button
                onClick={handleResetSuppliers}
                disabled={isResetting}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isResetting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Eliminazione...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Elimina Tutto
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
