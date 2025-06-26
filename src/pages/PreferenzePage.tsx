import { useState } from "react";
import {
  ArrowLeft,
  Globe,
  Bell,
  TestTube,
  RotateCcw,
  ChevronRight,
  Home,
  LogOut,
  AlertTriangle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { authManager, isSupabaseAvailable } from "../lib/supabase";

export default function PreferenzePage() {
  const navigate = useNavigate();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showResetFinalConfirm, setShowResetFinalConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const generalSettings = [
    { id: "language", title: "LINGUA", icon: Globe },
    { id: "notifications", title: "NOTIFICHE", icon: Bell },
    { id: "testmode", title: "RISOLUZIONI", icon: TestTube },
    { id: "reset", title: "RESET", icon: RotateCcw },
  ];

  const handleLogout = async () => {
    const success = await authManager.signOut();
    if (success) {
      navigate('/');
    }
  };

  const handleReset = async () => {
    setIsResetting(true);
    try {
      if (!isSupabaseAvailable || !authManager.isAuthenticated()) {
        throw new Error('Supabase non configurato o utente non autenticato');
      }

      const userId = authManager.getUserId();
      if (!userId) {
        throw new Error('ID utente non disponibile');
      }

      const { supabase } = await import('../lib/supabase');

      // Elimina tutti i vini dell'utente
      const { error: winesError } = await supabase!
        .from('giacenze')
        .delete()
        .eq('user_id', userId);

      if (winesError) {
        console.error('Errore nell\'eliminazione vini:', winesError);
        throw winesError;
      }

      // Elimina tutti i fornitori dell'utente
      const { error: suppliersError } = await supabase!
        .from('fornitori')
        .delete()
        .eq('user_id', userId);

      if (suppliersError) {
        console.error('Errore nell\'eliminazione fornitori:', suppliersError);
        throw suppliersError;
      }

      console.log('Reset completato con successo');

      // Chiudi i modali e torna alla home
      setShowResetFinalConfirm(false);
      setShowResetConfirm(false);
      navigate('/');

    } catch (error) {
      console.error('Errore durante il reset:', error);
      alert('Errore durante il reset dei dati. Riprova.');
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
              src="/logo 2 CCV.png"
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

      <main className="flex-1 flex flex-col max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {generalSettings.map((setting) => {
            const IconComponent = setting.icon;
            return (
              <div
                key={setting.id}
                className="bg-gray-800/50 border border-gray-700 p-3 rounded-xl text-left transition-all duration-200 group hover:bg-gray-700/50 hover:border-gray-600 cursor-pointer"
                onClick={() => {
                  console.log(`Clicked on ${setting.id}`);
                  if (setting.id === 'reset') {
                    console.log('Opening reset confirmation...');
                    setShowResetConfirm(true);
                  } else if (setting.id === 'language') {
                    // Placeholder per funzionalità lingua
                    alert('Funzionalità lingua in sviluppo');
                  } else if (setting.id === 'notifications') {
                    // Placeholder per funzionalità notifiche
                    alert('Funzionalità notifiche in sviluppo');
                  } else if (setting.id === 'testmode') {
                    // Placeholder per funzionalità test
                    alert('Funzionalità test in sviluppo');
                  }
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-700/50 rounded-lg group-hover:bg-gray-600/50 transition-colors">
                    <IconComponent className="h-4 w-4 text-gray-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-cream">
                      {setting.title}
                    </h3>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-500 group-hover:text-gray-400 transition-colors" />
                </div>
              </div>
            );
          })}
        </div>

        {isSupabaseAvailable && (
          <div className="mt-8">
            <button
              onClick={handleLogout}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <LogOut className="h-5 w-5" />
              DISCONNETTI
            </button>
          </div>
        )}

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

      {/* Primo messaggio di conferma reset */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-lg w-full max-w-md">
            <div className="p-6 text-center">
              <div className="w-12 h-12 mx-auto mb-4 bg-red-600 rounded-full flex items-center justify-center">
                <RotateCcw className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-cream mb-2">Reset Completo</h3>
              <p className="text-gray-300 mb-6">
                Sei sicuro di voler resettare tutti i dati? Questa operazione eliminerà:
              </p>
              <ul className="text-left text-gray-300 mb-6 space-y-1">
                <li>• Tutti i vini del tuo inventario</li>
                <li>• Tutti i fornitori</li>
                <li>• Tutte le giacenze</li>
              </ul>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 px-4 py-2 bg-gray-700 text-cream rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Annulla
                </button>
                <button
                  onClick={() => {
                    console.log('First confirmation accepted, showing final confirmation...');
                    setShowResetConfirm(false);
                    setShowResetFinalConfirm(true);
                  }}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Continua
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Secondo messaggio di conferma finale */}
      {showResetFinalConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-red-500 rounded-lg w-full max-w-md">
            <div className="p-6 text-center">
              <div className="w-12 h-12 mx-auto mb-4 bg-red-700 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-red-400 mb-2">ATTENZIONE!</h3>
              <p className="text-gray-300 mb-4">
                Questa operazione è <strong className="text-red-400">IRREVERSIBILE</strong>.
              </p>
              <p className="text-gray-300 mb-6">
                Tutti i tuoi dati verranno eliminati definitivamente. Sei assolutamente sicuro?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowResetFinalConfirm(false)}
                  className="flex-1 px-4 py-2 bg-gray-700 text-cream rounded-lg hover:bg-gray-600 transition-colors"
                  disabled={isResetting}
                >
                  No, annulla
                </button>
                <button
                  onClick={() => {
                    console.log('Final confirmation accepted, starting reset...');
                    handleReset();
                  }}
                  disabled={isResetting}
                  className="flex-1 px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isResetting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Resettando...
                    </>
                  ) : (
                    'Sì, elimina tutto'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}