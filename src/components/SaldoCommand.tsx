
import React, { useState, useEffect } from 'react'
import { DollarSign, TrendingUp, AlertTriangle } from 'lucide-react'

interface CostData {
  assistantEdits: number
  agentCheckpoints: number
  totalCost: number
  monthlyBudget: number
  lastReset: string
}

export default function SaldoCommand() {
  const [costData, setCostData] = useState<CostData>({
    assistantEdits: 0,
    agentCheckpoints: 0,
    totalCost: 0,
    monthlyBudget: 25,
    lastReset: new Date().toISOString().slice(0, 7)
  })

  useEffect(() => {
    const savedData = localStorage.getItem('replit-cost-tracker')
    if (savedData) {
      setCostData(JSON.parse(savedData))
    }
  }, [])

  const remainingBudget = costData.monthlyBudget - costData.totalCost
  const budgetPercentage = (costData.totalCost / costData.monthlyBudget) * 100

  return (
    <div className="bg-gray-900/95 backdrop-blur-sm p-6 rounded-xl border border-gray-700 max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <DollarSign className="h-6 w-6 text-green-400" />
        <h2 className="text-xl font-bold text-cream">💰 SALDO REPLIT</h2>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Speso questo mese:</span>
          <span className="text-2xl font-bold text-red-400">${costData.totalCost.toFixed(2)}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-400">Budget rimanente:</span>
          <span className="text-2xl font-bold text-green-400">${remainingBudget.toFixed(2)}</span>
        </div>

        <div className="w-full bg-gray-700 rounded-full h-3 mt-3">
          <div 
            className={`h-3 rounded-full transition-all duration-300 ${
              budgetPercentage > 90 ? 'bg-red-500' : 
              budgetPercentage > 70 ? 'bg-yellow-500' : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
          />
        </div>

        <div className="grid grid-cols-2 gap-2 mt-4 text-sm">
          <div className="bg-gray-800 p-2 rounded">
            <div className="text-gray-400">Assistant Edits</div>
            <div className="text-blue-400 font-bold">{costData.assistantEdits}</div>
          </div>
          <div className="bg-gray-800 p-2 rounded">
            <div className="text-gray-400">Agent Checkpoints</div>
            <div className="text-purple-400 font-bold">{costData.agentCheckpoints}</div>
          </div>
        </div>

        {budgetPercentage > 90 && (
          <div className="flex items-center mt-3 p-2 bg-red-900/20 border border-red-700/30 rounded">
            <AlertTriangle className="h-4 w-4 text-red-400 mr-2" />
            <span className="text-sm text-red-400">⚠️ Budget quasi esaurito!</span>
          </div>
        )}

        <div className="text-xs text-gray-500 mt-3 text-center">
          Reset automatico: {new Date().toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}
        </div>
      </div>
    </div>
  )
}
