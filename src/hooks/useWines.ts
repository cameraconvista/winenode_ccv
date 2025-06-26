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
  costo?: number;
};

const fallbackWines: WineData[] = []

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
    try {
      setLoading(true)
      setError(null)

      if (!isSupabaseAvailable) {
        setWines(fallbackWines)
        const uniqueSuppliers = Array.from(new Set(fallbackWines.map(wine => wine.supplier)))
        setSuppliers(uniqueSuppliers)
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
      if (!userId) throw new Error('ID utente non disponibile')

      const { data: wineData, error: wineError } = await supabase!
        .from('vini')
        .select('*')
        .eq('user_id', userId)
        .order('nome_vino')

      if (wineError) {
        if (wineError.code === '42P01') {
          setWines(fallbackWines)
          const uniqueSuppliers = Array.from(new Set(fallbackWines.map(wine => wine.supplier)))
          setSuppliers(uniqueSuppliers)
          setTypes([])
          setLoading(false)
          return
        }
        throw wineError
      }

      const transformedWines: WineData[] = (wineData || []).map((wine: any) => ({
        id: wine.id,
        name: wine.nome_vino,
        type: wine.tipologia,
        supplier: wine.fornitore,
        inventory: wine.giacenza,
        minStock: 0,
        price: wine.prezzo_vendita?.toString() || '0',
        vintage: wine.anno,
        region: wine.provenienza,
        description: wine.produttore,
        costo: wine.costo || 0
      }))

      setWines(transformedWines)

      const { data: supplierData, error: supplierError } = await supabase!
        .from('fornitori')
        .select('nome')
        .eq('user_id', userId)

      if (supplierError) {
        const uniqueSuppliers = Array.from(new Set(transformedWines.map(wine => wine.supplier)))
        setSuppliers(uniqueSuppliers)
      } else {
        const supplierNames = (supplierData || []).map((s: any) => s.nome)
        setSuppliers(supplierNames)
      }

      const { data: typeData, error: typeError } = await supabase!
        .from('tipologie')
        .select('nome')
        .eq('user_id', userId)

      if (typeError) {
        console.error('Errore nel caricamento tipologie:', typeError)
      } else {
        const typeNames = (typeData || []).map((t: any) => t.nome)
        setTypes(typeNames)
      }

    } catch (err) {
      console.error('Errore nel caricamento dei vini:', err)
      setError(err instanceof Error ? err.message : 'Errore nel caricamento dei dati')
    } finally {
      setLoading(false)
    }
  }

  const updateLocalWine = (wineId: number, updates: Partial<WineData>) => {
    setWines(prev =>
      prev.map(wine => (wine.id === wineId ? { ...wine, ...updates } : wine))
    )
  }

  const updateWineInventory = async (wineId: number, newInventory: number) => {
    try {
      if (!isSupabaseAvailable || !authManager.isAuthenticated()) throw new Error('Non autenticato')
      const userId = authManager.getUserId()
      if (!userId) throw new Error('ID utente non disponibile')

      const { error } = await supabase!
        .from('vini')
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
    try {
      if (!isSupabaseAvailable || !authManager.isAuthenticated()) throw new Error('Non autenticato')
      const userId = authManager.getUserId()
      if (!userId) throw new Error('ID utente non disponibile')

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
    try {
      if (!isSupabaseAvailable || !authManager.isAuthenticated()) throw new Error('Non autenticato')
      const userId = authManager.getUserId()
      if (!userId) throw new Error('ID utente non disponibile')

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
    try {
      if (!isSupabaseAvailable || !authManager.isAuthenticated()) throw new Error('Non autenticato')
      const userId = authManager.getUserId()
      if (!userId) throw new Error('ID utente non disponibile')

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
