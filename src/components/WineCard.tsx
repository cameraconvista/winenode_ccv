import { AlertTriangle } from 'lucide-react'
import { Wine } from '../../shared/schema'
import { useState } from 'react'
import InventoryModal from './InventoryModal'

interface WineCardProps {
  wine: Wine
  onUpdateInventory?: (wineId: number, newInventory: number) => void
  onWineClick?: (wine: Wine) => void
}

export default function WineCard({ wine, onUpdateInventory, onWineClick }: WineCardProps) {
  const [showInventoryModal, setShowInventoryModal] = useState(false)
  const isLowStock = wine.inventory <= wine.minStock

  const getWineGlassIcon = (type: string) => {
    const colors = {
      'rosso': '#8B0000',
      'bianco': '#fff5d3',
      'bollicine': '#fdc954',
      'rosato': '#FFB6C1'
    };

    const color = colors[type as keyof typeof colors] || '#888888';

    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M7 2v6c0 3.5 2.24 6 5 6s5-2.5 5-6V2z" fill={color}/>
        <rect x="11.2" y="14" width="1.6" height="6" fill={color}/>
        <rect x="8" y="20" width="8" height="2" fill={color}/>
      </svg>
    );
  }

  const handleUpdateInventory = (wineId: number, newInventory: number) => {
    if (onUpdateInventory) {
      onUpdateInventory(wineId, newInventory)
    }
  }

  return (
    <>
      {/* NO ALERT ICON - CLEAN VERSION 19:24 */}
      <div className="flex items-center justify-between p-3 px-2">
        <div className="flex items-center flex-1 mr-3">
          <div className="mr-3 flex-shrink-0">
            {getWineGlassIcon(wine.type)}
          </div>
          <h3 
            className="font-medium text-sm leading-tight text-cream cursor-pointer hover:underline"
            onClick={() => onWineClick?.(wine)}
          >
            {wine.name}
          </h3>
        </div>
        
        <div className="flex items-center justify-end flex-shrink-0" style={{ minWidth: '60px' }}>
          <span 
            className="text-cream font-medium text-sm cursor-pointer hover:bg-gray-700 px-2 py-1 rounded transition-colors mr-1"
            onClick={() => setShowInventoryModal(true)}
          >
            {wine.inventory}
          </span>
          {isLowStock && (
            <AlertTriangle className="h-3 w-3 text-amber-400 flex-shrink-0" />
          )}
        </div>
      </div>

      <InventoryModal
        wine={wine}
        open={showInventoryModal}
        onOpenChange={setShowInventoryModal}
        onUpdateInventory={handleUpdateInventory}
      />
    </>
  )
}