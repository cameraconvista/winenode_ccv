import { createClient, type User, type Session } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Configurazione Supabase per multiutente
export const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        storage: localStorage,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
      },
  db: {
    schema: 'public'
  }
    })
  : null

export const isSupabaseAvailable = !!supabase

// Tipi per l'autenticazione
export type AuthUser = User | null
export type AuthSession = Session | null

// Hook per gestire l'autenticazione
export class AuthManager {
  private static instance: AuthManager
  private currentUser: AuthUser = null
  private currentSession: AuthSession = null
  private listeners: ((user: AuthUser) => void)[] = []

  private constructor() {
    this.initializeAuth()
  }

  static getInstance(): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager()
    }
    return AuthManager.instance
  }

  private async initializeAuth() {
    if (!supabase) return

    try {
      // Ottieni sessione corrente con retry
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.warn('Errore nel recupero sessione:', error.message)
        // Prova refresh se fallisce
        await supabase.auth.refreshSession()
        const { data: { session: refreshedSession } } = await supabase.auth.getSession()
        this.currentSession = refreshedSession
        this.currentUser = refreshedSession?.user || null
      } else {
        this.currentSession = session
        this.currentUser = session?.user || null
      }

      // Ascolta cambiamenti di autenticazione con debounce
      let authTimeout: NodeJS.Timeout | null = null
      supabase.auth.onAuthStateChange((event, session) => {
        // Previeni cambiamenti rapidi multipli
        if (authTimeout) clearTimeout(authTimeout)
        
        authTimeout = setTimeout(() => {
          console.log('🔄 Auth state change:', event, !!session)
          this.currentSession = session
          this.currentUser = session?.user || null
          this.notifyListeners()
        }, 100)
      })

      this.notifyListeners()
    } catch (error) {
      console.error('Errore inizializzazione auth:', error)
    }
  }

  getCurrentUser(): AuthUser {
    return this.currentUser
  }

  getCurrentSession(): AuthSession {
    return this.currentSession
  }

  isAuthenticated(): boolean {
    return !!this.currentUser
  }

  getUserId(): string | null {
    return this.currentUser?.id || null
  }

  async validateSession(): Promise<boolean> {
    if (!supabase) return false
    
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error || !session) {
        console.warn('Sessione non valida, tentativo refresh...')
        const { error: refreshError } = await supabase.auth.refreshSession()
        if (refreshError) return false
        
        const { data: { session: newSession } } = await supabase.auth.getSession()
        this.currentSession = newSession
        this.currentUser = newSession?.user || null
        return !!newSession
      }
      
      return true
    } catch (error) {
      console.error('Errore validazione sessione:', error)
      return false
    }
  }

  onAuthStateChange(callback: (user: AuthUser) => void) {
    this.listeners.push(callback)
    // Chiama immediatamente con lo stato corrente
    callback(this.currentUser)

    // Ritorna funzione per rimuovere il listener
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback)
    }
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.currentUser))
  }

  async signIn(email: string, password: string) {
    if (!supabase) throw new Error('Supabase non configurato')

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw error
    return data
  }

  async signOut() {
    if (!supabase) throw new Error('Supabase non configurato')

    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  async signUp(email: string, password: string) {
    if (!supabase) throw new Error('Supabase non configurato')

    const { data, error } = await supabase.auth.signUp({
      email,
      password
    })

    if (error) throw error
    return data
  }
}

// Istanza singleton
export const authManager = AuthManager.getInstance()