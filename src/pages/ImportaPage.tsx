import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, authManager } from '../lib/supabase';
import WineConfirmModal from '../components/WineConfirmModal';
import { normalizzaAnnata, paroleDaEscludereComeProduttore, regioni } from '../lib/wineProcessing';
import { useTipologie } from '../hooks/useTipologie';

export default function ImportaPage() {
  const navigate = useNavigate();
  const { tipologie } = useTipologie();

  // Stati principali
  const [textAreaContent, setTextAreaContent] = useState('');
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [aiStep, setAiStep] = useState<'idle' | 'cleaning' | 'optimizing' | 'completed'>('idle');

  // Stati per il modale di conferma
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [parsedWines, setParsedWines] = useState<any[]>([]);
  const [currentWineIndex, setCurrentWineIndex] = useState(0);
  const [arrayViniConfermati, setArrayViniConfermati] = useState<any[]>([]);
  const [showSummary, setShowSummary] = useState(false);

  // Stati per categoria
  const [categoriaApplicaATutti, setCategoriaApplicaATutti] = useState<string>('');
  const [applicaATutti, setApplicaATutti] = useState(false);

  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: userData, error } = await supabase.auth.getUser();
      if (!error && userData?.user) {
        setUser(userData.user);
      }
    };
    fetchUser();
  }, []);

  // Database simulato di produttori per ottimizzazione
  const produttoriNoti = {
    'BAROLO': 'MARCHESI DI BAROLO',
    'CHIANTI': 'CASTELLO DI VERRAZZANO', 
    'PROSECCO': 'VILLA SANDI',
    'FRANCIACORTA': 'CA\' DEL BOSCO',
    'AMARONE': 'ALLEGRINI',
    'CHAMPAGNE': 'MOËT & CHANDON',
    'BRUNELLO': 'BIONDI SANTI',
    'BARBARESCO': 'GAJA'
  };

  // Funzione di pulizia ottimizzata
  const handleClean = async () => {
    if (!textAreaContent.trim()) return;

    const lines = textAreaContent.split(/\r?\n+/).filter(line => line.trim());
    const cleanedLines = lines.map(line => {
      // Rimuovi caratteri speciali e normalizza
      let cleanedLine = line
        .replace(/[()[\]{}\-_/\\.*]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .toUpperCase();

      // Estrai e rimuovi prezzo
      const priceRegex = /(\d{1,4}(?:[,.]\d{1,2})?\s*(?:€|euro|EUR))/gi;
      cleanedLine = cleanedLine.replace(priceRegex, '').trim();

      return cleanedLine;
    }).filter(line => line.length > 10);

    setTextAreaContent(cleanedLines.join('\n'));
    await new Promise(resolve => setTimeout(resolve, 500)); // Ridotto timeout
  };

  // Funzione di ottimizzazione migliorata
  const handleOptimizeStep = async () => {
    if (!textAreaContent.trim()) return;

    let lines = textAreaContent.split(/\r?\n+/).filter(line => line.trim().length > 10);

    // Separazione automatica per righe lunghe
    if (lines.length === 1 && lines[0].length > 200) {
      const rigaLunga = lines[0];
      const patternPrezzi = /(\s*[-–]\s*\d{1,4}(?:[,.]\d{1,2})?\s*€)/gi;
      const parti = rigaLunga.split(patternPrezzi);
      const viniSeparati = parti.filter((_, i) => i % 2 === 0 && parti[i].trim().length > 10);

      if (viniSeparati.length > 1) {
        lines = viniSeparati.map(v => v.trim());
      }
    }

    const optimizedLines = lines.map(rigaOriginale => {
      try {
        // Rimuovi prezzi
        let rigaPulita = rigaOriginale
          .replace(/\s*[-–]?\s*\d{1,4}(?:[,.]\d{1,2})?\s*(?:€|euro)/gi, '')
          .replace(/[()[\]{}]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        let nomeVino = '';
        let produttore = '';
        let regione = '';

        // Pattern con doppio spazio/tab
        const patternDoppioSpazio = /(.+?)(\s{2,}|\t+)(.+)/;
        const matchDoppioSpazio = rigaPulita.match(patternDoppioSpazio);

        if (matchDoppioSpazio) {
          nomeVino = matchDoppioSpazio[1].trim();
          const restoParte = matchDoppioSpazio[3].trim();

          const partiVirgola = restoParte.split(',');
          if (partiVirgola.length >= 2) {
            produttore = partiVirgola[0].trim();
            regione = partiVirgola.slice(1).join(',').trim();
          } else {
            // Cerca regione conosciuta
            const regioneTrovata = regioni.find(reg => restoParte.toUpperCase().includes(reg));
            if (regioneTrovata) {
              regione = regioneTrovata;
              produttore = restoParte.replace(new RegExp(`\\b${regioneTrovata}\\b`, 'gi'), '').trim();
            } else {
              produttore = restoParte;
            }
          }
        } else {
          // Pattern con virgole
          const partiVirgola = rigaPulita.split(',').map(p => p.trim());

          if (partiVirgola.length >= 2) {
            nomeVino = partiVirgola[0];

            // Cerca regione
            const regioneTrovata = regioni.find(reg => 
              partiVirgola.some(parte => parte.toUpperCase().includes(reg))
            );

            if (regioneTrovata) {
              regione = regioneTrovata;
              produttore = partiVirgola[1].replace(new RegExp(`\\b${regioneTrovata}\\b`, 'gi'), '').trim();
            } else {
              produttore = partiVirgola[1];
            }
          } else {
            nomeVino = rigaPulita;
          }
        }

        // Validazione produttore
        if (produttore && paroleDaEscludereComeProduttore.includes(produttore.toUpperCase())) {
          produttore = '';
        }

        // Ricerca produttore nel database simulato
        if (!produttore) {
          const nomeBase = nomeVino.split(' ').slice(0, 2).join(' ').toUpperCase();
          const produttoreTrovato = Object.entries(produttoriNoti).find(([vino]) => 
            nomeBase.includes(vino)
          );
          if (produttoreTrovato) {
            produttore = produttoreTrovato[1];
          }
        }

        // Costruisci riga ottimizzata
        let rigaOttimizzata = nomeVino.toUpperCase();
        if (produttore) {
          rigaOttimizzata += `  ${produttore.toUpperCase()}`;
        }
        if (regione) {
          rigaOttimizzata += `, ${regione.toUpperCase()}`;
        }

        return rigaOttimizzata;
      } catch (error) {
        return rigaOriginale.replace(/\s*[-–]?\s*\d{1,4}(?:[,.]\d{1,2})?\s*€/gi, '').trim();
      }
    });

    setTextAreaContent(optimizedLines.join('\n'));
  };

  // Funzione principale di ottimizzazione
  const handleOptimize = async () => {
    if (!textAreaContent.trim()) {
      alert('Inserisci del testo prima di procedere con l\'ottimizzazione');
      return;
    }

    setIsProcessingAI(true);

    try {
      setAiStep('cleaning');
      await handleClean();

      setAiStep('optimizing');
      await handleOptimizeStep();

      setAiStep('completed');

      setTimeout(() => {
        setAiStep('idle');
        setIsProcessingAI(false);
      }, 2000);

    } catch (error) {
      console.error('Errore durante l\'ottimizzazione:', error);
      setAiStep('idle');
      setIsProcessingAI(false);
      alert('Errore durante l\'ottimizzazione');
    }
  };

  // Parsing ottimizzato per analisi lista
  const handleAnalyzeList = () => {
    if (!textAreaContent.trim()) return;

    const lines = textAreaContent.split(/\r?\n+/).filter(line => line.trim().length > 10);

    if (lines.length === 0) {
      alert('❌ Nessuna riga valida trovata nel testo.');
      return;
    }

    const parsedWines = lines.map((line, index) => {
      let workingLine = normalizzaAnnata(line.trim());

      // Rimuovi prezzi
      workingLine = workingLine.replace(/–?\s*(\d{1,4}(?:[,.]\d{1,2})?)\s*€/gi, '').trim();

      // Estrai anno
      let annoParsed = '';
      const annoMatch = workingLine.match(/\b(19|20)(\d{2})\b/);
      if (annoMatch) {
        annoParsed = annoMatch[0];
      }

      let nomeVino = '';
      let produttore = '';
      let provenienza = '';

      // Pattern doppio spazio
      const patternDoppioSpazio = /(.+?)(\s{2,}|\t+)(.+)/;
      const matchDoppioSpazio = workingLine.match(patternDoppioSpazio);

      if (matchDoppioSpazio) {
        nomeVino = matchDoppioSpazio[1].trim();
        const restoParte = matchDoppioSpazio[3].trim();

        const partiVirgola = restoParte.split(',');
        if (partiVirgola.length >= 2) {
          produttore = partiVirgola[0].trim();
          provenienza = partiVirgola.slice(1).join(',').trim();
        } else {
          const regioneTrovata = regioni.find(regione => restoParte.toUpperCase().includes(regione));
          if (regioneTrovata) {
            provenienza = regioneTrovata;
            produttore = restoParte.replace(new RegExp(`\\b${regioneTrovata}\\b`, 'gi'), '').trim();
          } else {
            produttore = restoParte;
          }
        }
      } else {
        // Pattern virgole
        const parts = workingLine.split(',').map(part => part.trim());

        if (parts.length >= 2) {
          nomeVino = parts[0].trim();
          const restoParts = parts.slice(1).join(',').trim();

          const regioneTrovata = regioni.find(regione => restoParts.toUpperCase().includes(regione));
          if (regioneTrovata) {
            provenienza = regioneTrovata;
            let testoProduttore = restoParts.replace(new RegExp(`\\b${regioneTrovata}\\b`, 'gi'), '').trim();
            testoProduttore = testoProduttore.replace(/^[,\s–-]+|[,\s–-]+$/g, '').trim();

            if (testoProduttore && 
                testoProduttore.length > 2 && 
                !paroleDaEscludereComeProduttore.includes(testoProduttore.toUpperCase())) {
              produttore = testoProduttore;
            }
          }
        } else {
          nomeVino = workingLine;
        }
      }

      return {
        nomeVino: nomeVino.toUpperCase() || 'VINO DA DEFINIRE',
        anno: annoParsed || '',
        produttore: produttore || 'INSERISCI IL NOME DEL PRODUTTORE',
        provenienza: provenienza || '',
        categoria: '',
        costo: '',
        vendita: ''
      };
    });

    setParsedWines(parsedWines);
    setCurrentWineIndex(0);
    setArrayViniConfermati([]);
    setShowConfirmModal(true);
  };

  // Salvataggio nel database
  const handleSaveToDatabase = async () => {
    try {
      const userId = authManager.getUserId();
      if (!userId) {
        alert('❌ Errore: Utente non autenticato');
        return;
      }

      const viniPerSupabase = arrayViniConfermati.map(vino => ({
        nome_vino: vino.nomeVino,
        anno: vino.anno,
        produttore: vino.produttore,
        provenienza: vino.provenienza,
        tipologia: vino.categoria,
        costo: parseFloat(vino.costo.toString()) || 0,
        prezzo_vendita: parseFloat(vino.vendita.toString()) || 0,
        user_id: userId
      }));

      const { error } = await supabase
        .from('vini')
        .insert(viniPerSupabase);

      if (error) {
        alert(`❌ Errore nel salvataggio:\n${error.message}`);
        return;
      }

      alert('✅ Dati salvati correttamente!');
      handleResetImport();

    } catch (error) {
      alert(`❌ Errore imprevisto: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`);
    }
  };

  // Reset importazione
  const handleResetImport = () => {
    setShowSummary(false);
    setShowConfirmModal(false);
    setCurrentWineIndex(0);
    setArrayViniConfermati([]);
    setParsedWines([]);
    setTextAreaContent('');
    setCategoriaApplicaATutti('');
    setApplicaATutti(false);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#2e0d0d" }}>
      {/* Header */}
      <header className="border-b border-red-900/30 bg-black/30 backdrop-blur-sm flex-shrink-0 sticky top-0 z-10">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate('/settings/archivi')}
              className="p-2 text-white hover:text-cream hover:bg-white/10 rounded-full transition-all duration-200 hover:scale-105"
              title="Torna agli archivi"
              style={{
                filter: "brightness(1.3)",
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255, 255, 255, 0.2)"
              }}
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>

            <img src="/logo2.png" alt="WINENODE" className="h-24 w-auto object-contain" />

            <button
              onClick={() => navigate("/")}
              className="p-2 text-white hover:text-cream hover:bg-gray-800 rounded-lg transition-colors"
              title="Vai alla home"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col px-6 py-8 min-h-0">
        <div className="flex-1 max-w-4xl mx-auto w-full">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <img src="/ai.png" alt="AI" className="h-12 w-12" />
              <h1 className="text-4xl font-bold text-white">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">
                  AI IMPORT
                </span>
              </h1>
            </div>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              Incolla la tua lista di vini e lascia che l'intelligenza artificiale la ottimizzi automaticamente
            </p>
          </div>

          {/* Card principale */}
          <div 
            className="bg-black/40 backdrop-blur-sm rounded-2xl border border-amber-900/30 p-8 shadow-2xl"
            style={{ background: "rgba(0,0,0,0.4)" }}
          >
            {/* Area di input */}
            <div className="mb-8">
              <div className="border-2 border-dashed border-amber-600/50 rounded-xl p-8 text-center hover:border-amber-500 transition-all duration-300 bg-amber-950/20">
                <div className="space-y-4">
                  <label className="block text-lg font-medium text-white">
                    Incolla qui la tua lista di vini (testo libero)
                  </label>

                  <textarea
                    value={textAreaContent}
                    onChange={(e) => setTextAreaContent(e.target.value)}
                    placeholder={`Franciacorta Brut Satèn Enrico Gatti – 60 €
Chardonnay Scapulin Cortese, Piemonte – 40 €
Barolo DOCG 2019 Burzi Alberto, Piemonte – 65 €`}
                    className="w-full h-40 p-4 bg-black/30 border border-amber-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 resize-none"
                    style={{ background: "rgba(0,0,0,0.3)" }}
                  />
                </div>
              </div>

              {/* Pulsanti di controllo */}
              <div className="mt-6 text-center space-y-4">
                {/* Pulsante AIMPORT */}
                <div>
                  <button
                    onClick={handleOptimize}
                    disabled={!textAreaContent.trim() || isProcessingAI}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-200 hover:scale-105 shadow-lg"
                  >
                    {aiStep === 'idle' && !isProcessingAI ? (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        ✨ OTTIMIZZA
                      </>
                    ) : aiStep === 'cleaning' ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        🧹 Pulizia in corso...
                      </>
                    ) : aiStep === 'optimizing' ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ✨ Ottimizzazione in corso...
                      </>
                    ) : aiStep === 'completed' ? (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        ✅ Completato
                      </>
                    ) : (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        🤖 Elaborazione...
                      </>
                    )}
                  </button>
                </div>

                {/* Pulsante Analizza Lista */}
                <div>
                  <button
                    onClick={handleAnalyzeList}
                    disabled={!textAreaContent.trim() || isProcessingAI}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 disabled:from-gray-600 disabled:to-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-200 hover:scale-105 shadow-lg"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    📊 Analizza Lista
                  </button>
                </div>
              </div>
            </div>

            {/* Info AI */}
            <div className="mt-8 p-6 bg-gradient-to-r from-red-900/30 to-red-800/30 rounded-xl border border-red-600/30">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-yellow-400">🧠</span>
                Cosa fa l'AI?
              </h3>
              <div className="grid md:grid-cols-2 gap-4 text-gray-300">
                <div className="space-y-2">
                  <p className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    Riconosce automaticamente produttori
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    Estrae informazioni sulla provenienza
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    Standardizza i nomi delle annate
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    Pulisce automaticamente il formato
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    Separa nome vino da produttore
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    Prepara per importazione diretta
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modale di Conferma */}
      <WineConfirmModal
        showModal={showConfirmModal}
        currentWine={parsedWines[currentWineIndex]}
        currentWineIndex={currentWineIndex}
        parsedWines={parsedWines}
        arrayViniConfermati={arrayViniConfermati}
        applicaATutti={applicaATutti}
        categoriaApplicaATutti={categoriaApplicaATutti}
        tipologie={tipologie}
        setShowConfirmModal={setShowConfirmModal}
        setCurrentWineIndex={setCurrentWineIndex}
        setArrayViniConfermati={setArrayViniConfermati}
        setApplicaATutti={setApplicaATutti}
        setCategoriaApplicaATutti={setCategoriaApplicaATutti}
        setShowSummary={setShowSummary}
      />

      {/* Sezione Riepilogo Finale */}
      {showSummary && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-black/90 backdrop-blur-sm rounded-2xl border border-amber-900/50 w-full max-w-6xl max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-amber-900/30 sticky top-0 bg-black/90">
              <h2 className="text-3xl font-bold text-white">🎉 Riepilogo Importazione Completata</h2>
              <button
                onClick={() => setShowSummary(false)}
                className="text-gray-400 hover:text-white transition-colors p-2"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Statistiche */}
            <div className="p-6 border-b border-amber-900/30">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gradient-to-r from-green-600/20 to-green-700/20 rounded-lg p-4 border border-green-500/30">
                  <div className="text-green-400 text-2xl font-bold">{arrayViniConfermati.length}</div>
                  <div className="text-gray-300">Vini Confermati</div>
                </div>
                <div className="bg-gradient-to-r from-amber-600/20 to-amber-700/20 rounded-lg p-4 border border-amber-500/30">
                  <div className="text-amber-400 text-2xl font-bold">
                    €{arrayViniConfermati.reduce((sum, vino) => sum + (vino.vendita || 0), 0).toFixed(2)}
                  </div>
                  <div className="text-gray-300">Valore Vendita Totale</div>
                </div>
                <div className="bg-gradient-to-r from-purple-600/20 to-purple-700/20 rounded-lg p-4 border border-purple-500/30">
                  <div className="text-purple-400 text-2xl font-bold">
                    {new Set(arrayViniConfermati.map(vino => vino.produttore)).size}
                  </div>
                  <div className="text-gray-300">Produttori Unici</div>
                </div>
              </div>
            </div>

            {/* Tabella Vini */}
            <div className="p-6">
              <h3 className="text-xl font-bold text-white mb-4">📋 Lista Vini Confermati</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-amber-900/30 border-b border-amber-600/50">
                      <th className="text-left p-4 text-amber-300 font-semibold">#</th>
                      <th className="text-left p-4 text-amber-300 font-semibold">Nome Vino</th>
                      <th className="text-left p-4 text-amber-300 font-semibold">Anno</th>
                      <th className="text-left p-4 text-amber-300 font-semibold">Categoria</th>
                      <th className="text-left p-4 text-amber-300 font-semibold">Produttore</th>
                      <th className="text-left p-4 text-amber-300 font-semibold">Provenienza</th>
                      <th className="text-right p-4 text-amber-300 font-semibold">Costo</th>
                      <th className="text-right p-4 text-amber-300 font-semibold">Vendita</th>
                    </tr>
                  </thead>
                  <tbody>
                    {arrayViniConfermati.map((vino, index) => (
                      <tr key={index} className="border-b border-amber-900/20 hover:bg-amber-950/20 transition-colors">
                        <td className="p-4 text-gray-300 font-medium">{index + 1}</td>
                        <td className="p-4 text-white font-medium">{vino.nomeVino}</td>
                        <td className="p-4 text-gray-300">{vino.anno}</td>
                        <td className="p-4 text-amber-300 font-medium">{vino.categoria}</td>
                        <td className="p-4 text-gray-300">{vino.produttore}</td>
                        <td className="p-4 text-gray-300">{vino.provenienza}</td>
                        <td className="p-4 text-right text-green-400 font-semibold">€{vino.costo.toFixed(2)}</td>
                        <td className="p-4 text-right text-amber-400 font-semibold">€{vino.vendita.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-amber-900/30 bg-black/50">
              <button
                onClick={handleResetImport}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-all duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Nuova Importazione
              </button>

              <div className="text-center">
                <div className="text-lg text-white font-semibold mb-1">Pronto per il salvataggio</div>
                <div className="text-sm text-gray-400">{arrayViniConfermati.length} vini saranno aggiunti al database</div>
              </div>

              <button
                onClick={handleSaveToDatabase}
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold text-lg rounded-lg transition-all duration-200 hover:scale-105 shadow-lg"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 12l2 2 4-4" />
                </svg>
                📥 Salva nel Database
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}