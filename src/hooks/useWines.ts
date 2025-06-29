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
        .from('vini')
        .select('*')
        .eq('user_id', userId)
        .order('nome_vino')

      if (wineError) {
        if (wineError.code === '42P01') {
          setWines(fallbackWines)
          setSuppliers(Array.from(new Set(fallbackWines.map(w => w.supplier))))
          setTypes([])
          setLoading(false)
          return
        }
        throw wineError
      }

      const transformedWines = (wineData || []).map((wine: any) => ({
        id: wine.id,
        name: wine.nome_vino,
        type: wine.tipologia,
        supplier: wine.fornitore,
        inventory: wine.giacenza,
        minStock: wine.min_stock ?? 0,
        price: wine.prezzo_vendita?.toString() ?? '0',
        vintage: wine.anno,
        region: wine.provenienza,
        description: wine.produttore
      }))

      setWines(transformedWines)

      const [{ data: supplierData, error: supplierError }, { data: typeData, error: typeError }] =
        await Promise.all([
          supabase!.from('fornitori').select('nome').eq('user_id', userId),
          supabase!.from('tipologie').select('nome').eq('user_id', userId)
        ])

      setSuppliers(
        supplierError
          ? Array.from(new Set(transformedWines.map(w => w.supplier)))
          : (supplierData || []).map((s: any) => s.nome)
      )

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
    if (updates.name !== undefined) supabaseUpdates.nome_vino = updates.name
    if (updates.type !== undefined) supabaseUpdates.tipologia = updates.type
    if (updates.supplier !== undefined) supabaseUpdates.fornitore = updates.supplier
    if (updates.inventory !== undefined) supabaseUpdates.giacenza = updates.inventory
    if (updates.minStock !== undefined) supabaseUpdates.min_stock = updates.minStock
    if (updates.price !== undefined) supabaseUpdates.prezzo_vendita = parseFloat(updates.price)
    if (updates.vintage !== undefined) supabaseUpdates.anno = updates.vintage
    if (updates.region !== undefined) supabaseUpdates.provenienza = updates.region
    if (updates.description !== undefined) supabaseUpdates.produttore = updates.description

    try {
      const { error } = await supabase!
        .from('vini')
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
        .from('vini')
        .insert({
          nome_vino: newWine.name,
          tipologia: newWine.type,
          fornitore: newWine.supplier,
          giacenza: newWine.inventory,
          min_stock: newWine.minStock,
          prezzo_vendita: parseFloat(newWine.price),
          anno: newWine.vintage,
          provenienza: newWine.region,
          produttore: newWine.description,
          user_id: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()
      if (error) throw error
      const transformedWine: WineData = {
        id: data.id,
        name: data.nome_vino,
        type: data.tipologia,
        supplier: data.fornitore,
        inventory: data.giacenza,
        minStock: data.min_stock,
        price: data.prezzo_vendita.toString(),
        vintage: data.anno,
        region: data.provenienza,
        description: data.produttore
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
        .from('vini')
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
