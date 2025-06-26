import React, { useState, useEffect } from 'react';
import { useTipologie } from '../hooks/useTipologie';

interface WineConfirmModalProps {
  showModal: boolean;
  currentWine: any;
  currentWineIndex: number;
  parsedWines: any[];
  arrayViniConfermati: any[];
  applicaATutti: boolean;
  categoriaApplicaATutti: string;
  tipologie?: { id: string; nome: string; colore?: string }[];
  setShowConfirmModal: (show: boolean) => void;
  setCurrentWineIndex: (index: number) => void;
  setArrayViniConfermati: (wines: any[]) => void;
  setApplicaATutti: (apply: boolean) => void;
  setCategoriaApplicaATutti: (categoria: string) => void;
  setShowSummary: (show: boolean) => void;
}

export default function WineConfirmModal({
  showModal,
  currentWine,
  currentWineIndex,
  parsedWines,
  arrayViniConfermati,
  applicaATutti,
  categoriaApplicaATutti,
  tipologie,
  setShowConfirmModal,
  setCurrentWineIndex,
  setArrayViniConfermati,
  setApplicaATutti,
  setCategoriaApplicaATutti,
  setShowSummary
}: WineConfirmModalProps) {
  // const { tipologie, loading: loadingTipologie } = useTipologie(); // No longer needed
  const [formData, setFormData] = useState({
    nomeVino: '',
    anno: '',
    produttore: '',
    provenienza: '',
    costo: '',
    vendita: '',
    categoria: '',
    fornitore: ''
  });

  // useEffect rimosso - campi pronti per inserimento manuale

  const isFormValid = formData.nomeVino.trim() && 
                     formData.produttore.trim() && 
                     formData.produttore !== 'INSERISCI IL NOME DEL PRODUTTORE' &&
                     formData.provenienza.trim() && 
                     formData.categoria.trim() &&
                     formData.fornitore.trim();

  const handleSaveAndNext = () => {
    if (!isFormValid) return;

    // Logica automatica rimossa - pronto per futura riconfigurazione

    const vinoConfermato = {
      ...formData,
      nomeVino: formData.nomeVino.trim(),
      anno: formData.anno.trim(),
      categoria: formData.categoria.trim(),
      produttore: formData.produttore.trim(),
      provenienza: formData.provenienza.trim(),
      fornitore: formData.fornitore.trim(),
      costo: parseFloat(formData.costo) || 0,
      vendita: parseFloat(formData.vendita) || 0
    };

    const newArray = [...arrayViniConfermati];
    newArray[currentWineIndex] = vinoConfermato;
    setArrayViniConfermati(newArray);

    if (currentWineIndex === parsedWines.length - 1) {
      setShowConfirmModal(false);
      setShowSummary(true);
      return;
    }

    setCurrentWineIndex(currentWineIndex + 1);
  };

  const handleGoBack = () => {
    if (currentWineIndex > 0) {
      setCurrentWineIndex(currentWineIndex - 1);
    }
  };

  const { tipologie: hookTipologie, loading: loadingTipologie } = useTipologie();

  // Use hook data as fallback if prop tipologie is empty
  const activeTipologie = (tipologie && tipologie.length > 0) ? tipologie : hookTipologie;

  // Debug logging
  console.log('🍷 WineConfirmModal - Debug Tipologie:');
  console.log('- Prop tipologie:', tipologie);
  console.log('- Hook tipologie:', hookTipologie);
  console.log('- Active tipologie:', activeTipologie);
  console.log('- Loading tipologie:', loadingTipologie);

  if (!showModal || !currentWine) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div 
        className="bg-black/90 backdrop-blur-sm rounded-2xl border border-amber-900/50 w-full max-w-2xl shadow-2xl"
        style={{ background: "rgba(0,0,0,0.9)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-amber-900/30">
          <h2 className="text-2xl font-bold text-white">
            🍷 Conferma Vino {currentWineIndex + 1} di {parsedWines.length}
          </h2>
          <button
            onClick={() => setShowConfirmModal(false)}
            className="text-gray-400 hover:text-white transition-colors p-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          {/* Nome Vino */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Nome Vino *</label>
            <input
              type="text"
              value={formData.nomeVino}
              onChange={(e) => setFormData({...formData, nomeVino: e.target.value.toUpperCase()})}
              className="w-full p-3 bg-black/30 border border-amber-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 uppercase"
              placeholder="INSERISCI IL NOME DEL VINO"
              required
            />
          </div>

          {/* Anno */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Anno</label>
            <input
              type="text"
              value={formData.anno}
              onChange={(e) => setFormData({...formData, anno: e.target.value.toUpperCase()})}
              className="w-full p-3 bg-black/30 border border-amber-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 uppercase"
              placeholder="ES. 2019 (FACOLTATIVO)"
            />
          </div>

          {/* Categoria */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Categoria *</label>
            {!tipologie || tipologie.length === 0 ? (
              <div className="w-full p-3 bg-black/30 border border-red-600/50 rounded-lg text-red-400">
                ⚠️ Nessuna categoria disponibile. Vai in Archivi per creare delle categorie.
              </div>
            ) : (
              <div className="relative">
                <select
                  value={formData.categoria}
                  onChange={(e) => {
                    const nuovaCategoria = e.target.value;
                    setFormData(prev => ({ ...prev, categoria: nuovaCategoria }));
                    if (applicaATutti) {
                      setCategoriaApplicaATutti(nuovaCategoria);
                    }
                  }}
                  className="w-full p-3 bg-black/30 border border-amber-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 cursor-pointer appearance-none pr-10"
                  style={{ color: formData.categoria ? '#ffffff' : '#555555' }}
                  required
                >
                  <option value="" className="bg-gray-800" style={{ color: '#555555' }}>
                    Seleziona una categoria
                  </option>
                  {tipologie.map((tipologia) => (
                    <option key={tipologia.id} value={tipologia.nome} className="bg-gray-800 text-white py-2">
                      {tipologia.nome}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            )}
          </div>

          {/* Checkbox Applica a tutti */}
          <div className="flex items-center gap-3 p-3 bg-amber-950/20 border border-amber-600/30 rounded-lg">
            <input
              type="checkbox"
              id="applica-a-tutti"
              checked={applicaATutti}
              onChange={(e) => {
                const isChecked = e.target.checked;
                setApplicaATutti(isChecked);
                if (isChecked) {
                  setCategoriaApplicaATutti(formData.categoria);
                } else {
                  setCategoriaApplicaATutti('');
                }
              }}
              className="w-4 h-4 text-amber-600 bg-black/30 border border-amber-600/50 rounded focus:ring-amber-500 focus:ring-2"
            />
            <label htmlFor="applica-a-tutti" className="text-sm text-gray-300 cursor-pointer">
              Applica a tutti quelli della lista
            </label>
          </div>

          {/* Costo e Vendita */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Costo (€)</label>
              <input
                type="number"
                step="0.01"
                value={formData.costo}
                onChange={(e) => setFormData({...formData, costo: e.target.value})}
                className="w-full p-3 bg-black/30 border border-amber-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                placeholder="es. 10.00 (facoltativo)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Vendita (€)</label>
              <input
                type="number"
                step="0.01"
                value={formData.vendita}
                onChange={(e) => setFormData({...formData, vendita: e.target.value})}
                className="w-full p-3 bg-black/30 border border-amber-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                placeholder="es. 30.00 (facoltativo)"
              />
            </div>
          </div>

          {/* Produttore */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Produttore *</label>
            <input
              type="text"
              value={formData.produttore === 'INSERISCI IL NOME DEL PRODUTTORE' ? '' : formData.produttore}
              onChange={(e) => setFormData({...formData, produttore: e.target.value.toUpperCase()})}
              className="w-full p-3 bg-black/30 border border-amber-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 uppercase"
              placeholder="INSERISCI IL NOME DEL PRODUTTORE"
              required
            />
          </div>

          {/* Provenienza */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Provenienza *</label>
            <input
              type="text"
              value={formData.provenienza}
              onChange={(e) => setFormData({...formData, provenienza: e.target.value.toUpperCase()})}
              className="w-full p-3 bg-black/30 border border-amber-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 uppercase"
              placeholder="ES. PIEMONTE, TOSCANA..."
              required
            />
          </div>

          {/* Fornitore */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Fornitore *</label>
            <input
              type="text"
              value={formData.fornitore}
              onChange={(e) => setFormData({...formData, fornitore: e.target.value.toUpperCase()})}
              className="w-full p-3 bg-black/30 border border-amber-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 uppercase"
              placeholder="INSERISCI IL NOME DEL FORNITORE"
              required
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-amber-900/30">
          <button
            onClick={handleGoBack}
            disabled={currentWineIndex === 0}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Indietro
          </button>

          <div className="text-center">
            <div className="text-sm text-gray-400 mb-2">
              Progresso: {currentWineIndex + 1} / {parsedWines.length}
            </div>
            <div className="w-48 bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-amber-500 to-amber-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentWineIndex + 1) / parsedWines.length) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="text-center">
            <div className="text-xs text-gray-400 mb-2">* campi obbligatori</div>
            <button
              onClick={handleSaveAndNext}
              disabled={!isFormValid}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 disabled:from-gray-600 disabled:to-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-200 hover:scale-105 shadow-lg"
            >
              {currentWineIndex === parsedWines.length - 1 ? (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Concludi importazione
                </>
              ) : (
                <>
                  Salva e continua
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}