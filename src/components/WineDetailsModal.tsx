
import { useState, useEffect } from 'react'
import { Wine } from '../../shared/schema'
import { X, Save } from 'lucide-react'

interface WineDetailsModalProps {
  wine: Wine | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdateWine?: (wineId: number, updates: Partial<Wine>) => void
  suppliers?: string[]
}

export default function WineDetailsModal({ wine, open, onOpenChange, onUpdateWine, suppliers = [] }: WineDetailsModalProps) {
  const [formData, setFormData] = useState({
    price: '',
    minStock: '',
    supplier: '',
    description: '',
    type: ''
  })
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    if (wine) {
      setFormData({
        price: wine.price || '',
        minStock: wine.minStock.toString(),
        supplier: wine.supplier || '',
        description: wine.description || '',
        type: wine.type || ''
      })
    }
  }, [wine])

  if (!open || !wine) return null

  const handleSave = async () => {
    setIsUpdating(true)
    try {
      if (onUpdateWine) {
        await onUpdateWine(wine.id, {
          price: formData.price,
          minStock: parseInt(formData.minStock) || 2,
          supplier: formData.supplier,
          description: formData.description,
          type: formData.type
        })
      }
      onOpenChange(false)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-lg w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="text-xl font-bold text-cream">{wine.name}</h3>
          <button
            onClick={() => onOpenChange(false)}
            className="text-gray-400 hover:text-cream"
            disabled={isUpdating}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-4 space-y-3">
          {/* Nome vino - Full width */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Nome Vino *
            </label>
            <input
              type="text"
              value={wine.name}
              disabled
              className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-gray-400 cursor-not-allowed"
            />
          </div>

          {/* Tipologia vino - Full width */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Tipologia Vino
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-cream focus:border-blue-500 focus:outline-none"
            >
              <option value="">Seleziona tipologia...</option>
              <option value="rosso">Rosso</option>
              <option value="bianco">Bianco</option>
              <option value="bollicine">Bollicine</option>
              <option value="rosato">Rosato</option>
            </select>
          </div>

          {/* Prima riga: Costo e Soglia Minima */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Costo Vino (€)
              </label>
              <input
                type="text"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-cream focus:border-blue-500 focus:outline-none"
                placeholder="Es: 15.50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Soglia Minima
              </label>
              <input
                type="number"
                value={formData.minStock}
                onChange={(e) => setFormData(prev => ({ ...prev, minStock: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-cream focus:border-blue-500 focus:outline-none"
                placeholder="2"
                min="0"
              />
            </div>
          </div>

          {/* Fornitore - Full width */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Fornitore
            </label>
            <input
              type="text"
              value={formData.supplier}
              onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-cream focus:border-blue-500 focus:outline-none"
              placeholder="Inserisci il nome del fornitore"
            />
          </div>

          {/* Descrizione - Full width ma ridotta */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Descrizione Completa
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-cream focus:border-blue-500 focus:outline-none resize-none"
              rows={2}
              placeholder="Descrizione dettagliata del vino..."
            />
          </div>
        </div>

        {/* Pulsanti */}
        <div className="flex gap-2 p-4 border-t border-gray-700">
          <button
            onClick={() => onOpenChange(false)}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-cream rounded px-4 py-2 transition-colors"
            disabled={isUpdating}
          >
            Annulla
          </button>
          <button
            onClick={handleSave}
            disabled={isUpdating}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-cream rounded px-4 py-2 flex items-center justify-center gap-2 transition-colors"
          >
            <Save className="h-4 w-4" />
            {isUpdating ? 'Salvando...' : 'Salva'}
          </button>
        </div>
      </div>
    </div>
  )
}
