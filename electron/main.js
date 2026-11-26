const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { initDatabase, getDb } = require('./database');

const isDev = process.env.NODE_ENV === 'development';

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    title: 'APMC Unjha - Commission Billing',
    icon: path.join(__dirname, '../public/icon.ico'),
    frame: false,
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    backgroundColor: '#0B0D13',
    show: false,
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  initDatabase();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ─── Window Controls ────────────────────────────────────────────────
ipcMain.on('window:minimize', () => mainWindow?.minimize());
ipcMain.on('window:maximize', () => {
  if (mainWindow?.isMaximized()) mainWindow.unmaximize();
  else mainWindow?.maximize();
});
ipcMain.on('window:close', () => mainWindow?.close());
ipcMain.handle('window:isMaximized', () => mainWindow?.isMaximized());

// ─── Auth / PIN ─────────────────────────────────────────────────────
ipcMain.handle('auth:checkPinExists', () => {
  const db = getDb();
  const row = db.prepare('SELECT COUNT(*) as count FROM users').get();
  return row.count > 0;
});

ipcMain.handle('auth:setPin', (_, pinHash) => {
  const db = getDb();
  db.prepare('DELETE FROM users').run();
  db.prepare('INSERT INTO users (pin_hash) VALUES (?)').run(pinHash);
  return true;
});

ipcMain.handle('auth:getPin', () => {
  const db = getDb();
  const row = db.prepare('SELECT pin_hash FROM users ORDER BY id DESC LIMIT 1').get();
  return row ? row.pin_hash : null;
});

// ─── Bill Headers ───────────────────────────────────────────────────
ipcMain.handle('headers:getAll', () => {
  const db = getDb();
  return db.prepare('SELECT * FROM bill_headers ORDER BY id').all();
});

ipcMain.handle('headers:getDefault', () => {
  const db = getDb();
  return db.prepare('SELECT * FROM bill_headers WHERE is_default = 1 LIMIT 1').get();
});

ipcMain.handle('headers:setDefault', (_, id) => {
  const db = getDb();
  db.prepare('UPDATE bill_headers SET is_default = 0').run();
  db.prepare('UPDATE bill_headers SET is_default = 1 WHERE id = ?').run(id);
  return true;
});

// ─── Parties ────────────────────────────────────────────────────────
ipcMain.handle('parties:getAll', () => {
  const db = getDb();
  return db.prepare('SELECT * FROM parties WHERE status = ? ORDER BY name').all('active');
});

ipcMain.handle('parties:getById', (_, id) => {
  const db = getDb();
  return db.prepare('SELECT * FROM parties WHERE id = ?').get(id);
});

ipcMain.handle('parties:create', (_, party) => {
  const db = getDb();
  const result = db.prepare(
    'INSERT INTO parties (name, mobile, address, product, notes) VALUES (?, ?, ?, ?, ?)'
  ).run(party.name, party.mobile || '', party.address || '', party.product || 'Jeera', party.notes || '');
  return { id: result.lastInsertRowid, ...party };
});

ipcMain.handle('parties:update', (_, id, party) => {
  const db = getDb();
  db.prepare(
    'UPDATE parties SET name=?, mobile=?, address=?, product=?, notes=?, updated_at=CURRENT_TIMESTAMP WHERE id=?'
  ).run(party.name, party.mobile || '', party.address || '', party.product || 'Jeera', party.notes || '', id);
  return true;
});

ipcMain.handle('parties:delete', (_, id) => {
  const db = getDb();
  db.prepare("UPDATE parties SET status='deleted', updated_at=CURRENT_TIMESTAMP WHERE id=?").run(id);
  return true;
});

ipcMain.handle('parties:getStats', (_, id) => {
  const db = getDb();
  const stats = db.prepare(`
    SELECT 
      COUNT(*) as total_invoices,
      COALESCE(SUM(total_amount), 0) as total_sales,
      COALESCE(SUM(commission_amount), 0) as total_commission,
      COALESCE(SUM(final_payable), 0) as total_payable
    FROM invoices WHERE party_id = ? AND status = 'active'
  `).get(id);
  return stats;
});

