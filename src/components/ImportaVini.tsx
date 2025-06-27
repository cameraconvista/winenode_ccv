import React, { useState, useEffect } from 'react'
import { 
  FileText, 
  Plus, 
  CheckCircle, 
  AlertCircle,
  Globe,
  X,
  Upload,
  Download,
  ChevronRight,
  Settings
} from "lucide-react";
import { authManager, supabase, isSupabaseAvailable } from '../lib/supabase'

interface ImportaViniProps {}

export default function ImportaVini({}: ImportaViniProps) {
  const [isImporting, setIsImporting] = useState(false)
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [importMessage, setImportMessage] = useState('')
  const [textInput, setTextInput] = useState('')
  const [showGoogleSheetsModal, setShowGoogleSheetsModal] = useState(false)
  const [showFileUploadModal, setShowFileUploadModal] = useState(false)

  // Google Sheet states
  const [googleSheetUrl, setGoogleSheetUrl] = useState('')
  const [currentSheetLink, setCurrentSheetLink] = useState<string | null>(null)
  const [isLoadingSheet, setIsLoadingSheet] = useState(false)
  const [sheetStatus, setSheetStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [sheetMessage, setSheetMessage] = useState('')

  // Load current Google Sheet link on component mount
  useEffect(() => {
    const loadCurrentSheetLink = async () => {
      const userId = authManager.getUserId()
      if (!userId || !isSupabaseAvailable) return

      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('google_sheet_url')
          .eq('user_id', userId)
          .single()

        if (!error && data?.google_sheet_url) {
          setCurrentSheetLink(data.google_sheet_url)
        }
      } catch (error) {
        console.error('Error loading sheet link:', error)
      }
    }

    loadCurrentSheetLink()
  }, [])

  const saveWineToSupabase = async (name: string, type: string, userId: string) => {
    if (!isSupabaseAvailable || !supabase) {
      throw new Error('Supabase non disponibile')
    }

    const { data, error } = await supabase
      .from('giacenze')
      .insert({
        name: name.trim(),
        type: type.toLowerCase().trim(),
        supplier: '-',
        inventory: 0,
        min_stock: 0,
        price: 0,
        vintage: null,
        region: null,
        description: null,
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Errore Supabase:', error)
      throw error
    }

    return data
  }

  const handleImportFromGoogleSheet = async () => {
    // Funzione AI completamente disabilitata
    setIsLoadingSheet(false)
    setSheetStatus('error')
    setSheetMessage('❌ Funzionalità AI disabilitata')
    return
  }

  const handleSaveSheetLink = async () => {
    const userId = authManager.getUserId()
    if (!userId || !googleSheetUrl.trim() || !isSupabaseAvailable) return

    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: userId,
          google_sheet_url: googleSheetUrl,
          updated_at: new Date().toISOString()
        })

      if (!error) {
        setCurrentSheetLink(googleSheetUrl)
        setSheetStatus('success')
        setSheetMessage('✅ Link aggiornato con successo')
        setGoogleSheetUrl('')
      } else {
        console.error('Error saving sheet link:', error)
      }
    } catch (error) {
      console.error('Error saving sheet link:', error)
    }
  }

  const handleDeleteSheetLink = async () => {
    const userId = authManager.getUserId()
    if (!userId || !isSupabaseAvailable) return

    try {
      const { error } = await supabase
        .from('user_settings')
        .delete()
        .eq('user_id', userId)

      if (!error) {
        setCurrentSheetLink(null)
        setSheetStatus('success')
        setSheetMessage('✅ Link eliminato con successo')
      }
    } catch (error) {
      console.error('Error deleting sheet link:', error)
    }
  }

  const handleEditSheetLink = () => {
    if (currentSheetLink) {
      setGoogleSheetUrl(currentSheetLink)
      setCurrentSheetLink(null)
    }
  }

  const processImportData = async (data: string, source: string) => {
    const userId = authManager.getUserId()
    if (!userId) {
      setImportStatus('error')
      setImportMessage('Utente non autenticato')
      return
    }

    if (!isSupabaseAvailable) {
      setImportStatus('error')
      setImportMessage('Supabase non configurato')
      return
    }

    setIsImporting(true)
    setImportStatus('idle')

    try {
      const lines = data.split('\n').filter(line => line.trim())
      if (lines.length === 0) {
        throw new Error('Nessun dato da importare')
      }

      let importedCount = 0
      const errors: string[] = []

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) continue

        try {
          let name = ''
          let type = ''

          // Check if it's CSV format (contains comma)
          if (line.includes(',')) {
            const columns = line.split(',').map(col => col.replace(/"/g, '').trim())
            if (columns.length >= 2) {
              name = columns[0]
              type = columns[1].toLowerCase()
            } else {
              errors.push(`Riga ${i + 1}: Formato CSV non valido - deve contenere almeno nome,tipo`)
              continue
            }
          } else {
            // Space-separated format
            const spaceIndex = line.indexOf(' ')
            if (spaceIndex === -1) {
              errors.push(`Riga ${i + 1}: Formato non valido - deve contenere nome e tipo separati da spazio`)
              continue
            }

            name = line.substring(0, spaceIndex).trim()
            type = line.substring(spaceIndex + 1).trim().toLowerCase()
          }

          if (!name || !type) {
            errors.push(`Riga ${i + 1}: Nome o tipo mancante`)
            continue
          }

          if (!['rosso', 'bianco', 'bollicine', 'rosato'].includes(type)) {
            errors.push(`Riga ${i + 1}: Tipo non valido - deve essere rosso, bianco, bollicine o rosato`)
            continue
          }

          // Save to Supabase
          await saveWineToSupabase(name, type, userId)
          importedCount++

        } catch (error) {
          console.error(`Errore riga ${i + 1}:`, error)
          errors.push(`Riga ${i + 1}: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`)
        }
      }

      setImportStatus('success')
      let message = `${source} importato con successo - ${importedCount} vini elaborati`
      if (errors.length > 0) {
        message += ` (${errors.length} errori)`
      }
      setImportMessage(message)
    } catch (error) {
      console.error('Errore durante l\'importazione:', error)
      setImportStatus('error')
      setImportMessage(`Errore durante l'importazione: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`)
    } finally {
      setIsImporting(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      await processImportData(text, `File "${file.name}"`)
    } catch (error) {
      console.error('Errore nella lettura del file:', error)
      setImportStatus('error')
      setImportMessage('Errore nella lettura del file')
      setIsImporting(false)
    }
  }

  const handleTextImport = async () => {
    if (!textInput.trim()) {
      setImportStatus('error')
      setImportMessage('Inserisci almeno una riga di testo')
      return
    }

    await processImportData(textInput, 'Testo incollato')
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Status Messages */}
      {(importStatus !== 'idle' || sheetStatus !== 'idle') && (
        <div className="space-y-3">
          {importStatus !== 'idle' && (
            <div className={`flex items-center gap-2 p-3 rounded-lg ${
              importStatus === 'success' 
                ? 'bg-green-900/20 border border-green-800' 
                : 'bg-red-900/20 border border-red-800'
            }`}>
              {importStatus === 'success' ? (
                <CheckCircle className="w-5 h-5 text-green-400" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-400" />
              )}
              <p className={`text-sm ${
                importStatus === 'success' ? 'text-green-300' : 'text-red-300'
              }`}>
                {importMessage}
              </p>
            </div>
          )}

          {sheetStatus !== 'idle' && (
            <div className={`flex items-center gap-2 p-3 rounded-lg ${
              sheetStatus === 'success' 
                ? 'bg-green-900/20 border border-green-800' 
                : 'bg-red-900/20 border border-red-800'
            }`}>
              {sheetStatus === 'success' ? (
                <CheckCircle className="w-5 h-5 text-green-400" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-400" />
              )}
              <p className={`text-sm ${
                sheetStatus === 'success' ? 'text-green-300' : 'text-red-300'
              }`}>
                {sheetMessage}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Modal File Upload */}
      {showFileUploadModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-lg w-full max-w-2xl">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <FileText className="w-6 h-6 text-amber-400" />
                <h3 className="text-xl font-bold text-cream uppercase">
                  CARICA FILE
                </h3>
              </div>

              {/* File Selection Buttons */}
              <div className="space-y-3 mb-6">
                <button
                  onClick={() => {
                    setShowFileUploadModal(false);
                    setShowGoogleSheetsModal(true);
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Globe className="w-5 h-5" />
                  <span className="font-medium">GOOGLE SHEETS</span>
                </button>
              </div>

              {/* File Drop Area */}
              <div className="text-center py-12 mb-6">
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="modal-file-upload"
                  disabled={isImporting}
                />
                <div className="w-16 h-16 bg-gray-700/50 rounded-lg flex items-center justify-center mx-auto mb-6">
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-cream font-medium mb-2 text-lg">
                  Seleziona file
                </p>
                <p className="text-gray-400 text-sm">
                  CSV, TXT, Excel (max 10MB)
                </p>
              </div>

              {/* Format Info */}
              <div className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-4 mb-6">
                <div className="space-y-2 text-sm text-gray-400">
                  <p><span className="font-medium text-cream">Formato:</span> Nome Tipo (per riga)</p>
                  <p>Solo nome e tipo vino necessari</p>
                </div>
              </div>

              {/* Status message */}
              {importStatus !== 'idle' && (
                <div className={`flex items-center gap-2 p-3 rounded-lg mb-4 ${
                  importStatus === 'success' 
                    ? 'bg-green-900/20 border border-green-800' 
                    : 'bg-red-900/20 border border-red-800'
                }`}>
                  {importStatus === 'success' ? (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-400" />
                  )}
                  <p className={`text-sm ${
                    importStatus === 'success' ? 'text-green-300' : 'text-red-300'
                  }`}>
                    {importMessage}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowFileUploadModal(false);
                    setImportStatus('idle');
                    setImportMessage('');
                  }}
                  className="flex-1 px-4 py-3 bg-gray-700 text-cream rounded-lg hover:bg-gray-600 transition-colors"
                  disabled={isImporting}
                >
                  Chiudi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Google Sheets */}
      {showGoogleSheetsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-lg w-full max-w-2xl">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <Globe className="w-6 h-6 text-blue-400" />
                <h3 className="text-xl font-bold text-cream uppercase">
                  GOOGLE SHEET
                </h3>
              </div>

              <p className="text-gray-400 text-sm mb-4">
                Incolla link Google Sheet pubblico
              </p>

              <input
                type="url"
                value={googleSheetUrl}
                onChange={(e) => setGoogleSheetUrl(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800/70 text-cream rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 mb-4"
                placeholder="https://docs.google.com/spreadsheets/..."
                disabled={isLoadingSheet}
              />

              {/* Current sheet link display */}
              {currentSheetLink && (
                <div className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Globe className="w-5 h-5 text-blue-400" />
                      <div>
                        <p className="text-cream font-medium text-sm">Google Sheet collegato</p>
                        <p className="text-gray-400 text-xs truncate max-w-xs">{currentSheetLink}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleEditSheetLink}
                        className="p-2 text-gray-400 hover:text-cream transition-colors"
                        title="Modifica link"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleDeleteSheetLink}
                        className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                        title="Elimina link"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Status message */}
              {sheetStatus !== 'idle' && (
                <div className={`flex items-center gap-2 p-3 rounded-lg mb-4 ${
                  sheetStatus === 'success' 
                    ? 'bg-green-900/20 border border-green-800' 
                    : 'bg-red-900/20 border border-red-800'
                }`}>
                  {sheetStatus === 'success' ? (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-400" />
                  )}
                  <p className={`text-sm ${
                    sheetStatus === 'success' ? 'text-green-300' : 'text-red-300'
                  }`}>
                    {sheetMessage}
                  </p>
                </div>
              )}

              <div className="space-y-3 text-xs text-gray-400 mb-6">
                <p><span className="font-medium">Formato:</span> Nome | Tipo</p>
                <p>Solo nome e tipo vino (rosso/bianco/bollicine/rosato)</p>
                <p>Altri campi impostati automaticamente</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowGoogleSheetsModal(false);
                    setSheetStatus('idle');
                    setSheetMessage('');
                  }}
                  className="flex-1 px-4 py-3 bg-gray-700 text-cream rounded-lg hover:bg-gray-600 transition-colors"
                  disabled={isLoadingSheet}
                >
                  Chiudi
                </button>
                <button
                  onClick={handleImportFromGoogleSheet}
                  disabled={isLoadingSheet || !googleSheetUrl.trim()}
                  className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {isLoadingSheet ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Importando...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Importa
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}