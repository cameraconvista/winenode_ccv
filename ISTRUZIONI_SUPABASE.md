# Setup Database WINENODE su Supabase

## Script SQL da eseguire

Copia questo script completo nel SQL Editor di Supabase:

```sql
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

-- Abilita RLS per sicurezza multiutente
ALTER TABLE public.giacenze ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fornitori ENABLE ROW LEVEL SECURITY;

-- Policy per giacenze - ogni utente vede solo i propri vini
CREATE POLICY "Users can view own wines" ON public.giacenze
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own wines" ON public.giacenze
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own wines" ON public.giacenze
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own wines" ON public.giacenze
    FOR DELETE USING (auth.uid() = user_id);

-- Policy per fornitori - ogni utente vede solo i propri fornitori
CREATE POLICY "Users can view own suppliers" ON public.fornitori
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own suppliers" ON public.fornitori
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own suppliers" ON public.fornitori
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own suppliers" ON public.fornitori
    FOR DELETE USING (auth.uid() = user_id);

-- Indici per performance
CREATE INDEX IF NOT EXISTS giacenze_user_id_idx ON public.giacenze(user_id);
CREATE INDEX IF NOT EXISTS fornitori_user_id_idx ON public.fornitori(user_id);
```

## Passo successivo

Dopo aver eseguito lo script, torna all'app WINENODE e ricarica la pagina. Dovresti vedere il form di login invece degli errori.