import { useEffect, useState } from 'react';
import { supabase, authManager } from '../lib/supabase';

export interface Tipologia {
  id: string;
  nome: string;
  colore?: string;
}

export function useTipologie() {
  const [tipologie, setTipologie] = useState<Tipologia[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTipologie = async () => {
    try {
      setLoading(true);

      // Valida sessione prima di procedere
      const isValid = await authManager.validateSession();
      if (!isValid) {
        console.log('⚠️ Sessione non valida, tipologie vuote');
        setTipologie([]);
        setLoading(false);
        return;
      }

      const userId = authManager.getUserId();
      if (!userId) {
        console.log('⚠️ Utente non autenticato, tipologie vuote');
        setTipologie([]);
        setLoading(false);
        return;
      }

      console.log('🔍 Caricamento tipologie per user:', userId);

      // Prima prova a caricare con la colonna colore
      let { data, error } = await supabase
        .from('tipologie')
        .select('id, nome, colore')
        .eq('user_id', userId)
        .order('nome');

      // Se la colonna colore non esiste, carica senza di essa
      if (error && error.message.includes('column tipologie.colore does not exist')) {
        console.log('⚠️ Colonna colore non presente, caricamento senza colore');
        const result = await supabase
          .from('tipologie')
          .select('id, nome')
          .eq('user_id', userId)
          .order('nome');

        data = result.data;
        error = result.error;

        // Aggiungi colore di default
        if (data) {
          data = data.map(tip => ({ ...tip, colore: '#cccccc' }));
        }
      }

      if (error) {
        console.error('❌ Errore caricamento tipologie:', error.message);
        console.error('❌ Dettagli errore:', error);
        setTipologie([]);
      } else {
        console.log('✅ Tipologie ricevute da Supabase:', data);
        if (data) {
          const tipologieData = data.map(tipologia => ({
            id: tipologia.id,
            nome: tipologia.nome,
            colore: tipologia.colore || '#cccccc'
          }));
          setTipologie(tipologieData);
          console.log('✅ Tipologie mappate:', tipologieData.length);
        }
      }
    } catch (error) {
      console.error('❌ Errore nel caricamento tipologie:', error);
      setTipologie([]);
    } finally {
      setLoading(false);
    }
  };

  const addTipologia = async (nome: string, colore: string = '#cccccc'): Promise<boolean> => {
    try {
      // Ottieni l'utente autenticato tramite Supabase auth
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error("❌ Errore nel recupero utente:", userError.message);
        return false;
      }

      if (!userData.user) {
        console.error('❌ Utente non autenticato');
        return false;
      }

      const userId = userData.user.id;

      // Controllo diretto su Supabase per duplicati
      const { data: existingData, error: checkError } = await supabase
        .from('tipologie')
        .select('id, nome')
        .eq('user_id', userId)
        .ilike('nome', nome.trim());

      if (checkError) {
        console.error('❌ Errore nel controllo duplicati:', checkError.message);
        return false;
      }

      if (existingData && existingData.length > 0) {
        console.log('⚠️ Tipologia già esistente su Supabase:', nome);
        return false;
      }

      let { data, error } = await supabase
        .from('tipologie')
        .insert({
          user_id: userId,
          nome: nome.trim().toUpperCase(),
          colore: colore
        })
        .select()
        .single();

      // Se la colonna colore non esiste, inserisci senza di essa
      if (error && error.message.includes('column "colore" of relation "tipologie" does not exist')) {
        const result = await supabase
          .from('tipologie')
          .insert({
            user_id: userId,
            nome: nome.trim().toUpperCase()
          })
          .select()
          .single();

        data = result.data;
        error = result.error;

        // Aggiungi colore di default al risultato
        if (data) {
          data = { ...data, colore: '#cccccc' };
        }
      }

      if (error) {
        console.error('❌ Errore inserimento tipologia:', error.message);
        console.error('❌ Dettagli errore:', error);
        return false;
      }

      console.log('✅ Tipologia aggiunta con successo:', data);

      // Ricarica le tipologie
      await fetchTipologie();
      return true;
    } catch (error) {
      console.error('❌ Errore nell\'aggiunta della tipologia:', error);
      return false;
    }
  };

  const removeTipologia = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('tipologie')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Errore nella rimozione della tipologia:', error.message);
        return false;
      }

      // Ricarica le tipologie
      await fetchTipologie();
      return true;
    } catch (error) {
      console.error('❌ Errore nella rimozione della tipologia:', error);
      return false;
    }
  };

  const updateTipologia = async (id: string, nuovoNome: string, nuovoColore?: string): Promise<boolean> => {
    try {
      // Prima ricarica i dati da Supabase
      await fetchTipologie();

      // Verifica se il nuovo nome esiste già (escludendo quello corrente)
      const exists = tipologie.some(t => t.id !== id && t.nome.toLowerCase() === nuovoNome.toLowerCase());
      if (exists) {
        return false;
      }

      // Controllo aggiuntivo direttamente su Supabase
      const { data: existingData, error: checkError } = await supabase
        .from('tipologie')
        .select('id')
        .ilike('nome', nuovoNome.trim())
        .neq('id', id)
        .limit(1);

      if (checkError) {
        console.error('❌ Errore nel controllo duplicati:', checkError.message);
        return false;
      }

      if (existingData && existingData.length > 0) {
        return false;
      }

      const updateData: any = {
        nome: nuovoNome.trim()
      };

      if (nuovoColore !== undefined) {
        updateData.colore = nuovoColore;
      }

      let { error } = await supabase
        .from('tipologie')
        .update(updateData)
        .eq('id', id);

      // Se la colonna colore non esiste, aggiorna solo il nome
      if (error && error.message.includes('column "colore" of relation "tipologie" does not exist')) {
        const result = await supabase
          .from('tipologie')
          .update({ nome: nuovoNome.trim() })
          .eq('id', id);

        error = result.error;
      }

      if (error) {
        console.error('❌ Errore aggiornamento tipologia:', error.message);
        return false;
      }

      // Ricarica le tipologie
      await fetchTipologie();
      return true;
    } catch (error) {
      console.error('❌ Errore nell\'aggiornamento della tipologia:', error);
      return false;
    }
  };

  useEffect(() => {
    // Hook mantenuto per futura configurazione manuale
    // Popolazione automatica disabilitata
    setLoading(false);
  }, []);

  return { 
    tipologie, 
    loading, 
    addTipologia, 
    removeTipologia, 
    updateTipologia,
    refreshTipologie: fetchTipologie 
  };
}