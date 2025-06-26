import { useState } from "react";
import {
  ArrowLeft,
  User,
  Settings,
  Database,
  ChevronRight,
  Truck,
  Home
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { authManager } from "../lib/supabase";
import AccountSection from "../components/AccountSection";
import AddSupplierModal from "../components/AddSupplierModal";
import EditSupplierModal from "../components/EditSupplierModal";
import { useSuppliers, Supplier } from "../hooks/useSuppliers";

export default function SettingsPage() {
  const navigate = useNavigate()
  const [currentSection, setCurrentSection] = useState<string | null>(null);
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [showEditSupplierModal, setShowEditSupplierModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const { suppliers, isLoading, error, refreshSuppliers } = useSuppliers();

  const settingsSections = [
    { id: "account", title: "ACCOUNT", icon: User },
    { id: "database", title: "ARCHIVIO VINI", icon: Database },
  ];

  const handleEditSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setShowEditSupplierModal(true);
  };

  if (currentSection === "account") {
    return <AccountSection onBack={() => setCurrentSection(null)} />;
  }

  if (currentSection === "database") {
    return (
      <div
        className="min-h-screen overflow-y-auto flex flex-col"
        style={{
          background:
            "linear-gradient(to bottom right, #1f0202, #2d0505, #1f0202)",
        }}
      >
        <header className="border-b border-red-900/30 bg-black/30 backdrop-blur-sm flex-shrink-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              <button
                onClick={() => setCurrentSection(null)}
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
              <div className="w-10"></div>
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-4xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 md:py-8 w-full">
          <div className="text-center py-12">
            <Database className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-cream mb-2">ARCHIVIO VINI</h2>
            <p className="text-gray-400">Sezione in costruzione</p>
          </div>
        </main>
      </div>
    );
  }

  if (currentSection === "suppliers") {
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
                onClick={() => setCurrentSection(null)}
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
                  <Truck className="h-4 w-4 text-gray-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-cream">
                    NUOVO FORNITORE
                  </h3>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-500 group-hover:text-gray-400 transition-colors" />
              </div>
            </div>

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
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex-1"></div>

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

        <AddSupplierModal
          isOpen={showAddSupplierModal}
          onClose={() => setShowAddSupplierModal(false)}
          onSupplierAdded={() => {
            refreshSuppliers();
            setShowAddSupplierModal(false);
          }}
        />

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
      </div>
    );
  }

  if (currentSection === "general") {
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
              <div className="flex items-center justify-between w-full">
                <button
                  onClick={() => setCurrentSection(null)}
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
                  src="/logo 2 CCV.png"
                  alt="WINENODE"
                  className="h-32 w-auto object-contain"
                />
                <div className="w-10"></div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 flex flex-col max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full overflow-hidden">
          <div className="text-center py-12">
            <Settings className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-cream mb-2">PREFERENZE</h2>
            <p className="text-gray-400">Sezione in costruzione</p>
          </div>

          <div className="flex-1"></div>

          <div className="mt-auto text-center">
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
      </div>
    );
  }

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
            <div className="flex items-center justify-between w-full">
              <button
                  onClick={() => navigate("/")}
                  className="p-2 text-white hover:text-cream hover:bg-white/10 rounded-full transition-all duration-200 hover:scale-105"
                  title="Torna alla home"
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
                onClick={() => navigate("/")}
                className="p-2 text-white hover:text-cream hover:bg-gray-800 rounded-lg transition-colors"
                title="Vai alla home"
                style={{
                  filter: "brightness(1.2)",
                  color: "#ffffff"
                }}
              >
                <Home className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {settingsSections.map((section) => {
            const IconComponent = section.icon;
            return (
              <div
                key={section.id}
                className="bg-gray-800/50 border border-gray-700 p-3 rounded-xl text-left transition-all duration-200 group hover:bg-gray-700/50 hover:border-gray-600 cursor-pointer"
                onClick={() => {
                  if (section.id === "account") {
                    navigate('/settings/account');
                  } else if (section.id === "suppliers") {
                    navigate('/settings/fornitori');
                  } else if (section.id === "database") {
                    navigate('/settings/archivi');
                  } else if (section.id === "general") {
                    navigate('/settings/preferenze');
                  } else {
                    setCurrentSection(section.id);
                  }
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-700/50 rounded-lg group-hover:bg-gray-600/50 transition-colors">
                    <IconComponent className="h-4 w-4 text-gray-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-cream">
                      {section.title}
                    </h3>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-500 group-hover:text-gray-400 transition-colors" />
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex-1"></div>

        <div className="mt-auto text-center">
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
    </div>
  )
}