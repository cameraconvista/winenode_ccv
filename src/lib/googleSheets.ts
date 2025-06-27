// Funzioni AI Google Sheets disabilitate - file mantenuto per compatibilità
export interface ImportResult {
  success: boolean
  imported: number
  errors: string[]
  message: string
}

export async function importFromGoogleSheet(sheetUrl: string): Promise<ImportResult> {
  // Funzione AI completamente disabilitata
  return {
    success: false,
    imported: 0,
    errors: ['Funzione AI disabilitata'],
    message: '❌ Funzionalità AI non disponibile'
  }
}

export async function saveGoogleSheetLink(sheetUrl: string): Promise<boolean> {
  // Funzione disabilitata
  return false
}

export async function loadGoogleSheetLink(): Promise<string | null> {
  // Funzione disabilitata
  return null
}

export async function deleteGoogleSheetLink(): Promise<boolean> {
  // Funzione disabilitata
  return false
}