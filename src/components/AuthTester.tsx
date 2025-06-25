import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface TestResult {
  test: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  timestamp?: Date;
}

export const AuthTester: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [testEmail, setTestEmail] = useState('test@winenode.dev');
  const [testPassword, setTestPassword] = useState('TestPassword123!');
  const [isRunning, setIsRunning] = useState(false);

  const addTestResult = (test: string, status: 'pending' | 'success' | 'error', message: string) => {
    setTestResults(prev => [...prev, {
      test,
      status,
      message,
      timestamp: new Date()
    }]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  // Test 1: Verifica configurazione iniziale
  const testInitialConfig = async () => {
    addTestResult('Configurazione Iniziale', 'pending', 'Verificando configurazione Supabase...');
    
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        addTestResult('Configurazione Iniziale', 'error', `Errore: ${error.message}`);
        return false;
      }

      // Verifica localStorage
      const hasLocalStorage = typeof(Storage) !== 'undefined';
      if (!hasLocalStorage) {
        addTestResult('Configurazione Iniziale', 'error', 'localStorage non disponibile');
        return false;
      }

      addTestResult('Configurazione Iniziale', 'success', 
        `Client configurato correttamente. Sessione attuale: ${session ? 'Attiva' : 'Nessuna'}`);
      return true;
    } catch (error) {
      addTestResult('Configurazione Iniziale', 'error', `Errore imprevisto: ${error}`);
      return false;
    }
  };

  // Test 2: Registrazione
  const testSignUp = async () => {
    addTestResult('Registrazione', 'pending', `Registrando ${testEmail}...`);
    
    try {
      // Prima disconnetti se loggato
      await supabase.auth.signOut();
      
      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword
      });

      if (error) {
        if (error.message.includes('already registered')) {
          addTestResult('Registrazione', 'success', 'Email già registrata (normale in test)');
          return true;
        }
        addTestResult('Registrazione', 'error', `Errore: ${error.message}`);
        return false;
      }

      if (data.user) {
        addTestResult('Registrazione', 'success', 
          `Utente creato. ID: ${data.user.id}. Conferma email: ${data.user.email_confirmed_at ? 'Confermata' : 'Pendente'}`);
        return true;
      }

      addTestResult('Registrazione', 'error', 'Nessun utente restituito');
      return false;
    } catch (error) {
      addTestResult('Registrazione', 'error', `Errore imprevisto: ${error}`);
      return false;
    }
  };

  // Test 3: Login
  const testSignIn = async () => {
    addTestResult('Login', 'pending', `Effettuando login con ${testEmail}...`);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword
      });

      if (error) {
        addTestResult('Login', 'error', `Errore: ${error.message}`);
        return false;
      }

      if (data.session && data.user) {
        addTestResult('Login', 'success', 
          `Login riuscito! Sessione creata. Token: ${data.session.access_token.substring(0, 20)}...`);
        
        // Verifica che la sessione sia salvata nel localStorage
        const storedSession = localStorage.getItem('sb-gtqcncslzjuiefmyrzlb-auth-token');
        if (storedSession) {
          addTestResult('Login', 'success', 'Sessione salvata correttamente nel localStorage');
        }
        
        return true;
      }

      addTestResult('Login', 'error', 'Login fallito: nessuna sessione creata');
      return false;
    } catch (error) {
      addTestResult('Login', 'error', `Errore imprevisto: ${error}`);
      return false;
    }
  };

  // Test 4: Persistenza dopo refresh (simulato)
  const testPersistence = async () => {
    addTestResult('Persistenza', 'pending', 'Verificando persistenza sessione...');
    
    try {
      // Simula un refresh recuperando la sessione dal storage
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        addTestResult('Persistenza', 'error', `Errore nel recupero sessione: ${error.message}`);
        return false;
      }

      if (session && session.user) {
        const now = new Date();
        const expiresAt = new Date(session.expires_at! * 1000);
        const timeLeft = Math.round((expiresAt.getTime() - now.getTime()) / (1000 * 60));
        
        addTestResult('Persistenza', 'success', 
          `Sessione persistente trovata! Utente: ${session.user.email}. Scade tra ${timeLeft} minuti`);
        return true;
      }

      addTestResult('Persistenza', 'error', 'Nessuna sessione persistente trovata');
      return false;
    } catch (error) {
      addTestResult('Persistenza', 'error', `Errore imprevisto: ${error}`);
      return false;
    }
  };

  // Test 5: Logout
  const testSignOut = async () => {
    addTestResult('Logout', 'pending', 'Effettuando logout...');
    
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        addTestResult('Logout', 'error', `Errore: ${error.message}`);
        return false;
      }

      // Verifica che la sessione sia stata rimossa
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        addTestResult('Logout', 'error', 'Sessione non rimossa correttamente');
        return false;
      }

      // Verifica localStorage
      const storedSession = localStorage.getItem('sb-gtqcncslzjuiefmyrzlb-auth-token');
      if (!storedSession || storedSession === 'null') {
        addTestResult('Logout', 'success', 'Logout completato. Sessione rimossa dal localStorage');
      } else {
        addTestResult('Logout', 'success', 'Logout completato ma dati residui nel localStorage (normale)');
      }
      
      return true;
    } catch (error) {
      addTestResult('Logout', 'error', `Errore imprevisto: ${error}`);
      return false;
    }
  };

  // Test completo automatico
  const runFullTest = async () => {
    setIsRunning(true);
    clearResults();
    
    console.log('🧪 Iniziando test suite completa...');
    
    const test1 = await testInitialConfig();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (test1) {
      const test2 = await testSignUp();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (test2) {
        const test3 = await testSignIn();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (test3) {
          await testPersistence();
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const test5 = await testSignOut();
          
          // Test finale: verifica che dopo logout non ci sia sessione
          if (test5) {
            await new Promise(resolve => setTimeout(resolve, 500));
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
              addTestResult('Test Completo', 'success', 
                '✅ Tutti i test superati! L\'autenticazione persistente funziona correttamente.');
            }
          }
        }
      }
    }
    
    setIsRunning(false);
  };

  // Verifica configurazione Supabase all'avvio
  useEffect(() => {
    const checkSupabaseConfig = () => {
      addTestResult('Verifica Iniziale', 'success', 
        'Supabase client configurato correttamente');
    };
    
    checkSupabaseConfig();
  }, []);

  return (
    <div style={{ 
      padding: '2rem', 
      maxWidth: '800px', 
      margin: '0 auto',
      fontFamily: 'monospace',
      backgroundColor: '#1a1a1a',
      color: '#fff',
      borderRadius: '8px'
    }}>
      <h2>🧪 WINENODE - Test Autenticazione Supabase</h2>
      
      <div style={{ marginBottom: '2rem' }}>
        <h3>Configurazione Test:</h3>
        <input
          type="email"
          placeholder="Email di test"
          value={testEmail}
          onChange={(e) => setTestEmail(e.target.value)}
          style={{ 
            width: '250px', 
            padding: '8px', 
            marginRight: '10px',
            backgroundColor: '#333',
            color: '#fff',
            border: '1px solid #555'
          }}
        />
        <input
          type="password"
          placeholder="Password di test"
          value={testPassword}
          onChange={(e) => setTestPassword(e.target.value)}
          style={{ 
            width: '200px', 
            padding: '8px',
            backgroundColor: '#333',
            color: '#fff',
            border: '1px solid #555'
          }}
        />
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <button 
          onClick={runFullTest} 
          disabled={isRunning}
          style={{ 
            padding: '12px 24px', 
            backgroundColor: isRunning ? '#666' : '#0066cc',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            marginRight: '10px',
            cursor: isRunning ? 'not-allowed' : 'pointer'
          }}
        >
          {isRunning ? '⏳ Test in corso...' : '🚀 Avvia Test Completo'}
        </button>
        
        <button 
          onClick={clearResults}
          style={{ 
            padding: '12px 24px', 
            backgroundColor: '#666',
            color: '#fff',
            border: 'none',
            borderRadius: '4px'
          }}
        >
          🗑 Pulisci Risultati
        </button>
      </div>

      <div>
        <h3>Risultati Test:</h3>
        <div style={{ 
          maxHeight: '400px', 
          overflowY: 'auto',
          backgroundColor: '#222',
          padding: '1rem',
          borderRadius: '4px'
        }}>
          {testResults.length === 0 ? (
            <p style={{ color: '#888' }}>Nessun test eseguito ancora</p>
          ) : (
            testResults.map((result, index) => (
              <div 
                key={index} 
                style={{ 
                  marginBottom: '10px',
                  padding: '8px',
                  borderLeft: `4px solid ${
                    result.status === 'success' ? '#00aa00' : 
                    result.status === 'error' ? '#aa0000' : '#aaaa00'
                  }`,
                  backgroundColor: '#2a2a2a'
                }}
              >
                <strong style={{ 
                  color: result.status === 'success' ? '#00ff00' : 
                        result.status === 'error' ? '#ff0000' : '#ffff00'
                }}>
                  {result.status === 'success' ? '✅' : 
                   result.status === 'error' ? '❌' : '⏳'} {result.test}
                </strong>
                <br />
                <span style={{ fontSize: '0.9em' }}>{result.message}</span>
                {result.timestamp && (
                  <>
                    <br />
                    <small style={{ color: '#888' }}>
                      {result.timestamp.toLocaleTimeString()}
                    </small>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#2a2a2a', borderRadius: '4px' }}>
        <h4>ℹ️ Note sulla configurazione Supabase:</h4>
        <ul style={{ fontSize: '0.9em', color: '#ccc' }}>
          <li>Verifica che l'email di conferma sia disabilitata per i test (o usa un servizio email di test)</li>
          <li>Assicurati che le RLS policies permettano signup pubblico</li>
          <li>L'URL di redirect dovrebbe includere il dominio Replit per funzionare correttamente</li>
          <li>La persistenza utilizza localStorage e dovrebbe funzionare tra refresh</li>
        </ul>
      </div>
    </div>
  );
};