// ─── Invoices ───────────────────────────────────────────────────────
ipcMain.handle('invoices:getAll', (_, filters) => {
  const db = getDb();
  let query = `
    SELECT i.*, p.name as party_name, p.mobile as party_mobile, 
           bh.name_en as header_name_en, bh.name_gu as header_name_gu
    FROM invoices i
    LEFT JOIN parties p ON i.party_id = p.id
    LEFT JOIN bill_headers bh ON i.bill_header_id = bh.id
    WHERE i.status = 'active'
  `;
  const params = [];

  if (filters?.partyId) {
    query += ' AND i.party_id = ?';
    params.push(filters.partyId);
  }
  if (filters?.startDate) {
    query += ' AND DATE(i.date) >= DATE(?)';
    params.push(filters.startDate);
  }
  if (filters?.endDate) {
    query += ' AND DATE(i.date) <= DATE(?)';
    params.push(filters.endDate);
  }
  if (filters?.search) {
    query += ' AND (i.invoice_number LIKE ? OR p.name LIKE ?)';
    params.push(`%${filters.search}%`, `%${filters.search}%`);
  }

  query += ' ORDER BY i.created_at DESC';

  if (filters?.limit) {
    query += ' LIMIT ?';
    params.push(filters.limit);
  }

  const invoices = db.prepare(query).all(...params);
  invoices.forEach(i => {
    if (i.items) {
      try { i.items = JSON.parse(i.items); } catch(e) {}
    }
  });
  return invoices;
});

ipcMain.handle('invoices:getById', (_, id) => {
  const db = getDb();
  const invoice = db.prepare(`
    SELECT i.*, p.name as party_name, p.mobile as party_mobile, p.address as party_address,
           bh.name_en as header_name_en, bh.name_gu as header_name_gu,
           bh.address as header_address, bh.mobile as header_mobile
    FROM invoices i
    LEFT JOIN parties p ON i.party_id = p.id
    LEFT JOIN bill_headers bh ON i.bill_header_id = bh.id
    WHERE i.id = ?
  `).get(id);
  
  if (invoice && invoice.items) {
    try { invoice.items = JSON.parse(invoice.items); } catch(e) {}
  }
  return invoice;
});

