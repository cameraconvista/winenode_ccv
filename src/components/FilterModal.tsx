
import { X } from 'lucide-react'

interface FilterModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  filters: {
    wineType: string
    supplier: string
    showAlertsOnly: boolean
  }
  onFiltersChange: (filters: any) => void
}

export default function FilterModal({ open, onOpenChange, filters, onFiltersChange }: FilterModalProps) {
  if (!open) return null

  const wineTypes = ['', 'rosso', 'bianco', 'bollicine', 'rosato']
  const suppliers = [
    '', 'Cantina Valpolicella', 'Azienda Vinicola Piemontese', 'Tenuta Toscana',
    'Cantina del Soave', 'Cantina Sarda', 'Villa Amagioia Varignana',
    'Cantina Franciacorta', 'Cantina Valdobbiadene', 'Cantina Siciliana',
    'Cantina Alto Adige', 'Cantina Abruzzese', 'Cantina Pugliese'
  ]

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
      <div className="fixed top-16 left-1/2 transform -translate-x-1/2 w-full max-w-md mx-4">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-cream">Filtri</h3>
            <button
              onClick={() => onOpenChange(false)}
              className="text-gray-400 hover:text-cream"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Tipo di vino
              </label>
              <select
                value={filters.wineType}
                onChange={(e) => onFiltersChange({ ...filters, wineType: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-cream focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tutti i tipi</option>
                {wineTypes.slice(1).map(type => (
                  <option key={type} value={type} className="capitalize">
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Fornitore
              </label>
              <select
                value={filters.supplier}
                onChange={(e) => onFiltersChange({ ...filters, supplier: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-cream focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tutti i fornitori</option>
                {suppliers.slice(1).map(supplier => (
                  <option key={supplier} value={supplier}>
                    {supplier}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="showAlertsOnly"
                checked={filters.showAlertsOnly}
                onChange={(e) => onFiltersChange({ ...filters, showAlertsOnly: e.target.checked })}
                className="h-4 w-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="showAlertsOnly" className="ml-2 text-sm text-gray-300">
                Solo vini con scorte basse
              </label>
            </div>
          </div>

          <div className="mt-6 flex gap-2">
            <button
              onClick={() => onFiltersChange({ wineType: '', supplier: '', showAlertsOnly: false })}
              className="flex-1 px-4 py-2 bg-gray-700 text-cream rounded-lg hover:bg-gray-600 transition-colors"
            >
              Reset
            </button>
            <button
              onClick={() => onOpenChange(false)}
              className="flex-1 px-4 py-2 bg-blue-600 text-cream rounded-lg hover:bg-blue-700 transition-colors"
            >
              Applica
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}