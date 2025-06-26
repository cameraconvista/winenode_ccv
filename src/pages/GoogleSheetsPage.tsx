import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Globe, Save, Download, Upload, CheckCircle, AlertCircle, Home } from 'lucide-react'
import { authManager, supabase, isSupabaseAvailable } from '../lib/supabase'
import { importFromGoogleSheet } from '../lib/importFromGoogleSheet'

export default function GoogleSheetsPage() {
  const navigate = useNavigate()
  const [googleSheetUrl, setGoogleSheetUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [importMessage, setImportMessage] = useState('')

  // Load existing Google Sheet link on component mount
  useEffect(() => {
    loadExistingSheetLink()
  }, [])

  // Auto-clear import message after 5 seconds
  useEffect(() => {
    if (importMessage) {
      const timeout = setTimeout(() => setImportMessage(''), 5000)
      return () => clearTimeout(timeout)
    }
  }, [importMessage])

  const loadExistingSheetLink = async () => {
    const userId = authManager.getUserId()
    if (!userId || !isSupabaseAvailable || !supabase) return

    try {
      const { data, error } = await supabase
        .from('impostazioni')
        .select('google_sheet_url')
        .eq('user_id', userId)
        .single()

      if (data && data.google_sheet_url) {
        setGoogleSheetUrl(data.google_sheet_url)
      }
    } catch (error) {
      console.error('Error loading existing sheet link:', error)
    }
  }

  const handleSaveSheetLink = async () => {
    const userId = authManager.getUserId()
    if (!userId || !googleSheetUrl.trim()) {
      setStatus('error')
      setMessage('Inserisci un link valido al Google Sheet')
      return
    }

    if (!isSupabaseAvailable || !supabase) {
      setStatus('error')
      setMessage('Supabase non disponibile')
      return
    }

    setIsSaving(true)
    setStatus('idle')

    try {
      // Check if user already has a setting
      const { data: existingData } = await supabase
        .from('impostazioni')
        .select('id')
        .eq('user_id', userId)
        .single()

      let result
      if (existingData) {
        // Update existing record
        result = await supabase
          .from('impostazioni')
          .update({ google_sheet_url: googleSheetUrl.trim() })
          .eq('user_id', userId)
      } else {
        // Insert new record
        result = await supabase
          .from('impostazioni')
          .insert({
            user_id: userId,
            google_sheet_url: googleSheetUrl.trim()
          })
      }

      if (result.error) {
        throw result.error
      }

      setStatus('success')
      setMessage('✅ Link Google Sheet salvato con successo!')
    } catch (error) {
      console.error('Error saving sheet link:', error)
      setStatus('error')
      setMessage('❌ Errore durante il salvataggio del link')
    } finally {
      setIsSaving(false)
    }
  }

  const handleImportFromGoogleSheet = async () => {
    // Primo messaggio di conferma
    const firstConfirm = window.confirm(
      "ATTENZIONE\n⚠️ Tutti i vini saranno sostituiti con quelli del Google Sheet.\nVuoi continuare?"
    )

    if (!firstConfirm) return

    // Secondo messaggio di conferma
    const secondConfirm = window.confirm(
      "⚠️ Azione definitiva.\nContinuare?"
    )

    if (!secondConfirm) return

    const userId = authManager.getUserId()
    if (!userId) {
      setStatus('error')
      setMessage('Utente non autenticato')
      return
    }

    if (!googleSheetUrl.trim()) {
      setStatus('error')
      setMessage('Inserisci un link al Google Sheet')
      return
    }

    setIsLoading(true)
    setStatus('idle')
    setImportMessage('')

    try {
      // Usa la nuova funzione di importazione intelligente
      const result = await importFromGoogleSheet(googleSheetUrl)

      if (result.success) {
        setStatus('success')
        setMessage(`✅ Importazione completata - ${result.importedWines} vini importati`)
        setImportMessage(result.msg)

        // Auto-save the link if import was successful
        if (!isSaving) {
          await handleSaveSheetLink()
        }
      } else {
        setStatus('error')
        setMessage(`❌ ${result.msg}`)
        setImportMessage('')
      }

      // Log eventuali errori per debug
      if (result.errors && result.errors.length > 0) {
        console.warn('Avvisi durante l\'importazione:', result.errors)
      }
    } catch (error) {
      console.error('Errore importazione Google Sheet:', error)
      setStatus('error')
      setMessage('❌ Errore durante l\'importazione')
      setImportMessage('')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div 
      className="min-h-screen text-white"
      style={{
        background: "linear-gradient(to bottom right, #1f0202, #2d0505, #1f0202)",
      }}
    >
      {/* Header con logo e pulsante home */}
      <header className="border-b border-red-900/30 bg-black/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <button
              onClick={() => navigate('/settings/archivi')}
              className="p-2 text-white hover:text-cream hover:bg-white/10 rounded-full transition-all duration-200 hover:scale-105"
              title="Torna alla pagina archivi"
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
              className="p-2 text-white hover:text-yellow-300 hover:bg-gray-800 rounded-lg transition-colors"
              title="Vai alla home"
            >
              <Home className="h-6 w-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Container principale con layout coerente */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-xl mx-auto">
          {/* Titolo principale centrato */}
          <h1 className="text-2xl font-bold text-center text-white mb-8 tracking-wide">
            SYNCRO GOOGLE SHEET
          </h1>

          {/* Pulsante per scaricare il template */}
          <div className="mb-6 flex justify-center">
            <a
              href="https://docs.google.com/spreadsheets/d/1tRershHMvfmA8GHfhmzk5mts6CxLwBl7wH3Q0c9roSA/copy"
              target="_blank"
              rel="noopener noreferrer"
              className="w-1/2 flex items-center justify-center gap-2 text-black font-semibold hover:opacity-90 transition-all duration-200 shadow-lg hover:shadow-xl"
              style={{
                borderRadius: "12px",
                padding: "12px 24px",
                fontSize: "14px",
                backgroundColor: '#e0b300',
                border: '2px solid #c9a100',
              }}
            >
              <Download className="w-4 h-4" />
              Scarica Google Sheet
            </a>
          </div>

        {/* Instructions */}


        {/* URL Input */}
          <div className="mb-6">
            <div className="text-sm text-gray-400 mb-2">
              Link Google Sheet
            </div>
            <input
              type="url"
              value={googleSheetUrl}
              onChange={(e) => setGoogleSheetUrl(e.target.value)}
              className="w-full p-3 text-white bg-black/40 focus:outline-none focus:ring-2 focus:ring-red-500/50 rounded-lg placeholder-gray-600"
              placeholder="incolla qui il link"
              disabled={isLoading || isSaving}
              required
            />
          </div>

        {/* Status Message */}
        {status !== 'idle' && (
          <div className="mb-6">
            {status === 'success' ? (
              <div className="p-3 rounded-lg border border-green-500 bg-green-500/10">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <p className="text-green-300 text-sm font-medium">
                    {message}
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-lg border border-red-500 bg-red-500/10">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <p className="text-red-300 text-sm font-medium">
                    {message}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Import Success Message */}
        {importMessage && (
          <div className="mb-6 p-3 rounded-lg border border-green-500 bg-green-500/10">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <p className="text-green-300 text-sm font-medium">{importMessage}</p>
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="flex items-center justify-center pt-2 mb-6">
          <button
            onClick={handleImportFromGoogleSheet}
            disabled={isLoading || !googleSheetUrl.trim()}
            className="w-1/2 flex items-center justify-center gap-2 text-white hover:opacity-90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            style={{
              borderRadius: "12px",
              padding: "12px 24px",
              fontWeight: "600",
              fontSize: "14px",
              backgroundColor: "#1B4D3E",
              border: "2px solid #0F5132",
              background: "linear-gradient(135deg, #1B4D3E 0%, #0F5132 100%)"
            }}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Importando...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Importa ora
              </>
            )}
          </button>
        </div>

        {/* Additional Info */}
        <div className="max-w-xl mx-auto">
          <div 
            className="p-6 rounded-lg border border-white/10"
            style={{
              backgroundColor: "#1a0000"
            }}
          >
            <h3 className="text-sm font-medium text-white mb-3">💡 Come preparare il Google Sheet:</h3>
            <ol className="text-sm text-gray-400 space-y-2 list-decimal list-inside">
              <li>Crea tab separati chiamati: ROSSI, BIANCHI, BOLLICINE, ROSATI</li>
              <li>In ogni tab, crea una colonna "NAME" con i nomi dei vini</li>
              <li>Inserisci i vini (un vino per riga nella colonna NAME)</li>
              <li>Clicca su "Condividi" → "Modifica le autorizzazioni di accesso"</li>
              <li>Seleziona "Chiunque abbia il link può visualizzare"</li>
              <li>Copia il link e incollalo qui sopra</li>
            </ol>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}