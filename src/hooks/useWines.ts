import { useState, useEffect } from 'react'
import { supabase, authManager, isSupabaseAvailable } from '../lib/supabase'

type SupabaseWine = {
  id: number;
  nome: string;
  tipo: string;
  fornitore: string;
  giacenza: number;
  min_stock: number;
  prezzo: number;
  annata: string | null;
  regione: string | null;
  descrizione: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
};

type WineData = {
  id: number;
  name: string;
  type: string;
  supplier: string;
  inventory: number;
  minStock: number;
  price: string;
  vintage: string | null;
  region: string | null;
  description: string | null;
};

const fallbackWines: WineData[] = [
  {
    id: 1,
    name: "Chianti Classico",
    type: "rosso",
    supplier: "Fornitori Test",
    inventory: 12,
    minStock: 5,
    price: "15.50",
    vintage: "2020",
    region: "Toscana",
    description: "Vino rosso di test"
  },
  {
    id: 2,
    name: "Prosecco DOCG",
    type: "bollicine",
    supplier: "Fornitori Test",
    inventory: 8,
    minStock: 3,
    price: "12.00",
    vintage: "2022",
    region: "Veneto",
    description: "Spumante di test"
  },
  {
    id: 3,
    name: "Vermentino di Sardegna",
    type: "bianco",
    supplier: "Fornitori Test",
    inventory: 6,
    minStock: 2,
    price: "13.50",
    vintage: "2023",
    region: "Sardegna",
    description: "Vino bianco di test"
  }
]

