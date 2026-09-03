import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import type {
  UserV4,
  FirmProfile,
} from '../../types/domain-v4';
import type { FinovaV4State } from './repo-v4';

const IS_VERCEL = Boolean(process.env.VERCEL);
const ROOT_DATA_DIR = path.join(process.cwd(), 'data');
const DATA_DIR = IS_VERCEL ? path.join('/tmp', 'finova_data') : ROOT_DATA_DIR;
const DB_PATH = path.join(DATA_DIR, 'finova.db');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// If running in serverless Vercel, copy seeded database from repository to /tmp
if (IS_VERCEL && !fs.existsSync(DB_PATH)) {
  const seedDb = path.join(ROOT_DATA_DIR, 'finova.db');
  if (fs.existsSync(seedDb)) {
    try {
      fs.copyFileSync(seedDb, DB_PATH);
      console.log('Copied seed database to /tmp for Vercel runtime.');
    } catch (e) {
      console.error('Failed copying seed db to /tmp:', e);
    }
  }
}

let dbInstance: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (!dbInstance) {
    dbInstance = new Database(DB_PATH);
    // Configure High-Performance & ACID Concurrency Settings
    dbInstance.pragma('journal_mode = WAL');
    dbInstance.pragma('synchronous = NORMAL');
    dbInstance.pragma('busy_timeout = 5000');
    initSchema(dbInstance);
  }
  return dbInstance;
}

