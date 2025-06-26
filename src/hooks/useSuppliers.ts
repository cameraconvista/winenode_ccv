import { useState, useEffect } from 'react';
import { supabase, authManager, isSupabaseAvailable } from '../lib/supabase';

export interface Supplier {
  id: string;
  nome: string;
  email: string;
  telefono: string;
  created_at: string;
}

export const useSuppliers = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSuppliers = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const isValid = await authManager.validateSession();
      if (!isValid) {
        console.log('⚠️ Sessione non valida, fornitori vuoti');
        setSuppliers([]);
        setIsLoading(false);
        return;
      }

      const userId = authManager.getUserId();
      console.log('User ID:', userId); // <-- Qui

      if (!userId) {
        console.log('⚠️ SUPPLIERS: Utente non autenticato');
        setSuppliers([]);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase!
        .from('fornitori')
        .select('id, nome, email, telefono, created_at')
        .eq('user_id', userId)
        .order('nome');

      if (error) {
        console.error('Errore caricamento fornitori:', error.message);
        setError(error.message);
        setSuppliers([]);
      } else {
        setSuppliers(data || []);
        console.log('✅ Fornitori caricati:', data?.length || 0);
      }
    } catch (error) {
      console.error('Errore nel caricamento fornitori:', error);
      setError(error instanceof Error ? error.message : 'Errore sconosciuto');
      setSuppliers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchSuppliers = async () => {
      if (!authManager.isAuthenticated() || !supabase) {
        console.log('🔍 useSuppliers: Non autenticato o Supabase non disponibile');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const userId = authManager.getUserId();
        if (!userId) {
          console.warn('🔍 useSuppliers: User ID non disponibile');
          setSuppliers([]);
          setIsLoading(false);
          return;
        }

        console.log('🔍 useSuppliers: Caricamento fornitori per user:', userId);

        const { data, error } = await supabase
          .from('fornitori')
          .select('*')
          .eq('user_id', userId)
          .order('nome');

        if (error) {
          console.error('❌ useSuppliers: Errore query:', error);
          setError(error.message);
          setSuppliers([]);
        } else {
          console.log('✅ useSuppliers: Caricati', data?.length || 0, 'fornitori:', data);
          setSuppliers(data || []);
        }
      } catch (err) {
        console.error('❌ useSuppliers: Errore generale:', err);
        setError(err instanceof Error ? err.message : 'Errore sconosciuto');
        setSuppliers([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuppliers();
  }, []);

  const refreshSuppliers = () => {
    setIsLoading(true);
    fetchSuppliers();
  };

  const addSupplier = async (nome: string, email: string, telefono: string): Promise<boolean> => {
    try {
      if (!isSupabaseAvailable) {
        console.error('Supabase non disponibile');
        return false;
      }

      const userId = authManager.getUserId();
      if (!userId) {
        console.error('User ID non disponibile');
        return false;
      }

      console.log('🔄 Tentativo inserimento fornitore:', { nome, email, telefono });

      const { data: existingData, error: checkError } = await supabase!
        .from('fornitori')
        .select('id, nome')
        .eq('user_id', userId)
        .eq('nome', nome.trim().toUpperCase())
        .limit(1);

      if (checkError) {
        console.error('Errore controllo duplicati fornitori:', checkError);
        return false;
      }

      if (existingData && existingData.length > 0) {
        console.error('❌ Fornitore già esistente su Supabase:', nome);
        return false;
      }

      const { data, error } = await supabase!
        .from('fornitori')
        .insert({
          user_id: userId,
          nome: nome.trim().toUpperCase(),
          email: email.trim(),
          telefono: telefono.trim()
        })
        .select('id, nome, email, telefono, created_at')
        .single();

      if (error) {
        console.error('❌ Errore inserimento fornitore:', error);

        if (error.code === '23505') {
          console.error('Errore: Fornitore duplicato');
        } else if (error.code === '42501') {
          console.error('Errore: Permessi insufficienti (RLS)');
        }
        return false;
      }

      console.log('✅ Fornitore aggiunto con successo:', data);

      await fetchSuppliers();
      return true;

    } catch (error) {
      console.error('❌ Errore inaspettato in addSupplier:', error);
      return false;
    }
  };

  const updateSupplier = async (id: string, nuovoNome: string, nuovaEmail: string, nuovoTelefono: string): Promise<boolean> => {
    try {
      await fetchSuppliers();

      const exists = suppliers.some(s => s.id !== id && s.nome.toLowerCase() === nuovoNome.toLowerCase());
      if (exists) {
        console.error('Nome fornitore già esistente:', nuovoNome);
        return false;
      }

      const userId = authManager.getUserId();
      if (!userId) {
        console.error('User ID non disponibile');
        return false;
      }

      const { data: existingData, error: checkError } = await supabase
        .from('fornitori')
        .select('id')
        .eq('user_id', userId)
        .eq('nome', nuovoNome.trim())
        .neq('id', id)
        .limit(1);

      if (checkError) {
        console.error('Errore controllo duplicati fornitori:', checkError);
        return false;
      }

      if (existingData && existingData.length > 0) {
        console.error('Fornitore già esistente su Supabase:', nuovoNome);
        return false;
      }

      const { data, error } = await supabase
        .from('fornitori')
        .update({
          nome: nuovoNome.trim(),
          email: nuovaEmail.trim(),
          telefono: nuovoTelefono.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Errore aggiornamento fornitore:', error);
        return false;
      }

      console.log('✅ Fornitore aggiornato:', data);
      await fetchSuppliers();
      return true;
    } catch (error) {
      console.error('Errore in updateSupplier:', error);
      return false;
    }
  };

  return {
    suppliers,
    isLoading,
    error,
    refreshSuppliers,
    addSupplier,
    updateSupplier
  };
};