import { Database, ExternalLink, Copy, CheckCircle } from 'lucide-react'
import { useState } from 'react'

interface DatabaseSetupGuideProps {
  onRetry: () => void
}

export default function DatabaseSetupGuide({ onRetry }: DatabaseSetupGuideProps) {
  const [copied, setCopied] = useState(false)

  const sqlScript = `-- Schema per WINENODE su Supabase
-- Eseguire questo script nel SQL Editor di Supabase

-- Tabella giacenze (vini)
CREATE TABLE IF NOT EXISTS public.giacenze (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('rosso', 'bianco', 'bollicine', 'rosato')),
    supplier VARCHAR(255) NOT NULL,
    inventory INTEGER NOT NULL DEFAULT 0,
    min_stock INTEGER NOT NULL DEFAULT 1,
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    vintage VARCHAR(4),
    region VARCHAR(255),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabella fornitori
CREATE TABLE IF NOT EXISTS public.fornitori (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Abilita RLS per tutte le tabelle
ALTER TABLE public.giacenze ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fornitori ENABLE ROW LEVEL SECURITY;

-- Policy per giacenze - gli utenti possono vedere/modificare solo i propri vini
CREATE POLICY "Users can view own wines" ON public.giacenze
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own wines" ON public.giacenze
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own wines" ON public.giacenze
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own wines" ON public.giacenze
    FOR DELETE USING (auth.uid() = user_id);

-- Policy per fornitori
CREATE POLICY "Users can view own suppliers" ON public.fornitori
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own suppliers" ON public.fornitori
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own suppliers" ON public.fornitori
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own suppliers" ON public.fornitori
    FOR DELETE USING (auth.uid() = user_id);`

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(sqlScript)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Errore nella copia:', err)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg p-8 w-full max-w-4xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-amber-600 rounded-full p-3">
              <Database className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-cream uppercase tracking-wider mb-2">
            CONFIGURAZIONE DATABASE
          </h1>
          <p className="text-gray-400">
            Le tabelle del database devono essere create su Supabase
          </p>
        </div>

        <div className="space-y-6">
          <div className="bg-gray-700 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-cream mb-4 flex items-center gap-2">
              <ExternalLink className="h-5 w-5" />
              PASSO 1: Accedi a Supabase
            </h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-300">
              <li>Vai su <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:text-amber-300">supabase.com/dashboard</a></li>
              <li>Accedi al tuo progetto WINENODE</li>
              <li>Vai alla sezione "SQL Editor" nel menu laterale</li>
            </ol>
          </div>

          <div className="bg-gray-700 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-cream mb-4 flex items-center gap-2">
              <Database className="h-5 w-5" />
              PASSO 2: Esegui lo script SQL
            </h2>
            <div className="space-y-4">
              <p className="text-gray-300">
                Copia ed esegui questo script nel SQL Editor di Supabase:
              </p>
              
              <div className="relative">
                <pre className="bg-gray-900 text-green-400 p-4 rounded text-xs overflow-x-auto max-h-96 overflow-y-auto border border-gray-600">
                  {sqlScript}
                </pre>
                <button
                  onClick={copyToClipboard}
                  className="absolute top-2 right-2 bg-gray-600 hover:bg-gray-500 text-white p-2 rounded transition-colors"
                  title="Copia script"
                >
                  {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
              
              {copied && (
                <p className="text-green-400 text-sm">Script copiato negli appunti!</p>
              )}
            </div>
          </div>

          <div className="bg-gray-700 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-cream mb-4">
              PASSO 3: Verifica configurazione
            </h2>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li>Verifica che le tabelle `giacenze` e `fornitori` siano state create</li>
              <li>Controlla che le policy RLS siano attive</li>
              <li>Torna all'app e riprova il caricamento</li>
            </ul>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              onClick={onRetry}
              className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              RIPROVA CARICAMENTO
            </button>
            
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-medium py-3 px-4 rounded-lg transition-colors text-center flex items-center justify-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              APRI SUPABASE
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}