import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Home, Save, Plus, Trash2 } from 'lucide-react'

interface WineRow {
  id: string
  tipologia: string
  nomeVino: string
  produttore: string
  provenienza: string
  costo: string
  vendita: string
  margine: string
  fornitore: string
}

export default function TabellaViniPage() {
  const navigate = useNavigate()

  const [rows, setRows] = useState<WineRow[]>([])

  // Inizializza 30 righe vuote
  useEffect(() => {
    const initialRows: WineRow[] = Array.from({ length: 30 }, (_, index) => ({
      id: `row-${index + 1}`,
      tipologia: '',
      nomeVino: '',
      produttore: '',
      provenienza: '',
      costo: '',
      vendita: '',
      margine: '',
      fornitore: ''
    }))
    setRows(initialRows)
  }, [])

  const updateRow = (id: string, field: keyof WineRow, value: string) => {
    setRows(prev => prev.map(row => {
      if (row.id === id) {
        const updatedRow = { ...row, [field]: value }

        // Calcola automaticamente il margine se costo e vendita sono presenti
        if (field === 'costo' || field === 'vendita') {
          const costo = parseFloat(field === 'costo' ? value : row.costo) || 0
          const vendita = parseFloat(field === 'vendita' ? value : row.vendita) || 0
          const margine = vendita - costo
          updatedRow.margine = margine > 0 ? margine.toFixed(2) : ''
        }

        return updatedRow
      }
      return row
    }))
  }

  const addRow = () => {
    const newRow: WineRow = {
      id: `row-${Date.now()}`,
      tipologia: '',
      nomeVino: '',
      produttore: '',
      provenienza: '',
      costo: '',
      vendita: '',
      margine: '',
      fornitore: ''
    }
    setRows(prev => [...prev, newRow])
  }

  const removeRow = (id: string) => {
    setRows(prev => prev.filter(row => row.id !== id))
  }

  const saveData = () => {
    const filledRows = rows.filter(row => 
      row.nomeVino.trim() || row.produttore.trim() || row.tipologia
    )
    console.log('Saving data:', filledRows)
    // Qui implementerai il salvataggio su Supabase
  }

  const fornitori = ['', 'Fornitore A', 'Fornitore B', 'Fornitore C']

  return (
    <div 
      className="min-h-screen text-white"
      style={{
        background: "linear-gradient(to bottom right, #1f0202, #2d0505, #1f0202)",
      }}
    >
      {/* Header */}
      <header className="border-b border-red-900/30 bg-black/30 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate('/settings/archivi')}
              className="p-2 text-white hover:text-cream hover:bg-white/10 rounded-full transition-all duration-200"
              title="Torna alla pagina archivi"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>

            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-cream">TABELLA VINI</h1>
              <img
                src="/logo2.png"
                alt="WINENODE"
                className="h-12 w-auto object-contain"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/")}
                className="p-2 text-white hover:text-cream hover:bg-gray-800 rounded-lg transition-colors"
                title="Vai alla home"
              >
                <Home className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Actions Bar */}
      <div className="bg-black/20 border-b border-red-900/30 px-4 py-3">
        <div className="max-w-full mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={addRow}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4" />
              Aggiungi Riga
            </button>

            <button
              onClick={saveData}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Save className="h-4 w-4" />
              Salva Tabella
            </button>
          </div>

          <div className="text-sm text-cream">
            Righe totali: {rows.length}
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="p-4 overflow-x-auto">
        <div className="min-w-full">
          <table className="w-full border-collapse shadow-2xl rounded-lg overflow-hidden">
            {/* Header */}
            <thead>
              <tr style={{ backgroundColor: '#5d2f0a' }}>
                <th className="border border-gray-600 px-3 py-3 text-left text-white font-semibold text-sm min-w-[120px]">
                  Tipologia
                </th>
                <th className="border border-gray-600 px-3 py-3 text-left text-white font-semibold text-sm min-w-[200px]">
                  Nome Vino
                </th>
                <th className="border border-gray-600 px-3 py-3 text-left text-white font-semibold text-sm min-w-[150px]">
                  Produttore
                </th>
                <th className="border border-gray-600 px-3 py-3 text-left text-white font-semibold text-sm min-w-[120px]">
                  Provenienza
                </th>
                <th className="border border-gray-600 px-3 py-3 text-left text-white font-semibold text-sm min-w-[100px]">
                  Costo €
                </th>
                <th className="border border-gray-600 px-3 py-3 text-left text-white font-semibold text-sm min-w-[100px]">
                  Vendita €
                </th>
                <th className="border border-gray-600 px-3 py-3 text-left text-white font-semibold text-sm min-w-[100px]">
                  Margine €
                </th>
                <th className="border border-gray-600 px-3 py-3 text-left text-white font-semibold text-sm min-w-[150px]">
                  Fornitore
                </th>
                <th className="border border-gray-600 px-3 py-3 text-center text-white font-semibold text-sm w-[50px]">
                  Azioni
                </th>
              </tr>
            </thead>

            {/* Body */}
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-amber-50 transition-colors">
                  {/* Tipologia */}
                  <td className="border border-gray-400 p-0" style={{ backgroundColor: '#f5f0e6' }}>
                    <input
                      type="text"
                      value={row.tipologia}
                      onChange={(e) => updateRow(row.id, 'tipologia', e.target.value)}
                      className="w-full h-full px-2 py-2 bg-transparent border-none outline-none text-gray-800 text-sm focus:bg-white focus:shadow-inner"
                      placeholder="Tipologia..."
                    />
                  </td>

                  {/* Nome Vino */}
                  <td className="border border-gray-400 p-0" style={{ backgroundColor: '#f5f0e6' }}>
                    <input
                      type="text"
                      value={row.nomeVino}
                      onChange={(e) => updateRow(row.id, 'nomeVino', e.target.value)}
                      className="w-full h-full px-2 py-2 bg-transparent border-none outline-none text-gray-800 text-sm focus:bg-white focus:shadow-inner"
                      placeholder="Nome del vino..."
                    />
                  </td>

                  {/* Produttore */}
                  <td className="border border-gray-400 p-0" style={{ backgroundColor: '#f5f0e6' }}>
                    <input
                      type="text"
                      value={row.produttore}
                      onChange={(e) => updateRow(row.id, 'produttore', e.target.value)}
                      className="w-full h-full px-2 py-2 bg-transparent border-none outline-none text-gray-800 text-sm focus:bg-white focus:shadow-inner"
                      placeholder="Produttore..."
                    />
                  </td>

                  {/* Provenienza */}
                  <td className="border border-gray-400 p-0" style={{ backgroundColor: '#f5f0e6' }}>
                    <input
                      type="text"
                      value={row.provenienza}
                      onChange={(e) => updateRow(row.id, 'provenienza', e.target.value)}
                      className="w-full h-full px-2 py-2 bg-transparent border-none outline-none text-gray-800 text-sm focus:bg-white focus:shadow-inner"
                      placeholder="Regione..."
                    />
                  </td>

                  {/* Costo */}
                  <td className="border border-gray-400 p-0" style={{ backgroundColor: '#f5f0e6' }}>
                    <input
                      type="number"
                      step="0.01"
                      value={row.costo}
                      onChange={(e) => updateRow(row.id, 'costo', e.target.value)}
                      className="w-full h-full px-2 py-2 bg-transparent border-none outline-none text-gray-800 text-sm text-right focus:bg-white focus:shadow-inner"
                      placeholder="0.00"
                    />
                  </td>

                  {/* Vendita */}
                  <td className="border border-gray-400 p-0" style={{ backgroundColor: '#f5f0e6' }}>
                    <input
                      type="number"
                      step="0.01"
                      value={row.vendita}
                      onChange={(e) => updateRow(row.id, 'vendita', e.target.value)}
                      className="w-full h-full px-2 py-2 bg-transparent border-none outline-none text-gray-800 text-sm text-right focus:bg-white focus:shadow-inner"
                      placeholder="0.00"
                    />
                  </td>

                  {/* Margine (calcolato automaticamente) */}
                  <td className="border border-gray-400 p-0" style={{ backgroundColor: row.margine ? '#e8f5e8' : '#f5f0e6' }}>
                    <input
                      type="text"
                      value={row.margine}
                      readOnly
                      className="w-full h-full px-2 py-2 bg-transparent border-none outline-none text-gray-800 text-sm text-right font-medium cursor-not-allowed"
                      placeholder="Auto"
                    />
                  </td>

                  {/* Fornitore */}
                  <td className="border border-gray-400 p-0" style={{ backgroundColor: '#f5f0e6' }}>
                    <select
                      value={row.fornitore}
                      onChange={(e) => updateRow(row.id, 'fornitore', e.target.value)}
                      className="w-full h-full px-2 py-2 bg-transparent border-none outline-none text-gray-800 text-sm focus:bg-white focus:shadow-inner"
                    >
                      {fornitori.map(forn => (
                        <option key={forn} value={forn}>{forn || 'Seleziona...'}</option>
                      ))}
                    </select>
                  </td>

                  {/* Azioni */}
                  <td className="border border-gray-400" style={{ backgroundColor: '#f5f0e6' }}>
                    <div className="flex justify-center">
                      <button
                        onClick={() => removeRow(row.id)}
                        className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors"
                        title="Elimina riga"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}