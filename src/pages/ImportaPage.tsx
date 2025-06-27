import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function ImportaPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#2e0d0d" }}>
      {/* Header */}
      <header className="border-b border-red-900/30 bg-black/30 backdrop-blur-sm flex-shrink-0 sticky top-0 z-10">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate('/settings/archivi')}
              className="p-2 text-white hover:text-cream hover:bg-white/10 rounded-full transition-all duration-200 hover:scale-105"
              title="Torna agli archivi"
              style={{
                filter: "brightness(1.3)",
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255, 255, 255, 0.2)"
              }}
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>

            <img
              src="/logo 2 CCV.png"
              alt="WINENODE"
              className="h-24 w-auto object-contain"
            />

            <div className="w-10"></div>
          </div>
        </div>
      </header>

      {/* Main Content - Empty */}
      <main className="flex-1 flex items-center justify-center">
        <div className="text-white text-center">
          <p className="text-lg">Pagina vuota</p>
        </div>
      </main>
    </div>
  );
}