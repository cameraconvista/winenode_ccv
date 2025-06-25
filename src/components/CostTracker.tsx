
import React, { useState, useEffect } from 'react'
import { DollarSign, AlertTriangle, TrendingUp, Calendar } from 'lucide-react'

interface CostData {
  assistantEdits: number
  agentCheckpoints: number
  totalCost: number
  monthlyBudget: number
  lastReset: string
}

export default function CostTracker() {
  const [costData, setCostData] = useState<CostData>({
    assistantEdits: 0,
    agentCheckpoints: 0,
    totalCost: 0,
    monthlyBudget: 25, // Default Core subscription credits
    lastReset: new Date().toISOString().slice(0, 7) // YYYY-MM format
  })

  // Carica dati dal localStorage
  useEffect(() => {
    const savedData = localStorage.getItem('replit-cost-tracker')
    if (savedData) {
      const parsed = JSON.parse(savedData)
      setCostData(parsed)
    }
  }, [])

  // Salva dati nel localStorage
  useEffect(() => {
    localStorage.setItem('replit-cost-tracker', JSON.stringify(costData))
  }, [costData])

  // Reset mensile automatico
  useEffect(() => {
    const currentMonth = new Date().toISOString().slice(0, 7)
    if (costData.lastReset !== currentMonth) {
      setCostData(prev => ({
        ...prev,
        assistantEdits: 0,
        agentCheckpoints: 0,
        totalCost: 0,
        lastReset: currentMonth
      }))
    }
  }, [costData.lastReset])

  const addAssistantEdit = () => {
    setCostData(prev => ({
      ...prev,
      assistantEdits: prev.assistantEdits + 1,
      totalCost: prev.totalCost + 0.05 // 5 cents per edit
    }))
  }

  const addAgentCheckpoint = () => {
    setCostData(prev => ({
      ...prev,
      agentCheckpoints: prev.agentCheckpoints + 1,
      totalCost: prev.totalCost + 0.25 // 25 cents per checkpoint
    }))
  }

  const resetMonth = () => {
    setCostData(prev => ({
      ...prev,
      assistantEdits: 0,
      agentCheckpoints: 0,
      totalCost: 0,
      lastReset: new Date().toISOString().slice(0, 7)
    }))
  }

  const setBudget = (newBudget: number) => {
    setCostData(prev => ({
      ...prev,
      monthlyBudget: newBudget
    }))
  }

  const remainingBudget = costData.monthlyBudget - costData.totalCost
  const budgetPercentage = (costData.totalCost / costData.monthlyBudget) * 100

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <DollarSign className="h-6 w-6 text-green-400" />
          <h2 className="text-xl font-bold text-cream">Saldo Replit</h2>
        </div>
        <div className="text-sm text-gray-400">
          {new Date().toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}
        </div>
      </div>

      {/* Budget Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-700/30 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Speso</span>
            <TrendingUp className="h-4 w-4 text-red-400" />
          </div>
          <div className="text-2xl font-bold text-cream mt-1">
            ${costData.totalCost.toFixed(2)}
          </div>
        </div>

        <div className="bg-gray-700/30 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Rimanente</span>
            <DollarSign className="h-4 w-4 text-green-400" />
          </div>
          <div className="text-2xl font-bold text-green-400 mt-1">
            ${remainingBudget.toFixed(2)}
          </div>
        </div>

        <div className="bg-gray-700/30 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Budget</span>
            <Calendar className="h-4 w-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-blue-400 mt-1">
            ${costData.monthlyBudget.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-400">Utilizzo mensile</span>
          <span className="text-sm font-semibold text-cream">{budgetPercentage.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-3">
          <div 
            className={`h-3 rounded-full transition-all duration-300 ${
              budgetPercentage > 90 ? 'bg-red-500' : 
              budgetPercentage > 70 ? 'bg-yellow-500' : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
          />
        </div>
        {budgetPercentage > 90 && (
          <div className="flex items-center mt-2">
            <AlertTriangle className="h-4 w-4 text-red-400 mr-2" />
            <span className="text-sm text-red-400">Attenzione: Budget quasi esaurito!</span>
          </div>
        )}
      </div>

      {/* Usage Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-700/20 rounded-lg p-4">
          <h3 className="font-semibold text-cream mb-2">Assistant Edits</h3>
          <div className="flex justify-between items-center">
            <span className="text-2xl font-bold text-blue-400">{costData.assistantEdits}</span>
            <span className="text-sm text-gray-400">${(costData.assistantEdits * 0.05).toFixed(2)}</span>
          </div>
          <div className="text-xs text-gray-500">$0.05 per edit</div>
        </div>

        <div className="bg-gray-700/20 rounded-lg p-4">
          <h3 className="font-semibold text-cream mb-2">Agent Checkpoints</h3>
          <div className="flex justify-between items-center">
            <span className="text-2xl font-bold text-purple-400">{costData.agentCheckpoints}</span>
            <span className="text-sm text-gray-400">${(costData.agentCheckpoints * 0.25).toFixed(2)}</span>
          </div>
          <div className="text-xs text-gray-500">$0.25 per checkpoint</div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={addAssistantEdit}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
        >
          + Assistant Edit
        </button>
        
        <button
          onClick={addAgentCheckpoint}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition-colors"
        >
          + Agent Checkpoint
        </button>

        <button
          onClick={resetMonth}
          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm transition-colors"
        >
          Reset Mese
        </button>

        <input
          type="number"
          value={costData.monthlyBudget}
          onChange={(e) => setBudget(Number(e.target.value))}
          className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm w-24"
          placeholder="Budget"
          step="0.01"
        />
      </div>

      {/* Info */}
      <div className="mt-4 p-3 bg-blue-900/20 border border-blue-700/30 rounded-lg">
        <div className="text-xs text-blue-300">
          <strong>💡 Come usare:</strong> Clicca "+ Assistant Edit" ogni volta che chiedi modifiche al codice, 
          "+ Agent Checkpoint" quando l'Agent fa modifiche. Il reset avviene automaticamente ogni mese.
        </div>
      </div>
    </div>
  )
}
