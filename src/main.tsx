import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

import { createClient } from '@supabase/supabase-js'

// ✅ CREA IL CLIENTE SUPABASE
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
)

// ✅ STAMPA IN CONSOLE L'UTENTE LOGGATO
supabase.auth.getSession().then(({ data, error }) => {
  console.log('👤 USER SESSION:', data.session)
  console.log('🆔 USER ID:', data.session?.user.id)
  if (error) console.error('❌ Supabase Error:', error)
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