export function useWines() {
  const [wines, setWines] = useState<WineData[]>([])
  const [suppliers, setSuppliers] = useState<string[]>([])
  const [types, setTypes] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const unsubscribe = authManager.onAuthStateChange((user) => {
      setIsAuthenticated(!!user)
      if (user) {
        loadWines()
      } else {
        setWines([])
        setSuppliers([])
        setTypes([])
        setLoading(false)
      }
    })
    return unsubscribe
  }, [])

  const loadWines = async () => {
    setLoading(true)
    setError(null)
    if (!isSupabaseAvailable) {
      setWines(fallbackWines)
      setSuppliers(Array.from(new Set(fallbackWines.map(w => w.supplier))))
      setTypes([])
      setLoading(false)
      return
    }
    if (!authManager.isAuthenticated()) {
      setError('Utente non autenticato')
      setLoading(false)
      return
    }
    const userId = authManager.getUserId()
    if (!userId) {
      setError('ID utente non disponibile')
      setLoading(false)
      return
    }

    try {
      const { data: wineData, error: wineError } = await supabase!
        .from('giacenze')
        .select('*')
        .eq('user_id', userId)
        .order('nome', { ascending: true })

      if (wineError) {
        console.warn('Errore nel caricamento vini dal database, uso dati di fallback:', wineError)
        setWines(fallbackWines)
        setSuppliers(Array.from(new Set(fallbackWines.map(w => w.supplier))))
        setTypes(['rosso', 'bianco', 'bollicine', 'rosato'])
        setLoading(false)
        return
      }

      const transformedWines = (wineData || []).map((wine: any) => ({
        id: wine.id,
        name: wine.nome || wine.name || '',
        type: wine.tipo || wine.type || 'rosso',
        supplier: wine.fornitore || wine.supplier || '',
        inventory: Number(wine.giacenza || wine.inventory || 0),
        minStock: Number(wine.min_stock || wine.minStock || 0),
        price: (wine.prezzo || wine.price || 0).toString(),
        vintage: wine.annata || wine.vintage || '',
        region: wine.regione || wine.region || '',
        description: wine.descrizione || wine.description || ''
      }))

      // Se non ci sono vini nel database, usa i dati di fallback
      const finalWines = transformedWines.length > 0 ? transformedWines : fallbackWines
      setWines(finalWines)

      const [{ data: supplierData, error: supplierError }, { data: typeData, error: typeError }] =
        await Promise.all([
          supabase!.from('fornitori').select('nome').eq('user_id', userId),
          supabase!.from('tipologie').select('nome').eq('user_id', userId)
        ])

      const wineSuppliers = Array.from(new Set(finalWines.map(w => w.supplier).filter(s => s && s.trim())))
      const dbSuppliers = supplierError ? [] : (supplierData || []).map((s: any) => s.nome).filter(s => s && s.trim())
      const allSuppliers = Array.from(new Set([...wineSuppliers, ...dbSuppliers]))
      
      setSuppliers(allSuppliers.length > 0 ? allSuppliers : ['Fornitori Test'])

      if (typeError) {
        console.error('Errore nel caricamento tipologie:', typeError)
        setTypes([])
      } else {
        setTypes((typeData || []).map((t: any) => t.nome))
      }
    } catch (err) {
      console.error('Errore nel caricamento dei vini:', err)
      setError(err instanceof Error ? err.message : 'Errore nel caricamento dei dati')
    } finally {
      setLoading(false)
    }
  }

  const updateLocalWine = (wineId: number, updates: Partial<WineData>) => {
    setWines(prev => prev.map(w => (w.id === wineId ? { ...w, ...updates } : w)))
  }

  const updateWineInventory = async (wineId: number, newInventory: number) => {
    if (!isSupabaseAvailable || !authManager.isAuthenticated()) {
      console.error('Non autenticato')
      return false
    }
    const userId = authManager.getUserId()
    if (!userId) {
      console.error('ID utente non disponibile')
      return false
    }
    try {
      const { error } = await supabase!
        .from('giacenze')
        .update({ giacenza: newInventory, updated_at: new Date().toISOString() })
        .eq('id', wineId)
        .eq('user_id', userId)
      if (error) throw error
      updateLocalWine(wineId, { inventory: newInventory })
      return true
    } catch (err) {
      console.error('Errore aggiornamento giacenza:', err)
      return false
    }
  }

  const updateWine = async (wineId: number, updates: Partial<WineData>) => {
    if (!isSupabaseAvailable || !authManager.isAuthenticated()) {
      console.error('Non autenticato')
      return false
    }
    const userId = authManager.getUserId()
    if (!userId) {
      console.error('ID utente non disponibile')
      return false
    }
    const supabaseUpdates: any = { updated_at: new Date().toISOString() }
    if (updates.name !== undefined) supabaseUpdates.nome = updates.name
    if (updates.type !== undefined) supabaseUpdates.tipo = updates.type
    if (updates.supplier !== undefined) supabaseUpdates.fornitore = updates.supplier
    if (updates.inventory !== undefined) supabaseUpdates.giacenza = updates.inventory
    if (updates.minStock !== undefined) supabaseUpdates.min_stock = updates.minStock
    if (updates.price !== undefined) supabaseUpdates.prezzo = parseFloat(updates.price)
    if (updates.vintage !== undefined) supabaseUpdates.annata = updates.vintage
    if (updates.region !== undefined) supabaseUpdates.regione = updates.region
    if (updates.description !== undefined) supabaseUpdates.descrizione = updates.description

    try {
      const { error } = await supabase!
        .from('giacenze')
        .update(supabaseUpdates)
        .eq('id', wineId)
        .eq('user_id', userId)
      if (error) throw error
      updateLocalWine(wineId, updates)
      return true
    } catch (err) {
      console.error('Errore aggiornamento vino:', err)
      return false
    }
  }

  const addWine = async (newWine: Omit<WineData, 'id'>) => {
    if (!isSupabaseAvailable || !authManager.isAuthenticated()) {
      throw new Error('Non autenticato')
    }
    const userId = authManager.getUserId()
    if (!userId) {
      throw new Error('ID utente non disponibile')
    }
    try {
      const { data, error } = await supabase!
        .from('giacenze')
        .insert({
          nome: newWine.name,
          tipo: newWine.type,
          fornitore: newWine.supplier,
          giacenza: newWine.inventory,
          min_stock: newWine.minStock,
          prezzo: parseFloat(newWine.price),
          annata: newWine.vintage,
          regione: newWine.region,
          descrizione: newWine.description,
          user_id: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()
      if (error) throw error
      const transformedWine: WineData = {
        id: data.id,
        name: data.nome,
        type: data.tipo,
        supplier: data.fornitore,
        inventory: data.giacenza,
        minStock: data.min_stock,
        price: data.prezzo.toString(),
        vintage: data.annata,
        region: data.regione,
        description: data.descrizione
      }
      setWines(prev => [...prev, transformedWine])
      return transformedWine
    } catch (err) {
      console.error('Errore aggiunta vino:', err)
      throw err
    }
  }

  const deleteWine = async (wineId: number) => {
    if (!isSupabaseAvailable || !authManager.isAuthenticated()) {
      console.error('Non autenticato')
      return false
    }
    const userId = authManager.getUserId()
    if (!userId) {
      console.error('ID utente non disponibile')
      return false
    }
    try {
      const { error } = await supabase!
        .from('giacenze')
        .delete()
        .eq('id', wineId)
        .eq('user_id', userId)
      if (error) throw error
      setWines(prev => prev.filter(wine => wine.id !== wineId))
      return true
    } catch (err) {
      console.error('Errore eliminazione vino:', err)
      return false
    }
  }

  return {
    wines,
    suppliers,
    types,
    loading,
    error,
    isAuthenticated,
    refreshWines: loadWines,
    updateWineInventory,
    updateWine,
    addWine,
    deleteWine
  }
}
