const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');

let db;

function initDatabase() {
  const dbPath = path.join(app.getPath('userData'), 'apmc_billing.db');
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  createTables();
  
  try {
    db.exec(`ALTER TABLE invoices ADD COLUMN items TEXT`);
  } catch (e) {
    // Column might already exist
  }
  
  seedDefaults();
  return db;
}

function getDb() { return db; }

function createTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pin_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS bill_headers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name_en TEXT NOT NULL,
      name_gu TEXT,
      address TEXT,
      mobile TEXT,
      is_default INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS parties (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      mobile TEXT DEFAULT '',
      address TEXT DEFAULT '',
      product TEXT DEFAULT 'Jeera',
      notes TEXT DEFAULT '',
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_number TEXT UNIQUE NOT NULL,
      party_id INTEGER,
      bill_header_id INTEGER,
      date DATETIME DEFAULT CURRENT_TIMESTAMP,
      product TEXT DEFAULT 'Jeera',
      weight_kg REAL NOT NULL,
      rate REAL NOT NULL,
      total_amount REAL NOT NULL,
      transport_expense REAL DEFAULT 0,
      other_expense REAL DEFAULT 0,
      commission_percent REAL NOT NULL,
      commission_amount REAL NOT NULL,
      final_payable REAL NOT NULL,
      notes TEXT DEFAULT '',
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (party_id) REFERENCES parties(id),
      FOREIGN KEY (bill_header_id) REFERENCES bill_headers(id)
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS backups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filepath TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

function seedDefaults() {
  const count = db.prepare('SELECT COUNT(*) as c FROM bill_headers').get();
  if (count.c === 0) {
    const stmt = db.prepare(
      'INSERT INTO bill_headers (name_en, name_gu, address, mobile, is_default) VALUES (?,?,?,?,?)'
    );
    stmt.run('M/S. MEHULKUMAR NATVARLAL', 'મેસર્સ મેહુલકુમાર નટવરલાલ', 'APMC Market Yard, Unjha, Gujarat', '9876543210', 1);
    stmt.run('M/S. NATVARLAL HARILAL', 'મેસર્સ નટવરલાલ હરિલાલ', 'APMC Market Yard, Unjha, Gujarat', '9876543211', 0);
    stmt.run('APMC UNJHA', 'એ.પી.એમ.સી. ઊંઝા', 'APMC Market Yard, Unjha, Gujarat - 384170', '9876543212', 0);
  }
  const settingsCount = db.prepare('SELECT COUNT(*) as c FROM settings').get();
  if (settingsCount.c === 0) {
    const s = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?,?)');
    s.run('theme', 'dark');
    s.run('language', 'en');
    s.run('default_commission', '5');
    s.run('auto_lock_minutes', '15');
    s.run('currency_symbol', '₹');
  }
}

module.exports = { initDatabase, getDb };
