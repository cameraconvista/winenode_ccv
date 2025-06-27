// Funzione AI disabilitata - file mantenuto per compatibilità
export interface ImportResult {
  success: boolean
  msg: string
  importedWines: number
  importedCategories: number
  errors?: string[]
}

export async function importFromGoogleSheet(url: string): Promise<ImportResult> {
  // Funzione AI completamente disabilitata
  return {
    success: false,
    msg: '❌ Funzionalità AI disabilitata',
    importedWines: 0,
    importedCategories: 0,
    errors: ['Funzione AI non disponibile']
  }
}