
import { supabase, authManager, isSupabaseAvailable } from './supabase'

export interface ImportResult {
  success: boolean
  imported: number
  errors: string[]
  message: string
}

export async function importFromGoogleSheet(sheetUrl: string): Promise<ImportResult> {
  const userId = authManager.getUserId()
  
  if (!userId) {
    return {
      success: false,
      imported: 0,
      errors: ['Utente non autenticato'],
      message: 'Errore: utente non autenticato'
    }
  }

  if (!isSupabaseAvailable || !supabase) {
    return {
      success: false,
      imported: 0,
      errors: ['Supabase non disponibile'],
      message: 'Errore: database non disponibile'
    }
  }

  try {
    // Converti il link Google Sheets in formato CSV
    const csvUrl = convertToCSVUrl(sheetUrl)
    
    // Fetch dei dati CSV
    const response = await fetch(csvUrl)
    if (!response.ok) {
      throw new Error(`Errore nel caricamento del foglio: ${response.statusText}`)
    }
    
    const csvData = await response.text()
    
    // Processa i dati CSV
    return await processCsvData(csvData, userId)
    
  } catch (error) {
    console.error('Errore importazione Google Sheet:', error)
    return {
      success: false,
      imported: 0,
      errors: [error instanceof Error ? error.message : 'Errore sconosciuto'],
      message: 'Errore durante l\'importazione'
    }
  }
}

function convertToCSVUrl(sheetUrl: string): string {
  // Converti URL Google Sheets in formato CSV
  if (sheetUrl.includes('/edit')) {
    return sheetUrl.replace('/edit#gid=', '/export?format=csv&gid=').replace('/edit', '/export?format=csv')
  }
  
  // Se è già un URL di export, usalo così com'è
  if (sheetUrl.includes('/export?format=csv')) {
    return sheetUrl
  }
  
  // Prova a estrarre l'ID del foglio
  const match = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
  if (match) {
    const sheetId = match[1]
    return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`
  }
  
  throw new Error('URL Google Sheets non valido')
}

async function processCsvData(csvData: string, userId: string): Promise<ImportResult> {
  const lines = csvData.split('\n').filter(line => line.trim())
  const errors: string[] = []
  let imported = 0
  
  if (lines.length === 0) {
    return {
      success: false,
      imported: 0,
      errors: ['Nessun dato trovato nel foglio'],
      message: 'Foglio vuoto o non accessibile'
    }
  }
  
  // Salta la prima riga se sembra essere un header
  const startIndex = isHeaderRow(lines[0]) ? 1 : 0
  
  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    
    try {
      const wine = parseCsvLine(line, i + 1)
      if (wine) {
        await saveWineToDatabase(wine.name, wine.type, userId)
        imported++
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Errore sconosciuto'
      errors.push(`Riga ${i + 1}: ${errorMsg}`)
    }
  }
  
  return {
    success: imported > 0,
    imported,
    errors,
    message: imported > 0 
      ? `✅ Importazione completata: ${imported} vini importati${errors.length > 0 ? ` (${errors.length} errori)` : ''}`
      : `❌ Nessun vino importato${errors.length > 0 ? ` (${errors.length} errori)` : ''}`
  }
}

function isHeaderRow(line: string): boolean {
  const lower = line.toLowerCase()
  return lower.includes('nome') || lower.includes('name') || lower.includes('tipo') || lower.includes('type')
}

interface ParsedWine {
  name: string
  type: string string
}

function parseCsvLine(line: string, lineNumber: number): ParsedWine | null {
  // Gestisce CSV con virgole e possibili virgolette
  const columns = line.split(',').map(col => col.replace(/^"|"$/g, '').trim())
  
  if (columns.length < 2) {
    throw new Error('Formato non valido - servono almeno 2 colonne (nome, tipo)')
  }
  
  const name = columns[0].trim()
  const type = columns[1].trim().toLowerCase()
  
  if (!name) {
    throw new Error('Nome vino mancante')
  }
  
  if (!type) {
    throw new Error('Tipo vino mancante')
  }
  
  // Valida il tipo di vino
  const validTypes = ['rosso', 'bianco', 'bollicine', 'rosato']
  if (!validTypes.includes(type)) {
    throw new Error(`Tipo non valido: deve essere uno tra ${validTypes.join(', ')}`)
  }
  
  return { name, type }
}

async function saveWineToDatabase(name: string, type: string, userId: string) {
  if (!supabase) {
    throw new Error('Database non disponibile')
  }
  
  const { error } = await supabase
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
  
  if (error) {
    console.error('Errore Supabase:', error)
    throw new Error(`Errore nel salvataggio: ${error.message}`)`)
  }
}

// Funzioni per gestire i link salvati
export async function saveGoogleSheetLink(sheetUrl: string): Promise<boolean> {
  const userId = authManager.getUserId()
  if (!userId || !supabase) return false
  
  try {
    const { error } = await supabase
      .from('impostazioni')
      .upsert({
        user_id: userId,
        google_sheet_url: sheetUrl,
        created_at: new Date().toISOString()
      })
    
    return !error
  } catch (error) {
    console.error('Errore salvataggio link:', error)
    return false
  }
}

export async function loadGoogleSheetLink(): Promise<string | null> {
  const userId = authManager.getUserId()
  if (!userId || !supabase) return null
  
  try {
    const { data, error } = await supabase
      .from('impostazioni')
      .select('google_sheet_url')
      .eq('user_id', userId)
      .single()
    
    if (error || !data) return null
    return data.google_sheet_url
  } catch (error) {
    console.error('Errore caricamento link:', error)
    return null
  }
}

export async function deleteGoogleSheetLink(): Promise<boolean> {
  const userId = authManager.getUserId()
  if (!userId || !supabase) return false
  
  try {
    const { error } = await supabase
      .from('impostazioni')
      .delete()
      .eq('user_id', userId)
    
    return !error
  } catch (error) {
    console.error('Errore eliminazione link:', error)
    return false
  }
}
