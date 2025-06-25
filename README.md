# WINENODE - Sistema di Gestione Inventario Vini

Sistema di gestione inventario vini per Camera Con Vista, ottimizzato per dispositivi mobili con interfaccia in italiano.

## 🚀 Deployment su Netlify

### Metodo 1: Drag & Drop (Consigliato)
1. Esegui `npm run build` per creare la cartella `dist`
2. Trascina la cartella `dist` su [Netlify Drop](https://app.netlify.com/drop)
3. Il sito sarà immediatamente online

### Metodo 2: Git Deploy
1. Carica il progetto su GitHub
2. Connetti il repository a Netlify
3. Configura build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`

## 📱 Funzionalità

- **Interfaccia Mobile-First**: Ottimizzata per smartphone (99% degli utenti)
- **Gestione Inventario**: Monitoraggio scorte con alert automatici
- **Ricerca Avanzata**: Ricerca per nome vino o fornitore
- **Filtri Intelligenti**: Filtra per tipo, fornitore e stato scorte
- **Sincronizzazione CSV**: Importazione dati da file CSV esterni
- **Design Responsivo**: Funziona perfettamente su tutti i dispositivi

## 🛠️ Tecnologie

- React 18 + TypeScript
- Vite per build ottimizzata
- Tailwind CSS per styling
- Lucide React per iconi
- Configurazione Netlify ottimizzata

## 🔧 Sviluppo Locale

```bash
# Installa dipendenze
npm install

# Avvia server di sviluppo
npm run dev

# Build per produzione
npm run build

# Preview build
npm run preview
```

## 📊 Dati Vini

Il sistema include 12 vini di esempio con:
- Denominazioni italiane autentiche
- Fornitori realistici
- Prezzi e scorte variabili
- Regioni di produzione
- Annate specifiche

## 🎨 Design

- Tema scuro con gradiente bordeaux
- Animazioni fluide e responsive
- Accessibilità mobile ottimizzata
- Interfaccia utente intuitiva

## 🔒 Sicurezza

- Nessuna dipendenza da servizi esterni
- Dati gestiti localmente
- Build process sicuro per Netlify
- Configurazione HTTPS automatica

## 📝 Note di Deployment

Il progetto è stato ottimizzato specificamente per Netlify con:
- Configurazione `netlify.toml` ottimizzata
- Redirects SPA configurati
- Build command ottimizzata
- Dipendenze minimal per build veloce

Per supporto tecnico o personalizzazioni, contattare il team di sviluppo.