ipcMain.handle('invoices:create', (_, invoice) => {
  const db = getDb();
  // Generate invoice number
  const today = new Date();
  const prefix = `INV-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}`;
  const lastInv = db.prepare(
    "SELECT invoice_number FROM invoices WHERE invoice_number LIKE ? ORDER BY id DESC LIMIT 1"
  ).get(`${prefix}%`);

  let seq = 1;
  if (lastInv) {
    const lastSeq = parseInt(lastInv.invoice_number.split('-').pop());
    seq = lastSeq + 1;
  }
  const invoiceNumber = `${prefix}-${String(seq).padStart(4, '0')}`;

  const result = db.prepare(`
    INSERT INTO invoices (invoice_number, party_id, bill_header_id, date, product, weight_kg, rate, 
    total_amount, transport_expense, other_expense, commission_percent, commission_amount, 
    final_payable, notes, items) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    invoiceNumber, invoice.party_id, invoice.bill_header_id,
    invoice.date || new Date().toISOString(), invoice.product || 'Jeera',
    invoice.weight_kg, invoice.rate, invoice.total_amount,
    invoice.transport_expense || 0, invoice.other_expense || 0,
    invoice.commission_percent, invoice.commission_amount, invoice.final_payable,
    invoice.notes || '',
    invoice.items ? JSON.stringify(invoice.items) : null
  );

  return { id: result.lastInsertRowid, invoice_number: invoiceNumber };
});

ipcMain.handle('invoices:update', (_, id, invoice) => {
  const db = getDb();
  db.prepare(`
    UPDATE invoices SET party_id=?, bill_header_id=?, product=?, weight_kg=?, rate=?,
    total_amount=?, transport_expense=?, other_expense=?, commission_percent=?,
    commission_amount=?, final_payable=?, notes=?, items=?, updated_at=CURRENT_TIMESTAMP WHERE id=?
  `).run(
    invoice.party_id, invoice.bill_header_id, invoice.product || 'Jeera',
    invoice.weight_kg, invoice.rate, invoice.total_amount,
    invoice.transport_expense || 0, invoice.other_expense || 0,
    invoice.commission_percent, invoice.commission_amount, invoice.final_payable,
    invoice.notes || '',
    invoice.items ? JSON.stringify(invoice.items) : null,
    id
  );
  return true;
});

ipcMain.handle('invoices:delete', (_, id) => {
  const db = getDb();
  db.prepare("UPDATE invoices SET status='deleted', updated_at=CURRENT_TIMESTAMP WHERE id=?").run(id);
  return true;
});

ipcMain.handle('invoices:duplicate', (_, id) => {
  const db = getDb();
  const original = db.prepare('SELECT * FROM invoices WHERE id = ?').get(id);
  if (!original) return null;

  const today = new Date();
  const prefix = `INV-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}`;
  const lastInv = db.prepare(
    "SELECT invoice_number FROM invoices WHERE invoice_number LIKE ? ORDER BY id DESC LIMIT 1"
  ).get(`${prefix}%`);
  let seq = 1;
  if (lastInv) seq = parseInt(lastInv.invoice_number.split('-').pop()) + 1;
  const invoiceNumber = `${prefix}-${String(seq).padStart(4, '0')}`;

  const result = db.prepare(`
    INSERT INTO invoices (invoice_number, party_id, bill_header_id, date, product, weight_kg, rate,
    total_amount, transport_expense, other_expense, commission_percent, commission_amount,
    final_payable, notes, items) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    invoiceNumber, original.party_id, original.bill_header_id,
    new Date().toISOString(), original.product, original.weight_kg, original.rate,
    original.total_amount, original.transport_expense, original.other_expense,
    original.commission_percent, original.commission_amount, original.final_payable,
    original.notes || '',
    original.items || null
  );

  return { id: result.lastInsertRowid, invoice_number: invoiceNumber };
});

