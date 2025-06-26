
import { useEffect, useState } from 'react';
import { supabase, authManager } from '../lib/supabase';

export interface Anno {
  anno: number;
}

export function useAnno() {
  const [anni, setAnni] = useState<Anno[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAnni = async () => {
    try {
      setLoading(true);

      // Valida sessione prima di procedere
      const isValid = await authManager.validateSession();
      if (!isValid) {
        console.log('⚠️ Sessione non valida, anni vuoti');
        setAnni([]);
        setLoading(false);
        return;
      }

      console.log('🔍 Caricamento anni dal database');

      const { data, error } = await supabase
        .from('anno')
        .select('anno')
        .order('anno', { ascending: false });

      if (error) {
        console.error('❌ Errore caricamento anni:', error.message);
        setAnni([]);
      } else {
        console.log('✅ Anni ricevuti da Supabase:', data);
        if (data) {
          setAnni(data);
          console.log('✅ Anni mappati:', data.length);
        }
      }
    } catch (error) {
      console.error('❌ Errore nel caricamento anni:', error);
      setAnni([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnni();
  }, []);

  return { 
    anni, 
    loading, 
    refreshAnni: fetchAnni 
  };
}
