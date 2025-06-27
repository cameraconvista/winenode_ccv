import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, authManager } from '../lib/supabase';

import { normalizzaAnnata, paroleDaEscludereComeProduttore, regioni } from '../lib/wineProcessing';
import { useTipologie } from '../hooks/useTipologie';

export default function ImportaPage() {
  const navigate = useNavigate();
  const { tipologie } = useTipologie();

  // Stati principali
  const [textAreaContent, setTextAreaContent] = useState('');

  

  

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

  

  // Funzioni vuote per pulsanti (solo layout visivo)
  const handleOptimize = () => {
    // Funzione vuota - pulsante solo visivo
  };

  const handleAnalyzeList = () => {
    // Funzione vuota - pulsante solo visivo  
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

            <img
              src="/logo 2 CCV.png"
              alt="WINENODE"
              className="h-24 w-auto object-contain"
            />

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
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-lg transition-all duration-200 hover:scale-105 shadow-lg"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    ✨ OTTIMIZZA
                  </button>
                </div>

                {/* Pulsante Analizza Lista */}
                <div>
                  <button
                    onClick={handleAnalyzeList}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-semibold rounded-lg transition-all duration-200 hover:scale-105 shadow-lg"
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

      

      
    </div>
  );
}