// ─── Dashboard Stats ────────────────────────────────────────────────
ipcMain.handle('dashboard:getStats', () => {
  const db = getDb();
  const today = new Date().toISOString().split('T')[0];
  const monthStart = `${today.substring(0, 7)}-01`;
  const yearStart = `${today.substring(0, 4)}-01-01`;

  const totalStats = db.prepare(`
    SELECT COALESCE(SUM(commission_amount), 0) as total_commission,
           COALESCE(SUM(total_amount), 0) as total_sales,
           COALESCE(SUM(final_payable), 0) as total_revenue,
           COALESCE(SUM(transport_expense + other_expense), 0) as total_expenses,
           COUNT(*) as total_invoices
    FROM invoices WHERE status = 'active'
  `).get();

  const todayStats = db.prepare(`
    SELECT COALESCE(SUM(commission_amount), 0) as commission,
           COALESCE(SUM(total_amount), 0) as sales,
           COUNT(*) as invoices
    FROM invoices WHERE status = 'active' AND DATE(date) = DATE(?)
  `).get(today);

  const monthStats = db.prepare(`
    SELECT COALESCE(SUM(commission_amount), 0) as commission,
           COALESCE(SUM(total_amount), 0) as sales,
           COUNT(*) as invoices
    FROM invoices WHERE status = 'active' AND DATE(date) >= DATE(?)
  `).get(monthStart);

  const yearStats = db.prepare(`
    SELECT COALESCE(SUM(commission_amount), 0) as commission,
           COALESCE(SUM(total_amount), 0) as sales,
           COUNT(*) as invoices
    FROM invoices WHERE status = 'active' AND DATE(date) >= DATE(?)
  `).get(yearStart);

  const topParties = db.prepare(`
    SELECT p.name, p.id, SUM(i.commission_amount) as total_commission,
           SUM(i.total_amount) as total_sales, COUNT(i.id) as invoice_count
    FROM invoices i JOIN parties p ON i.party_id = p.id
    WHERE i.status = 'active'
    GROUP BY p.id ORDER BY total_commission DESC LIMIT 5
  `).all();

  const highestBills = db.prepare(`
    SELECT i.invoice_number, i.commission_amount, i.total_amount, i.date,
           p.name as party_name
    FROM invoices i LEFT JOIN parties p ON i.party_id = p.id
    WHERE i.status = 'active'
    ORDER BY i.commission_amount DESC LIMIT 5
  `).all();

  const monthlyTrend = db.prepare(`
    SELECT strftime('%Y-%m', date) as month,
           SUM(commission_amount) as commission,
           SUM(total_amount) as sales,
           SUM(transport_expense + other_expense) as expenses,
           COUNT(*) as invoices
    FROM invoices WHERE status = 'active'
    GROUP BY month ORDER BY month DESC LIMIT 12
  `).all().reverse();

  const recentBills = db.prepare(`
    SELECT i.*, p.name as party_name
    FROM invoices i LEFT JOIN parties p ON i.party_id = p.id
    WHERE i.status = 'active'
    ORDER BY i.created_at DESC LIMIT 10
  `).all();

  recentBills.forEach(b => {
    if (b.items) {
      try { b.items = JSON.parse(b.items); } catch(e) {}
    }
  });

  return {
    total: totalStats,
    today: todayStats,
    month: monthStats,
    year: yearStats,
    topParties,
    highestBills,
    monthlyTrend,
    recentBills,
    netProfit: totalStats.total_commission - totalStats.total_expenses,
  };
});

// ─── Reports ────────────────────────────────────────────────────────
ipcMain.handle('reports:generate', (_, filters) => {
  const db = getDb();
  let query = `
    SELECT i.*, p.name as party_name, p.mobile as party_mobile
    FROM invoices i LEFT JOIN parties p ON i.party_id = p.id
    WHERE i.status = 'active'
  `;
  const params = [];

  if (filters?.partyId) {
    query += ' AND i.party_id = ?';
    params.push(filters.partyId);
  }
  if (filters?.startDate) {
    query += ' AND DATE(i.date) >= DATE(?)';
    params.push(filters.startDate);
  }
  if (filters?.endDate) {
    query += ' AND DATE(i.date) <= DATE(?)';
    params.push(filters.endDate);
  }
  if (filters?.product) {
    query += ' AND i.product = ?';
    params.push(filters.product);
  }

  query += ' ORDER BY i.date DESC';
  const invoices = db.prepare(query).all(...params);
  invoices.forEach(i => {
    if (i.items) {
      try { i.items = JSON.parse(i.items); } catch(e) {}
    }
  });

  const summary = {
    total_sales: invoices.reduce((s, i) => s + i.total_amount, 0),
    total_commission: invoices.reduce((s, i) => s + i.commission_amount, 0),
    total_transport: invoices.reduce((s, i) => s + i.transport_expense, 0),
    total_other_expense: invoices.reduce((s, i) => s + i.other_expense, 0),
    total_payable: invoices.reduce((s, i) => s + i.final_payable, 0),
    total_weight: invoices.reduce((s, i) => s + i.weight_kg, 0),
    invoice_count: invoices.length,
  };

  return { invoices, summary };
});

// ─── Settings ───────────────────────────────────────────────────────
ipcMain.handle('settings:get', (_, key) => {
  const db = getDb();
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
  return row ? row.value : null;
});

ipcMain.handle('settings:set', (_, key, value) => {
  const db = getDb();
  db.prepare(
    'INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)'
  ).run(key, value);
  return true;
});