export interface DbUser {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  role: string;
  title: string;
  cpa_license: string | null;
  created_at: string;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      title TEXT NOT NULL,
      cpa_license TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      engagement_id TEXT NOT NULL,
      actor_id TEXT NOT NULL,
      actor_role TEXT NOT NULL,
      action TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id TEXT NOT NULL,
      details_json TEXT NOT NULL,
      timestamp TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS app_state (
      key TEXT PRIMARY KEY,
      json_data TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // Seed default users if empty
  const userCount = db.prepare('SELECT count(*) as count FROM users').get() as { count: number };
  if (userCount.count === 0) {
    seedDefaultUsers(db);
  }

  // Seed initial app_state from finova_store.json if empty
  const stateRow = db.prepare('SELECT key FROM app_state WHERE key = ?').get('finova_v4_state');
  if (!stateRow) {
    const storePath = fs.existsSync(path.join(DATA_DIR, 'finova_store.json')) ? path.join(DATA_DIR, 'finova_store.json') : path.join(ROOT_DATA_DIR, 'finova_store.json');
    if (fs.existsSync(storePath)) {
      try {
        const raw = fs.readFileSync(storePath, 'utf8');
        db.prepare(`
          INSERT INTO app_state (key, json_data, updated_at)
          VALUES ('finova_v4_state', ?, ?)
        `).run(raw, new Date().toISOString());
        console.log('Migrated finova_store.json into SQLite app_state table.');
      } catch (e) {
        console.error('Failed to migrate finova_store.json:', e);
      }
    }
  }
}

export const DEFAULT_CREDENTIALS: Record<string, string> = {
  'haidar@kaphaidar.co.id': 'Partner123!',
  'siti.r@kaphaidar.co.id': 'Manager123!',
  'ahmad.p@kaphaidar.co.id': 'Senior123!',
  'budi.s@kaphaidar.co.id': 'Preparer123!',
};

function seedDefaultUsers(db: Database.Database) {
  const insert = db.prepare(`
    INSERT INTO users (id, email, password_hash, name, role, title, cpa_license, created_at)
    VALUES (@id, @email, @password_hash, @name, @role, @title, @cpa_license, @created_at)
  `);

  const initialUsers: DbUser[] = [
    {
      id: 'USR-PARTNER-01',
      email: 'haidar@kaphaidar.co.id',
      password_hash: bcrypt.hashSync(DEFAULT_CREDENTIALS['haidar@kaphaidar.co.id'], 10),
      name: 'Haidar, CPA, CA',
      role: 'partner',
      title: 'Managing Engagement Partner',
      cpa_license: 'AP.0942',
      created_at: '2026-01-01T00:00:00Z',
    },
    {
      id: 'USR-MGR-01',
      email: 'siti.r@kaphaidar.co.id',
      password_hash: bcrypt.hashSync(DEFAULT_CREDENTIALS['siti.r@kaphaidar.co.id'], 10),
      name: 'Siti Rahmawati, CA',
      role: 'manager',
      title: 'Audit Engagement Manager',
      cpa_license: 'CA.18471',
      created_at: '2026-01-01T00:00:00Z',
    },
    {
      id: 'USR-SNR-01',
      email: 'ahmad.p@kaphaidar.co.id',
      password_hash: bcrypt.hashSync(DEFAULT_CREDENTIALS['ahmad.p@kaphaidar.co.id'], 10),
      name: 'Ahmad Pratama, S.Ak',
      role: 'senior',
      title: 'Senior Field Auditor In-Charge',
      cpa_license: null,
      created_at: '2026-01-01T00:00:00Z',
    },
    {
      id: 'USR-PREP-01',
      email: 'budi.s@kaphaidar.co.id',
      password_hash: bcrypt.hashSync(DEFAULT_CREDENTIALS['budi.s@kaphaidar.co.id'], 10),
      name: 'Budi Santoso, S.Ak',
      role: 'preparer',
      title: 'Junior Audit Associate',
      cpa_license: null,
      created_at: '2026-01-01T00:00:00Z',
    },
  ];

  const tx = db.transaction(() => {
    for (const u of initialUsers) {
      insert.run(u);
    }
  });

  tx();
  console.log('Seeded default enterprise users into SQLite with Bcrypt hashing.');
}

/**
 * Load FinovaV4State from SQLite app_state
 */
export function loadStateFromDb(): FinovaV4State | null {
  try {
    const db = getDatabase();
    const row = db.prepare('SELECT json_data FROM app_state WHERE key = ?').get('finova_v4_state') as { json_data: string } | undefined;
    if (row && row.json_data) {
      return JSON.parse(row.json_data) as FinovaV4State;
    }
  } catch (e) {
    console.error('Error loading state from SQLite:', e);
  }
  return null;
}

/**
 * Atomically save FinovaV4State into SQLite with full ACID transaction guarantees
 */
export function saveStateToDb(state: FinovaV4State): void {
  try {
    const db = getDatabase();
    const jsonStr = JSON.stringify(state, null, 2);
    const now = new Date().toISOString();

    const saveTx = db.transaction(() => {
      db.prepare(`
        INSERT INTO app_state (key, json_data, updated_at)
        VALUES ('finova_v4_state', ?, ?)
        ON CONFLICT(key) DO UPDATE SET
          json_data = excluded.json_data,
          updated_at = excluded.updated_at
      `).run(jsonStr, now);

      // Also mirror to finova_store.json for backwards compatibility
      const storePath = fs.existsSync(path.join(DATA_DIR, 'finova_store.json')) ? path.join(DATA_DIR, 'finova_store.json') : path.join(ROOT_DATA_DIR, 'finova_store.json');
      fs.writeFileSync(storePath, jsonStr, 'utf8');
    });

    saveTx();
  } catch (e) {
    console.error('Error saving state to SQLite:', e);
  }
}

/**
 * User lookup for Authentication
 */
export function getUserByEmail(email: string): DbUser | null {
  const db = getDatabase();
  const row = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(email) as DbUser | undefined;
  return row || null;
}

export function getUserById(id: string): DbUser | null {
  const db = getDatabase();
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as DbUser | undefined;
  return row || null;
}

export function getAllUsers(): DbUser[] {
  const db = getDatabase();
  return db.prepare('SELECT id, email, name, role, title, cpa_license, created_at FROM users').all() as DbUser[];
}
