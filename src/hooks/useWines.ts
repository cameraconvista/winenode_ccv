import { useState, useEffect } from 'react'
import { supabase, authManager, isSupabaseAvailable } from '../lib/supabase'

// Tipi per i dati dei vini da Supabase
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
  costo?: number; // Aggiungi campo costo opzionale
};

// Dati di fallback quando Supabase non è disponibile (lista vuota)
const fallbackWines: WineData[] = []

export function useWines() {
  const [wines, setWines] = useState<WineData[]>([])
  const [suppliers, setSuppliers] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Monitora lo stato di autenticazione
  useEffect(() => {
    const unsubscribe = authManager.onAuthStateChange((user) => {
      setIsAuthenticated(!!user)
      if (user) {
        loadWines()
      } else {
        setWines([])
        setSuppliers([])
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
        // Usa dati di fallback quando Supabase non è disponibile
        setWines(fallbackWines)
        const uniqueSuppliers = Array.from(new Set(fallbackWines.map(wine => wine.supplier)))
        setSuppliers(uniqueSuppliers)
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
        throw new Error('ID utente non disponibile')
      }

      // Carica vini da Supabase con filtro per utente
      const { data: wineData, error: wineError } = await supabase!
        .from('vini')
        .select('*')
        .eq('user_id', userId)
        .order('nome_vino')

      if (wineError) {
        console.error('Errore nel caricamento vini da Supabase:', wineError)
        
        // Se la tabella non esiste, usa dati di fallback invece di mostrare errore
        if (wineError.code === '42P01') {
          setWines(fallbackWines)
          const uniqueSuppliers = Array.from(new Set(fallbackWines.map(wine => wine.supplier)))
          setSuppliers(uniqueSuppliers)
          setLoading(false)
          return
        }
        
        throw wineError
      }

      // Trasforma i dati da Supabase al formato locale
      const transformedWines: WineData[] = (wineData || []).map((wine: any) => ({
        id: wine.id,
        name: wine.nome_vino,
        type: wine.tipologia,
        supplier: wine.fornitore,
        inventory: wine.giacenza,
        minStock: 0, // Valore default per compatibilità
        price: wine.prezzo_vendita?.toString() || '0',
        vintage: wine.anno, // ✅ CORRETTO: usa wine.anno invece di wine.provenienza
        region: wine.provenienza,
        description: wine.produttore,
        costo: wine.costo || 0 // Aggiungi il campo costo
      }))

      setWines(transformedWines)

      // Carica fornitori da Supabase con filtro per utente
      const { data: supplierData, error: supplierError } = await supabase!
        .from('fornitori')
        .select('nome')
        .eq('user_id', userId)

      if (supplierError) {
        console.error('Errore nel caricamento fornitori:', supplierError)
        // Estrai fornitori dai vini caricati
        const uniqueSuppliers = Array.from(new Set(transformedWines.map(wine => wine.supplier)))
        setSuppliers(uniqueSuppliers)
      } else {
        const supplierNames = (supplierData || []).map((s: any) => s.nome)
        setSuppliers(supplierNames)
      }

    } catch (err) {
      console.error('Errore nel caricamento dei vini:', err)
      setError(err instanceof Error ? err.message : 'Errore nel caricamento dei dati')
    } finally {
      setLoading(false)
    }
  }

  const updateWineInventory = async (wineId: number, newInventory: number) => {
    try {
      if (!isSupabaseAvailable || !authManager.isAuthenticated()) {
        throw new Error('Supabase non configurato o utente non autenticato')
      }

      const userId = authManager.getUserId()
      if (!userId) {
        throw new Error('ID utente non disponibile')
      }

      // Aggiorna su Supabase
      const { error } = await supabase!
        .from('vini')
        .update({ 
          giacenza: newInventory,
          updated_at: new Date().toISOString()
        })
        .eq('id', wineId)
        .eq('user_id', userId)

      if (error) {
        console.error('Errore nell\'aggiornamento giacenza su Supabase:', error)
        throw error
      }

      // Aggiorna localmente
      updateLocalWine(wineId, { inventory: newInventory })
      return true

    } catch (err) {
      console.error('Errore nell\'aggiornamento della giacenza:', err)
      return false
    }
  }

  const updateWine = async (wineId: number, updates: Partial<WineData>) => {
    try {
      if (!isSupabaseAvailable || !authManager.isAuthenticated()) {
        throw new Error('Supabase non configurato o utente non autenticato')
      }

      const userId = authManager.getUserId()
      if (!userId) {
        throw new Error('ID utente non disponibile')
      }

      // Trasforma gli aggiornamenti per Supabase
      const supabaseUpdates: any = {
        updated_at: new Date().toISOString()
      }

      if (updates.name !== undefined) supabaseUpdates.nome = updates.name
      if (updates.type !== undefined) supabaseUpdates.tipo = updates.type
      if (updates.supplier !== undefined) supabaseUpdates.fornitore = updates.supplier
      if (updates.inventory !== undefined) supabaseUpdates.giacenza = updates.inventory
      if (updates.minStock !== undefined) supabaseUpdates.min_stock = updates.minStock
      if (updates.price !== undefined) supabaseUpdates.prezzo = parseFloat(updates.price)
      if (updates.vintage !== undefined) supabaseUpdates.annata = updates.vintage
      if (updates.region !== undefined) supabaseUpdates.regione = updates.region
      if (updates.description !== undefined) supabaseUpdates.descrizione = updates.description

      // Aggiorna su Supabase
      const { error } = await supabase!
        .from('giacenze')
        .update(supabaseUpdates)
        .eq('id', wineId)
        .eq('user_id', userId)

      if (error) {
        console.error('Errore nell\'aggiornamento vino su Supabase:', error)
        throw error
      }

      // Aggiorna localmente
      updateLocalWine(wineId, updates)
      return true

    } catch (err) {
      console.error('Errore nell\'aggiornamento del vino:', err)
      return false
    }
  }

  const updateLocalWine = (wineId: number, updates: Partial<WineData>) => {
    setWines(prevWines => 
      prevWines.map(wine => 
        wine.id === wineId 
          ? { ...wine, ...updates }
          : wine
      )
    )
  }

  const addWine = async (newWine: Omit<WineData, 'id'>) => {
    try {
      if (!isSupabaseAvailable || !authManager.isAuthenticated()) {
        throw new Error('Supabase non configurato o utente non autenticato')
      }

      const userId = authManager.getUserId()
      if (!userId) {
        throw new Error('ID utente non disponibile')
      }

      // Aggiungi su Supabase
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

      if (error) {
        console.error('Errore nell\'aggiunta vino su Supabase:', error)
        throw error
      }

      // Trasforma e aggiungi localmente
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
      console.error('Errore nell\'aggiunta del vino:', err)
      throw err
    }
  }

  const deleteWine = async (wineId: number) => {
    try {
      if (!isSupabaseAvailable || !authManager.isAuthenticated()) {
        throw new Error('Supabase non configurato o utente non autenticato')
      }

      const userId = authManager.getUserId()
      if (!userId) {
        throw new Error('ID utente non disponibile')
      }

      // Elimina da Supabase
      const { error } = await supabase!
        .from('giacenze')
        .delete()
        .eq('id', wineId)
        .eq('user_id', userId)

      if (error) {
        console.error('Errore nell\'eliminazione vino da Supabase:', error)
        throw error
      }

      // Elimina localmente
      setWines(prev => prev.filter(wine => wine.id !== wineId))
      return true

    } catch (err) {
      console.error('Errore nell\'eliminazione del vino:', err)
      return false
    }
  }

  return {
    wines,
    suppliers,
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