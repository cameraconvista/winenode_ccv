
import { Search, X } from 'lucide-react'

interface SearchModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  searchTerm: string
  onSearchChange: (term: string) => void
}

export default function SearchModal({ open, onOpenChange, searchTerm, onSearchChange }: SearchModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
      <div className="fixed top-16 left-1/2 transform -translate-x-1/2 w-full max-w-md mx-4">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-cream">Ricerca Vini</h3>
            <button
              onClick={() => onOpenChange(false)}
              className="text-gray-400 hover:text-cream"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cerca per nome o fornitore..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-cream placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>
          
          <div className="mt-4 text-sm text-gray-400">
            Cerca per nome del vino o fornitore
          </div>
        </div>
      </div>
    </div>
  )
}