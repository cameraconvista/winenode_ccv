import React, { useState, useEffect } from 'react'
import { X, Plus, Minus } from 'lucide-react'

interface InventoryModalProps {
  wine: {
    id: number
    name: string
    inventory: number
    minStock: number
  } | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdateInventory: (wineId: number, newInventory: number) => void
}

export default function InventoryModal({ wine, open, onOpenChange, onUpdateInventory }: InventoryModalProps) {
  const [inventory, setInventory] = useState(0)

  useEffect(() => {
    if (wine) {
      setInventory(wine.inventory)
    }
  }, [wine])

  if (!wine) return null

  const handleIncrement = () => {
    setInventory(prev => prev + 1)
  }

  const handleDecrement = () => {
    if (inventory > 0) {
      setInventory(prev => prev - 1)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0
    if (value >= 0) {
      setInventory(value)
    }
  }

  const handleSave = () => {
    onUpdateInventory(wine.id, inventory)
    onOpenChange(false)
  }

  const handleCancel = () => {
    setInventory(wine.inventory)
    onOpenChange(false)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-900 rounded-lg p-6 w-full max-w-md border border-neutral-700">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-cream">MODIFICA GIACENZA</h2>
          <button
            onClick={handleCancel}
            className="text-neutral-400 hover:text-cream transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="mb-6">
          <h3 className="text-cream font-medium mb-2">{wine.name}</h3>
          <p className="text-neutral-400 text-sm mb-4">
            Giacenza attuale: {wine.inventory} | Scorta minima: {wine.minStock}
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-cream text-sm font-medium mb-2">
                NUOVA GIACENZA
              </label>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleDecrement}
                  disabled={inventory <= 0}
                  className="w-10 h-10 flex items-center justify-center bg-neutral-800 border border-neutral-600 rounded-md text-cream hover:bg-neutral-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Minus size={16} />
                </button>
                
                <input
                  type="number"
                  value={inventory}
                  onChange={handleInputChange}
                  min="0"
                  className="flex-1 px-3 py-2 bg-neutral-800 border border-neutral-600 rounded-md text-cream text-center text-lg font-medium focus:outline-none focus:border-amber-600"
                />
                
                <button
                  onClick={handleIncrement}
                  className="w-10 h-10 flex items-center justify-center bg-neutral-800 border border-neutral-600 rounded-md text-cream hover:bg-neutral-700 transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {inventory < wine.minStock && (
              <div className="bg-red-900/20 border border-red-700 rounded-md p-3">
                <p className="text-red-300 text-sm">
                  ⚠️ Attenzione: giacenza sotto la scorta minima
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={handleCancel}
            className="flex-1 px-4 py-2 bg-neutral-800 border border-neutral-600 text-neutral-300 rounded-md hover:bg-neutral-700 transition-colors"
          >
            ANNULLA
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-amber-700 text-cream rounded-md hover:bg-amber-600 transition-colors font-medium"
          >
            SALVA
          </button>
        </div>
      </div>
    </div>
  )
}