import { supabase, authManager, isSupabaseAvailable } from './supabase'
import Papa from 'papaparse'

export interface ImportResult {
  success: boolean
  msg: string
  importedWines: number
  importedCategories: number
  errors?: string[]
}

// Tab supportati con mapping ai tipi di vino
const SUPPORTED_TABS = [
  { name: 'ROSSI', type: 'rosso' },
  { name: 'BIANCHI', type: 'bianco' },
  { name: 'BOLLICINE', type: 'bollicine' },
  { name: 'ROSATI', type: 'rosato' }
]

// Estrae l'ID dello spreadsheet dal link Google Sheets
function extractSpreadsheetId(url: string): string | null {
  const regex = /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/
  const match = url.match(regex)
  return match ? match[1] : null
}

// Costruisce l'URL CSV per un tab specifico
function buildCsvUrl(spreadsheetId: string, tabName: string): string {
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tabName)}`
}

// Verifica se una categoria esiste già per l'utente
async function categoryExists(userId: string, categoryName: string): Promise<boolean> {
  if (!isSupabaseAvailable || !supabase) return false

  const { data, error } = await supabase
    .from('categorie')
    .select('id')
    .eq('user_id', userId)
    .eq('nome', categoryName)
    .single()

  return !error && !!data
}

// Crea una nuova categoria per l'utente
async function createCategory(userId: string, categoryName: string): Promise<boolean> {
  if (!isSupabaseAvailable || !supabase) return false

  try {
    const { error } = await supabase
      .from('categorie')
      .insert({
        user_id: userId,
        nome: categoryName,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    return !error
  } catch (error) {
    console.error('Errore nella creazione della categoria:', error)
    return false
  }
}

// Salva un vino nel database
async function saveWine(userId: string, name: string, type: string): Promise<boolean> {
  if (!isSupabaseAvailable || !supabase) return false

  try {
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

    return !error
  } catch (error) {
    console.error('Errore nel salvataggio del vino:', error)
    return false
  }
}

// Scarica e processa i dati CSV da un tab
async function processTabData(spreadsheetId: string, tab: { name: string, type: string }, userId: string): Promise<{ wines: number, categoryCreated: boolean, errors: string[] }> {
  const csvUrl = buildCsvUrl(spreadsheetId, tab.name)
  const errors: string[] = []
  let winesImported = 0
  let categoryCreated = false

  try {
    // Scarica il CSV
    const response = await fetch(csvUrl)
    if (!response.ok) {
      throw new Error(`Errore HTTP: ${response.status}`)
    }

    const csvText = await response.text()

    // Gestione errori parsing simile a Google Apps Script
    let parsedData
    try {
      parsedData = Papa.parse(csvText, {
        header: false,
        skipEmptyLines: true
      })
    } catch (e) {
      console.error('Errore parsing CSV:', csvText)
      throw new Error(`Errore parsing dati dal tab ${tab.name}`)
    }

    // Parsa il CSV con PapaParse
    return new Promise((resolve) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          try {
            // Verifica se la categoria esiste, altrimenti la crea
            const categoryExistsAlready = await categoryExists(userId, tab.name)
            if (!categoryExistsAlready) {
              const categoryCreatedSuccess = await createCategory(userId, tab.name)
              if (categoryCreatedSuccess) {
                categoryCreated = true
              } else {
                errors.push(`Impossibile creare la categoria ${tab.name}`)
              }
            }

            // Processa ogni riga del CSV
            for (const [index, row] of results.data.entries()) {
              const rowData = row as any

              // Cerca la colonna NAME (con varie possibili varianti)
              const wineName = rowData['NAME'] || rowData['Name'] || rowData['name'] || 
                              rowData['NOME'] || rowData['Nome'] || rowData['nome']

              if (wineName && wineName.trim()) {
                const success = await saveWine(userId, wineName.trim(), tab.type)
                if (success) {
                  winesImported++
                } else {
                  errors.push(`Errore nel salvare il vino "${wineName}" dal tab ${tab.name}`)
                }
              } else {
                errors.push(`Riga ${index + 1} nel tab ${tab.name}: nome vino mancante`)
              }
            }

            resolve({ wines: winesImported, categoryCreated, errors })
          } catch (error) {
            errors.push(`Errore nel processare il tab ${tab.name}: ${error}`)
            resolve({ wines: winesImported, categoryCreated, errors })
          }
        },
        error: (error) => {
          errors.push(`Errore nel parsing del CSV per ${tab.name}: ${error.message}`)
          resolve({ wines: 0, categoryCreated: false, errors })
        }
      })
    })
  } catch (error) {
    errors.push(`Errore nel download del tab ${tab.name}: ${error}`)
    return { wines: 0, categoryCreated: false, errors }
  }
}

// Funzione principale di importazione
export async function importFromGoogleSheet(url: string): Promise<ImportResult> {
  const userId = authManager.getUserId()

  if (!userId) {
    return {
      success: false,
      msg: 'Utente non autenticato',
      importedWines: 0,
      importedCategories: 0
    }
  }

  if (!isSupabaseAvailable || !supabase) {
    return {
      success: false,
      msg: 'Database non disponibile',
      importedWines: 0,
      importedCategories: 0
    }
  }

  // Estrai l'ID dello spreadsheet
  const spreadsheetId = extractSpreadsheetId(url)
  if (!spreadsheetId) {
    return {
      success: false,
      msg: 'Link Google Sheets non valido',
      importedWines: 0,
      importedCategories: 0
    }
  }

  let totalWines = 0
  let totalCategories = 0
  const allErrors: string[] = []

  // Processa ogni tab supportato
  for (const tab of SUPPORTED_TABS) {
    try {
      const result = await processTabData(spreadsheetId, tab, userId)
      totalWines += result.wines
      if (result.categoryCreated) {
        totalCategories++
      }
      allErrors.push(...result.errors)
    } catch (error) {
      allErrors.push(`Errore generale nel tab ${tab.name}: ${error}`)
    }
  }

  // Costruisci il messaggio di risultato
  let msg = ''
  if (totalWines > 0) {
    msg = `✅ ${totalWines} vini importati`
    if (totalCategories > 0) {
      msg += ` da ${totalCategories} nuove categorie`
    }
  } else {
    msg = '❌ Nessun vino importato'
  }

  return {
    success: totalWines > 0,
    msg,
    importedWines: totalWines,
    importedCategories: totalCategories,
    errors: allErrors.length > 0 ? allErrors : undefined
  }
}