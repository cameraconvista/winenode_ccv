
import React from 'react';

interface FornitoreModalProps {
  showFornitoreModal: boolean;
  setModalFilters: (filters: any) => void;
  setShowFornitoreModal: (show: boolean) => void;
  fornitori: string[];
  allWineRows: any[];
  modalFilters: {
    fornitore: string;
    tipologie: string[];
    isActive: boolean;
  };
}

export function FornitoreModal({
  showFornitoreModal,
  setModalFilters,
  setShowFornitoreModal,
  fornitori,
  allWineRows,
  modalFilters
}: FornitoreModalProps) {
  const [selectedFornitore, setSelectedFornitore] = React.useState('');
  const [selectedTipologie, setSelectedTipologie] = React.useState<string[]>([]);

  const tipologieDisponibili = Array.from(new Set(
    allWineRows
      .map(wine => wine.tipologia)
      .filter(tip => tip && tip.length > 0)
  )).sort();

  const handleApplyFilters = () => {
    setModalFilters({
      fornitore: selectedFornitore,
      tipologie: selectedTipologie,
      isActive: true
    });
    setShowFornitoreModal(false);
  };

  const handleReset = () => {
    setSelectedFornitore('');
    setSelectedTipologie([]);
    setModalFilters({
      fornitore: '',
      tipologie: [],
      isActive: false
    });
    setShowFornitoreModal(false);
  };

  const toggleTipologia = (tipologia: string) => {
    if (tipologia === 'TUTTE') {
      setSelectedTipologie(selectedTipologie.includes('TUTTE') ? [] : ['TUTTE']);
    } else {
      setSelectedTipologie(prev => 
        prev.includes(tipologia) 
          ? prev.filter(t => t !== tipologia)
          : [...prev.filter(t => t !== 'TUTTE'), tipologia]
      );
    }
  };

  if (!showFornitoreModal) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Filtra per Fornitore e Tipologia</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fornitore
          </label>
          <select
            value={selectedFornitore}
            onChange={(e) => setSelectedFornitore(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tutti i fornitori</option>
            {fornitori.map(fornitore => (
              <option key={fornitore} value={fornitore}>
                {fornitore}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipologie
          </label>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={selectedTipologie.includes('TUTTE')}
                onChange={() => toggleTipologia('TUTTE')}
                className="mr-2"
              />
              <span className="text-sm">Tutte le tipologie</span>
            </label>
            {tipologieDisponibili.map(tipologia => (
              <label key={tipologia} className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedTipologie.includes(tipologia)}
                  onChange={() => toggleTipologia(tipologia)}
                  className="mr-2"
                />
                <span className="text-sm">{tipologia}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleApplyFilters}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            Applica Filtri
          </button>
          <button
            onClick={handleReset}
            className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
          >
            Reset
          </button>
          <button
            onClick={() => setShowFornitoreModal(false)}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Annulla
          </button>
        </div>
      </div>
    </div>
  );
}
