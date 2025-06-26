import { useState, useEffect } from 'react'
import { Mail, Lock, UserCircle, LogOut, ArrowLeft, Home, Bell, RotateCcw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase, isSupabaseAvailable } from '../lib/supabase'
import ProfileManagementModal from '../components/ProfileManagementModal'

export default function AccountPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState<any>(null)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)

  useEffect(() => {
    const getCurrentUser = async () => {
      if (!isSupabaseAvailable || !supabase) return

      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
      }
    }
    getCurrentUser()
  }, [])

  const handleLogout = async () => {
    try {
      if (!isSupabaseAvailable || !supabase) {
        // Se Supabase non è disponibile, pulisce localStorage e ricarica
        localStorage.clear()
        sessionStorage.clear()
        window.location.href = '/'
        return
      }

      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Errore durante il logout:', error)
        // Anche se c'è un errore, prova a pulire lo storage locale
        localStorage.clear()
        sessionStorage.clear()
      }

      // Reindirizza sempre alla home dopo il logout
      window.location.href = '/'
    } catch (error) {
      console.error('Errore durante il logout:', error)
      // In caso di errore, pulisce comunque lo storage e reindirizza
      localStorage.clear()
      sessionStorage.clear()
      window.location.href = '/'
    }
  }

  const handleOptionClick = (optionId: string) => {
    if (optionId === 'logout') {
      handleLogout()
    } else if (optionId === 'email') {
      handleEmailChange()
    } else if (optionId === 'password') {
      handlePasswordChange()
    } else if (optionId === 'profile') {
      handleProfileManagement()
    } else if (optionId === 'notifications') {
      handleNotifications()
    } else if (optionId === 'reset') {
      handleReset()
    }
  }

  const handleEmailChange = () => {
    const newEmail = prompt('Inserisci il nuovo indirizzo email:', user?.email || '')
    if (newEmail && newEmail !== user?.email) {
      if (!isSupabaseAvailable || !supabase) {
        alert('Modifica email non disponibile - servizio di autenticazione non configurato')
        return
      }

      // Validazione email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(newEmail)) {
        alert('⚠️ Inserisci un indirizzo email valido')
        return
      }

      supabase.auth.updateUser({ email: newEmail })
        .then(({ error }) => {
          if (error) {
            alert('❌ Errore durante la modifica dell\'email: ' + error.message)
          } else {
            alert('✅ Richiesta di modifica email inviata!\n\nControlla la tua casella email attuale per confermare il cambiamento.')
          }
        })
    }
  }

  const handlePasswordChange = () => {
    const newPassword = prompt('Inserisci la nuova password (minimo 6 caratteri):')
    if (newPassword) {
      if (!isSupabaseAvailable || !supabase) {
        alert('Modifica password non disponibile - servizio di autenticazione non configurato')
        return
      }

      if (newPassword.length < 6) {
        alert('⚠️ La password deve essere di almeno 6 caratteri')
        return
      }

      supabase.auth.updateUser({ password: newPassword })
        .then(({ error }) => {
          if (error) {
            alert('❌ Errore durante la modifica della password: ' + error.message)
          } else {
            alert('✅ Password aggiornata con successo!')
          }
        })
    }
  }

  const handleProfileManagement = () => {
    setIsProfileModalOpen(true)
  }

  const handleNotifications = () => {
    alert('Funzionalità notifiche in sviluppo')
  }

  const handleReset = () => {
    if (confirm('⚠️ ATTENZIONE!\n\nQuesta operazione eliminerà TUTTI i tuoi dati:\n- Vini in archivio\n- Fornitori\n- Impostazioni personalizzate\n\nQuesta azione è IRREVERSIBILE.\n\nSei sicuro di voler continuare?')) {
      if (confirm('🔴 ULTIMA CONFERMA\n\nStai per eliminare DEFINITIVAMENTE tutti i tuoi dati.\n\nDigita "CONFERMA" per procedere o annulla per tornare indietro.')) {
        performReset()
      }
    }
  }

  const performReset = async () => {
    try {
      if (!isSupabaseAvailable || !supabase) {
        // Se Supabase non è disponibile, pulisce solo il localStorage
        localStorage.clear()
        sessionStorage.clear()
        alert('✅ Dati locali puliti con successo!')
        window.location.href = '/'
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('❌ Errore: utente non autenticato')
        return
      }

      // Elimina tutti i dati dell'utente dal database
      const { error: winesError } = await supabase
        .from('giacenze')
        .delete()
        .eq('user_id', user.id)

      if (winesError) {
        console.error('Errore nell\'eliminazione vini:', winesError)
      }

      const { error: suppliersError } = await supabase
        .from('fornitori')
        .delete()
        .eq('user_id', user.id)

      if (suppliersError) {
        console.error('Errore nell\'eliminazione fornitori:', suppliersError)
      }

      // Pulisce anche il localStorage
      localStorage.clear()
      sessionStorage.clear()

      alert('✅ Reset completato con successo!\n\nTutti i tuoi dati sono stati eliminati.')
      window.location.href = '/'
    } catch (error) {
      console.error('Errore durante il reset:', error)
      alert('❌ Errore durante il reset dei dati. Riprova.')
    }
  }

  const accountOptions = [
    {
      id: 'email',
      title: 'EMAIL',
      icon: Mail
    },
    {
      id: 'password',
      title: 'PASSWORD',
      icon: Lock
    },
    {
      id: 'profile',
      title: 'PROFILO',
      icon: UserCircle
    },
    {
      id: 'notifications',
      title: 'NOTIFICHE',
      icon: Bell
    },
    {
      id: 'reset',
      title: 'RESET',
      icon: RotateCcw
    },
    {
      id: 'logout',
      title: 'ESCI',
      icon: LogOut
    }
  ]

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(to bottom right, #1f0202, #2d0505, #1f0202)' }}>
      {/* Header */}
      <header className="border-b border-red-900/30 bg-black/30 backdrop-blur-sm">
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
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {accountOptions.map((option) => {
            const IconComponent = option.icon
            return (
              <div
                key={option.id}
                onClick={() => handleOptionClick(option.id)}
                className="bg-gray-800/50 border border-gray-700 p-3 rounded-xl text-left transition-all duration-200 group hover:bg-gray-700/50 hover:border-gray-600 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-700/50 rounded-lg group-hover:bg-gray-600/50 transition-colors">
                    <IconComponent className="h-4 w-4 text-gray-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-cream">
                      {option.title}
                    </h3>
                    {option.id === 'email' && user?.email && (
                      <p className="text-xs text-blue-400 mt-1">
                        Attuale: {user.email}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
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

        {/* Profile Management Modal */}
        <ProfileManagementModal
          open={isProfileModalOpen}
          onOpenChange={setIsProfileModalOpen}
          user={user}
        />
      </main>
    </div>
  )
}