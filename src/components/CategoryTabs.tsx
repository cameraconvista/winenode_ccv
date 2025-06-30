
import React from 'react';

interface CategoryTabsProps {
  activeTab: string;
  modalFiltersActive: boolean;
  onTabChange: (category: string) => void;
}

const categories = [
  "BOLLICINE ITALIANE",
  "BOLLICINE FRANCESI",
  "BIANCHI",
  "ROSSI",
  "ROSATI",
  "VINI DOLCI",
];

export default function CategoryTabs({ activeTab, modalFiltersActive, onTabChange }: CategoryTabsProps) {
  return (
    <div className="bg-black/30 border-b border-red-900/30 px-4 py-4">
      <div className="max-w-full mx-auto">
        <div className="flex items-center justify-center flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => {
                if (!modalFiltersActive) {
                  onTabChange(category);
                }
              }}
              disabled={modalFiltersActive}
              className={`px-6 py-3 font-semibold text-sm rounded-lg transition-all duration-200 border-2 ${
                modalFiltersActive
                  ? "bg-gray-500/40 text-gray-400 border-gray-400/40 cursor-not-allowed opacity-50"
                  : activeTab === category
                  ? "bg-amber-700 text-cream border-amber-500 shadow-lg"
                  : "bg-brown-800/60 text-cream/80 border-brown-600/40 hover:bg-brown-700/70 hover:border-brown-500/60"
              }`}
              style={{
                backgroundColor: modalFiltersActive 
                  ? "#6b728080" 
                  : activeTab === category ? "#b45309" : "#5d2f0a80",
                borderColor: modalFiltersActive 
                  ? "#9ca3af60" 
                  : activeTab === category ? "#f59e0b" : "#8b4513aa",
              }}
            >
              {category}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
