
-- ============================================
-- SCHEMA COMPLETO SUPABASE PER WINENODE
-- Creato: $(date)
-- Versione: 1.0.0
-- ============================================

-- Abilita RLS (Row Level Security) globalmente
ALTER DATABASE postgres SET row_security = on;

-- ============================================
-- 1. TABELLA PRINCIPALE: VINI
-- ============================================

CREATE TABLE IF NOT EXISTS vini (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Dati vino
    nome_vino TEXT NOT NULL DEFAULT '',
    tipologia TEXT NOT NULL DEFAULT '', -- Temporaneo, diventerà FK
    produttore TEXT NOT NULL DEFAULT '', -- Temporaneo, diventerà FK  
    provenienza TEXT NOT NULL DEFAULT '',
    fornitore TEXT NOT NULL DEFAULT '', -- Temporaneo, diventerà FK
    anno INTEGER CHECK (anno >= 1800 AND anno <= 2100), -- ✅ AGGIUNTA COLONNA ANNO
    
    -- Dati commerciali
    costo DECIMAL(10,2) DEFAULT 0.00,
    prezzo_vendita DECIMAL(10,2) DEFAULT 0.00,
    margine_euro DECIMAL(10,2) GENERATED ALWAYS AS (prezzo_vendita - costo) STORED,
    margine_percentuale DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE 
            WHEN costo > 0 THEN ((prezzo_vendita - costo) / costo * 100)
            ELSE 0 
        END
    ) STORED,
    
    -- Giacenza
    giacenza INTEGER DEFAULT 0 CHECK (giacenza >= 0),
    
    -- Metadati
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_vini_user_id ON vini(user_id);
CREATE INDEX IF NOT EXISTS idx_vini_tipologia ON vini(tipologia);
CREATE INDEX IF NOT EXISTS idx_vini_produttore ON vini(produttore);
CREATE INDEX IF NOT EXISTS idx_vini_nome ON vini(nome_vino);
CREATE INDEX IF NOT EXISTS idx_vini_giacenza ON vini(giacenza);
CREATE INDEX IF NOT EXISTS idx_vini_anno ON vini(anno); -- ✅ INDICE PER ANNO

-- Trigger per updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_vini_updated_at 
    BEFORE UPDATE ON vini 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 2. TABELLE DI SUPPORTO PER DROPDOWN
-- ============================================

-- Tabella Tipologie
CREATE TABLE IF NOT EXISTS tipologie (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    nome TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    UNIQUE(user_id, nome) -- Evita duplicati per utente
);

CREATE INDEX IF NOT EXISTS idx_tipologie_user_id ON tipologie(user_id);
CREATE INDEX IF NOT EXISTS idx_tipologie_nome ON tipologie(nome);

-- Tabella Produttori  
CREATE TABLE IF NOT EXISTS produttori (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    nome TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    UNIQUE(user_id, nome) -- Evita duplicati per utente
);

CREATE INDEX IF NOT EXISTS idx_produttori_user_id ON produttori(user_id);
CREATE INDEX IF NOT EXISTS idx_produttori_nome ON produttori(nome);

-- Tabella Fornitori
CREATE TABLE IF NOT EXISTS fornitori (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    nome TEXT NOT NULL,
    email TEXT DEFAULT '',
    telefono TEXT DEFAULT '',
    indirizzo TEXT DEFAULT '',
    note TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    UNIQUE(user_id, nome) -- Evita duplicati per utente
);

CREATE INDEX IF NOT EXISTS idx_fornitori_user_id ON fornitori(user_id);
CREATE INDEX IF NOT EXISTS idx_fornitori_nome ON fornitori(nome);
CREATE INDEX IF NOT EXISTS idx_fornitori_email ON fornitori(email);

-- Trigger per updated_at su fornitori
CREATE TRIGGER update_fornitori_updated_at 
    BEFORE UPDATE ON fornitori 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 3. ROW LEVEL SECURITY (RLS) POLICIES  
-- ============================================

-- Abilita RLS su tutte le tabelle
ALTER TABLE vini ENABLE ROW LEVEL SECURITY;
ALTER TABLE tipologie ENABLE ROW LEVEL SECURITY;
ALTER TABLE produttori ENABLE ROW LEVEL SECURITY;
ALTER TABLE fornitori ENABLE ROW LEVEL SECURITY;

