import express from 'express';
import cors from 'cors';
import { storage } from './storage';

const app = express();

app.use(cors());
app.use(express.json());

// API Routes
app.get('/api/wines', async (req, res) => {
  try {
    const wines = await storage.getWines();
    res.json(wines);
  } catch (error) {
    console.error('Error fetching wines:', error);
    res.status(500).json({ error: 'Errore nel caricamento dei vini' });
  }
});

app.get('/api/wines/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const wine = await storage.getWineById(id);
    if (!wine) {
      return res.status(404).json({ error: 'Vino non trovato' });
    }
    res.json(wine);
  } catch (error) {
    console.error('Error fetching wine:', error);
    res.status(500).json({ error: 'Errore nel caricamento del vino' });
  }
});

app.post('/api/wines', async (req, res) => {
  try {
    const wine = await storage.createWine(req.body);
    res.status(201).json(wine);
  } catch (error) {
    console.error('Error creating wine:', error);
    res.status(500).json({ error: 'Errore nella creazione del vino' });
  }
});

app.put('/api/wines/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const wine = await storage.updateWine(id, req.body);
    if (!wine) {
      return res.status(404).json({ error: 'Vino non trovato' });
    }
    res.json(wine);
  } catch (error) {
    console.error('Error updating wine:', error);
    res.status(500).json({ error: 'Errore nell\'aggiornamento del vino' });
  }
});

app.delete('/api/wines/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const deleted = await storage.deleteWine(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Vino non trovato' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting wine:', error);
    res.status(500).json({ error: 'Errore nella cancellazione del vino' });
  }
});

app.get('/api/suppliers', async (req, res) => {
  try {
    const suppliers = await storage.getSuppliers();
    res.json(suppliers);
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    res.status(500).json({ error: 'Errore nel caricamento dei fornitori' });
  }
});

app.get('/api/wines/type/:type', async (req, res) => {
  try {
    const wines = await storage.getWinesByType(req.params.type);
    res.json(wines);
  } catch (error) {
    console.error('Error fetching wines by type:', error);
    res.status(500).json({ error: 'Errore nel caricamento dei vini per tipo' });
  }
});

app.get('/api/wines/supplier/:supplier', async (req, res) => {
  try {
    const wines = await storage.getWinesBySupplier(req.params.supplier);
    res.json(wines);
  } catch (error) {
    console.error('Error fetching wines by supplier:', error);
    res.status(500).json({ error: 'Errore nel caricamento dei vini per fornitore' });
  }
});

app.get('/api/wines/alerts/low-stock', async (req, res) => {
  try {
    const wines = await storage.getLowStockWines();
    res.json(wines);
  } catch (error) {
    console.error('Error fetching low stock wines:', error);
    res.status(500).json({ error: 'Errore nel caricamento degli avvisi scorte' });
  }
});

// Google Sheet API endpoints
app.get('/api/google-sheet-link/:userId', async (req, res) => {
  try {
    const link = await storage.getGoogleSheetLink(req.params.userId);
    res.json(link || null);
  } catch (error) {
    console.error('Error fetching Google Sheet link:', error);
    res.status(500).json({ error: 'Errore nel caricamento del link Google Sheet' });
  }
});

app.post('/api/google-sheet-link', async (req, res) => {
  try {
    const { userId, sheetUrl } = req.body;
    if (!userId || !sheetUrl) {
      return res.status(400).json({ error: 'UserId e sheetUrl sono richiesti' });
    }
    const link = await storage.saveGoogleSheetLink(userId, sheetUrl);
    res.json(link);
  } catch (error) {
    console.error('Error saving Google Sheet link:', error);
    res.status(500).json({ error: 'Errore nel salvataggio del link Google Sheet' });
  }
});

app.delete('/api/google-sheet-link/:userId', async (req, res) => {
  try {
    const success = await storage.deleteGoogleSheetLink(req.params.userId);
    if (success) {
      res.json({ message: 'Link eliminato con successo' });
    } else {
      res.status(404).json({ error: 'Link non trovato' });
    }
  } catch (error) {
    console.error('Error deleting Google Sheet link:', error);
    res.status(500).json({ error: 'Errore nell\'eliminazione del link Google Sheet' });
  }
});

app.post('/api/import-google-sheet', async (req, res) => {
  try {
    const { userId, sheetUrl } = req.body;
    if (!userId || !sheetUrl) {
      return res.status(400).json({ error: 'UserId e sheetUrl sono richiesti' });
    }

    // Convert Google Sheets URL to CSV export URL
    let csvUrl = sheetUrl;
    if (sheetUrl.includes('/edit')) {
      csvUrl = sheetUrl.replace('/edit#gid=', '/export?format=csv&gid=');
      if (!csvUrl.includes('export?format=csv')) {
        csvUrl = sheetUrl.replace('/edit', '/export?format=csv');
      }
    }

    // Fetch CSV data
    const response = await fetch(csvUrl);
    if (!response.ok) {
      throw new Error(`Errore nel download: ${response.status}`);
    }
    
    const csvText = await response.text();
    const lines = csvText.split('\n').filter(line => line.trim());
    
    let importedCount = 0;
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) { // Skip header
      const line = lines[i].trim();
      if (!line) continue;

      try {
        const columns = line.split(',').map(col => col.replace(/"/g, '').trim());
        if (columns.length >= 2) {
          const name = columns[0];
          const type = columns[1].toLowerCase();
          
          if (name && type && ['rosso', 'bianco', 'bollicine', 'rosato'].includes(type)) {
            await storage.createWine({
              name,
              type,
              supplier: columns[2] || 'Non specificato',
              inventory: parseInt(columns[3]) || 3,
              minStock: parseInt(columns[4]) || 2,
              price: columns[5] || '0.00',
              vintage: columns[6] || null,
              region: columns[7] || null,
              description: columns[8] || null,
              userId
            });
            importedCount++;
          }
        }
      } catch (error) {
        errors.push(`Riga ${i + 1}: ${error.message}`);
      }
    }

    res.json({ 
      success: true, 
      imported: importedCount, 
      errors: errors.length > 0 ? errors : undefined 
    });
  } catch (error) {
    console.error('Error importing Google Sheet:', error);
    res.status(500).json({ error: 'Errore nell\'importazione del Google Sheet' });
  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server API avviato sulla porta ${PORT}`);
});

export { app };