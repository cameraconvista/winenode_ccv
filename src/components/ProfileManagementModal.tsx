import React, { useState, useEffect } from 'react'
import { X, User, Shield } from 'lucide-react'
import { supabase, isSupabaseAvailable } from '../lib/supabase'

interface ProfileManagementModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: any
}

export default function ProfileManagementModal({ open, onOpenChange, user }: ProfileManagementModalProps) {
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<'admin' | 'utente'>('utente')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (user && open) {
      const userData = user.user_metadata || {}
      setFullName(userData.full_name || userData.name || '')
      setRole(userData.role || 'utente')
    }
  }, [user, open])

  const handleSave = async () => {
    if (!fullName.trim()) {
      alert('⚠️ Inserisci un nome valido')
      return
    }

    if (!isSupabaseAvailable || !supabase) {
      alert('Modifica profilo non disponibile - servizio di autenticazione non configurato')
      return
    }

    setIsLoading(true)
    
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          role: role
        }
      })

      if (error) {
        alert('❌ Errore durante l\'aggiornamento del profilo: ' + error.message)
      } else {
        alert(`✅ Profilo aggiornato con successo!\n\nNome: ${fullName}\nRuolo: ${role}`)
        onOpenChange(false)
        // Ricarica la pagina per aggiornare i dati
        setTimeout(() => window.location.reload(), 1000)
      }
    } catch (error) {
      alert('❌ Errore durante l\'aggiornamento del profilo')
    } finally {
      setIsLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl border border-gray-700 w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-blue-400" />
            </div>
            <h2 className="text-xl font-semibold text-cream">
              Gestione Profilo Utente
            </h2>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="text-gray-400 hover:text-cream transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Nome completo */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nome completo
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Inserisci il tuo nome completo"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-cream placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Selezione ruolo */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Ruolo utente
            </label>
            <div className="space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="role"
                  value="utente"
                  checked={role === 'utente'}
                  onChange={(e) => setRole(e.target.value as 'utente')}
                  className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 focus:ring-blue-500"
                />
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-cream">Utente</span>
                </div>
              </label>
              
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="role"
                  value="admin"
                  checked={role === 'admin'}
                  onChange={(e) => setRole(e.target.value as 'admin')}
                  className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 focus:ring-blue-500"
                />
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-yellow-400" />
                  <span className="text-cream">Admin</span>
                </div>
              </label>
            </div>
          </div>

          {/* Informazioni attuali */}
          {user && (
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <h4 className="text-sm font-medium text-gray-300 mb-2">
                Informazioni attuali
              </h4>
              <div className="space-y-1 text-sm text-gray-400">
                <div>Email: <span className="text-blue-400">{user.email}</span></div>
                <div>Nome attuale: <span className="text-cream">{user.user_metadata?.full_name || 'Non impostato'}</span></div>
                <div>Ruolo attuale: <span className="text-yellow-400">{user.user_metadata?.role || 'utente'}</span></div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-700">
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 text-gray-400 hover:text-cream transition-colors"
          >
            Annulla
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-cream rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Salvataggio...' : 'Salva Modifiche'}
          </button>
        </div>
      </div>
    </div>
  )
}