// ─── Backup & Restore ───────────────────────────────────────────────
ipcMain.handle('backup:create', async () => {
  const db = getDb();
  const { filePath } = await dialog.showSaveDialog(mainWindow, {
    title: 'Save Backup',
    defaultPath: `apmc-backup-${new Date().toISOString().split('T')[0]}.db`,
    filters: [{ name: 'Database', extensions: ['db'] }],
  });
  if (!filePath) return null;

  const dbPath = path.join(app.getPath('userData'), 'apmc_billing.db');
  fs.copyFileSync(dbPath, filePath);
  db.prepare('INSERT INTO backups (filepath) VALUES (?)').run(filePath);
  return filePath;
});

ipcMain.handle('backup:restore', async () => {
  const { filePaths } = await dialog.showOpenDialog(mainWindow, {
    title: 'Restore Backup',
    filters: [{ name: 'Database', extensions: ['db'] }],
    properties: ['openFile'],
  });
  if (!filePaths?.length) return null;

  const dbPath = path.join(app.getPath('userData'), 'apmc_billing.db');
  // Create safety backup first
  const safetyPath = dbPath + '.safety-' + Date.now();
  fs.copyFileSync(dbPath, safetyPath);
  fs.copyFileSync(filePaths[0], dbPath);

  app.relaunch();
  app.exit(0);
  return true;
});

ipcMain.handle('backup:autoBackup', () => {
  const dbPath = path.join(app.getPath('userData'), 'apmc_billing.db');
  const backupDir = path.join(app.getPath('userData'), 'backups');
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

  const backupPath = path.join(backupDir, `auto-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.db`);
  fs.copyFileSync(dbPath, backupPath);

  // Keep only last 10 auto backups
  const backups = fs.readdirSync(backupDir)
    .filter(f => f.startsWith('auto-backup-'))
    .sort()
    .reverse();
  backups.slice(10).forEach(f => fs.unlinkSync(path.join(backupDir, f)));

  return backupPath;
});

// ─── Delete All Data ────────────────────────────────────────────────
ipcMain.handle('data:deleteAll', () => {
  const db = getDb();
  db.prepare('DELETE FROM invoices').run();
  db.prepare('DELETE FROM parties').run();
  db.prepare('DELETE FROM backups').run();
  db.prepare("DELETE FROM settings WHERE key != 'theme'").run();
  return true;
});

// ─── Print Invoice ──────────────────────────────────────────────────
ipcMain.handle('invoice:print', async (_, htmlContent) => {
  if (!htmlContent) return false;
  
  const printWin = new BrowserWindow({ show: false });
  printWin.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(htmlContent));
  
  return new Promise((resolve) => {
    printWin.webContents.on('did-finish-load', async () => {
      try {
        await printWin.webContents.print({ silent: false, printBackground: true });
        printWin.close();
        resolve(true);
      } catch {
        printWin.close();
        resolve(false);
      }
    });
  });
});

ipcMain.handle('invoice:savePdf', async (_, invoiceNumber, htmlContent) => {
  if (!htmlContent) return null;

  const { filePath } = await dialog.showSaveDialog(mainWindow, {
    title: 'Save Invoice PDF',
    defaultPath: `${invoiceNumber || 'invoice'}.pdf`,
    filters: [{ name: 'PDF', extensions: ['pdf'] }],
  });
  if (!filePath) return null;

  const printWin = new BrowserWindow({ show: false });
  printWin.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(htmlContent));

  return new Promise((resolve) => {
    printWin.webContents.on('did-finish-load', async () => {
      try {
        const pdfData = await printWin.webContents.printToPDF({
          printBackground: true,
          marginType: 1, // No margin
          pageSize: 'A4'
        });
        fs.writeFileSync(filePath, pdfData);
        shell.openPath(filePath);
        printWin.close();
        resolve(filePath);
      } catch (e) {
        console.error(e);
        printWin.close();
        resolve(null);
      }
    });
  });
});
