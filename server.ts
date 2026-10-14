import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { dbService } from './src/server/db.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// --- REST API ROUTES ---

// Health & Status
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    system: 'SENA LabConstrucción Inventory Engine',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Config & Custodian
app.get('/api/config', (req, res) => {
  try {
    const config = dbService.getConfig();
    res.json(config);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/config', (req, res) => {
  try {
    const actor = req.headers['x-actor-name'] as string || 'Administrador SENA';
    const updated = dbService.updateConfig(req.body, actor);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Dashboard indicators
app.get('/api/dashboard', (req, res) => {
  try {
    const metrics = dbService.getDashboardMetrics();
    res.json(metrics);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Inventory
app.get('/api/inventory', (req, res) => {
  try {
    const items = dbService.getItems();
    res.json(items);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/inventory/:id', (req, res) => {
  try {
    const item = dbService.getItemById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Elemento no encontrado' });
    }
    res.json(item);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/inventory', (req, res) => {
  try {
    const actor = req.headers['x-actor-name'] as string || dbService.getConfig().custodianName;
    const newItem = dbService.createItem(req.body, actor);
    res.status(201).json(newItem);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/inventory/:id', (req, res) => {
  try {
    const actor = req.headers['x-actor-name'] as string || dbService.getConfig().custodianName;
    const updated = dbService.updateItem(req.params.id, req.body, actor);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/inventory/:id', (req, res) => {
  try {
    const actor = req.headers['x-actor-name'] as string || dbService.getConfig().custodianName;
    const success = dbService.deleteItem(req.params.id, actor);
    res.json({ success });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Borrowers
app.get('/api/borrowers', (req, res) => {
  try {
    const borrowers = dbService.getBorrowers();
    res.json(borrowers);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/borrowers', (req, res) => {
  try {
    const actor = req.headers['x-actor-name'] as string || dbService.getConfig().custodianName;
    const borrower = dbService.createBorrower(req.body, actor);
    res.status(201).json(borrower);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Loans
app.get('/api/loans', (req, res) => {
  try {
    const loans = dbService.getLoans();
    res.json(loans);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/loans/:id', (req, res) => {
  try {
    const loan = dbService.getLoanById(req.params.id);
    if (!loan) return res.status(404).json({ error: 'Préstamo no encontrado' });
    res.json(loan);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/loans', (req, res) => {
  try {
    const actor = req.headers['x-actor-name'] as string || dbService.getConfig().custodianName;
    const loan = dbService.createLoan(req.body, actor);
    res.status(201).json(loan);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Returns
app.post('/api/returns', (req, res) => {
  try {
    const actor = req.headers['x-actor-name'] as string || dbService.getConfig().custodianName;
    const returnRecord = dbService.processReturn(req.body, actor);
    res.status(201).json(returnRecord);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Custody Query: Who has what item?
app.get('/api/custody', (req, res) => {
  try {
    const custodyRecords = dbService.getCustodyRecords();
    res.json(custodyRecords);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Movement History
app.get('/api/movements', (req, res) => {
  try {
    const itemId = req.query.itemId as string | undefined;
    const movements = dbService.getMovements(itemId);
    res.json(movements);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Bulk Import
app.post('/api/import', (req, res) => {
  try {
    const actor = req.headers['x-actor-name'] as string || dbService.getConfig().custodianName;
    const items = req.body.items;
    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'El formato de datos debe ser un arreglo de elementos.' });
    }
    const result = dbService.bulkImport(items, actor);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Full Backup & Restore
app.get('/api/backup', (req, res) => {
  try {
    const backup = dbService.exportFullBackup();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=SENA_LAB_BACKUP_${new Date().toISOString().slice(0, 10)}.json`);
    res.json(backup);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/backup/restore', (req, res) => {
  try {
    const actor = req.headers['x-actor-name'] as string || 'Administrador';
    const success = dbService.restoreBackup(req.body, actor);
    res.json({ success, message: 'Base de datos restaurada correctamente.' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// --- VITE MIDDLEWARE / STATIC ASSETS INTEGRATION ---
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve production static build
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SENA Lab Engine] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[SENA Lab Engine] Failed to start server:', err);
});