-- POLICIES PER VINI
CREATE POLICY "Utenti possono vedere solo i propri vini" 
    ON vini FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Utenti possono inserire i propri vini" 
    ON vini FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Utenti possono aggiornare i propri vini" 
    ON vini FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Utenti possono eliminare i propri vini" 
    ON vini FOR DELETE 
    USING (auth.uid() = user_id);

-- POLICIES PER TIPOLOGIE
CREATE POLICY "Utenti possono vedere le proprie tipologie" 
    ON tipologie FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Utenti possono inserire le proprie tipologie" 
    ON tipologie FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Utenti possono aggiornare le proprie tipologie" 
    ON tipologie FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Utenti possono eliminare le proprie tipologie" 
    ON tipologie FOR DELETE 
    USING (auth.uid() = user_id);

-- POLICIES PER PRODUTTORI
CREATE POLICY "Utenti possono vedere i propri produttori" 
    ON produttori FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Utenti possono inserire i propri produttori" 
    ON produttori FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Utenti possono aggiornare i propri produttori" 
    ON produttori FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Utenti possono eliminare i propri produttori" 
    ON produttori FOR DELETE 
    USING (auth.uid() = user_id);

-- POLICIES PER FORNITORI
CREATE POLICY "Utenti possono vedere i propri fornitori" 
    ON fornitori FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Utenti possono inserire i propri fornitori" 
    ON fornitori FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Utenti possono aggiornare i propri fornitori" 
    ON fornitori FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Utenti possono eliminare i propri fornitori" 
    ON fornitori FOR DELETE 
    USING (auth.uid() = user_id);

-- ============================================
-- 4. DATI DI ESEMPIO (OPZIONALE)
-- ============================================

-- Inserisce tipologie di base per nuovo utente
-- Nota: Questi verranno inseriti automaticamente tramite trigger

-- ============================================
-- 5. FUNZIONI HELPER
-- ============================================

-- Funzione per popolare automaticamente tipologie base per nuovo utente
CREATE OR REPLACE FUNCTION setup_user_defaults()
RETURNS TRIGGER AS $$
BEGIN
    -- Inserisce tipologie di base
    INSERT INTO tipologie (user_id, nome) VALUES
        (NEW.id, 'ROSSO'),
        (NEW.id, 'BIANCO'),
        (NEW.id, 'ROSATO'),
        (NEW.id, 'BOLLICINE'),
        (NEW.id, 'DOLCE'),
        (NEW.id, 'LIQUOROSO')
    ON CONFLICT (user_id, nome) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger per setup automatico nuovo utente
CREATE TRIGGER on_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION setup_user_defaults();

-- ============================================
-- 6. GRANTS E PERMESSI
-- ============================================

-- Grant permessi per authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================
-- SCRIPT PER AGGIUNGERE COLONNA ANNO A TABELLA ESISTENTE
-- (Eseguire SOLO se la tabella vini esiste già)
-- ============================================

-- Aggiungi colonna anno se non esiste
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'vini' 
        AND column_name = 'anno'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE vini ADD COLUMN anno INTEGER CHECK (anno >= 1800 AND anno <= 2100);
        CREATE INDEX idx_vini_anno ON vini(anno);
        RAISE NOTICE '✅ Colonna anno aggiunta alla tabella vini';
    ELSE
        RAISE NOTICE 'ℹ️  Colonna anno già presente nella tabella vini';
    END IF;
END $$;

-- ============================================
-- FINE SCHEMA
-- ============================================

-- Messaggio di conferma
DO $$
BEGIN
    RAISE NOTICE '✅ Schema WINENODE creato con successo!';
    RAISE NOTICE '📋 Tabelle create: vini, tipologie, produttori, fornitori';
    RAISE NOTICE '📅 Colonna anno aggiunta alla tabella vini';
    RAISE NOTICE '🔒 RLS abilitato su tutte le tabelle';
    RAISE NOTICE '⚡ Indici e trigger configurati';
    RAISE NOTICE '🎯 Pronto per sincronizzazione con frontend';
END $$;
