import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { seedDemoData } from './seed';
import { fixAppointmentTimes } from './migrate';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS doctors (
	id INTEGER PRIMARY KEY,
	name TEXT NOT NULL,
	specialty TEXT NOT NULL,
	room TEXT NOT NULL,
	consult_minutes INTEGER NOT NULL DEFAULT 15,
	fee_kobo INTEGER NOT NULL,
	break_start TEXT NOT NULL DEFAULT '13:00',
	break_end TEXT NOT NULL DEFAULT '13:30',
	off_day TEXT
);

CREATE TABLE IF NOT EXISTS users (
	username TEXT PRIMARY KEY,
	name TEXT NOT NULL,
	role TEXT NOT NULL CHECK (role IN ('reception', 'manager', 'doctor')),
	doctor_id INTEGER REFERENCES doctors(id),
	password_hash TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
	token TEXT PRIMARY KEY,
	username TEXT NOT NULL REFERENCES users(username) ON DELETE CASCADE,
	expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tickets (
	id INTEGER PRIMARY KEY,
	day TEXT NOT NULL,
	number INTEGER NOT NULL,
	patient_name TEXT NOT NULL,
	phone TEXT NOT NULL,
	reason TEXT NOT NULL DEFAULT '',
	status TEXT NOT NULL DEFAULT 'waiting',
	doctor_id INTEGER REFERENCES doctors(id),
	issued_at TEXT NOT NULL,
	called_at TEXT,
	finished_at TEXT,
	est_wait_minutes INTEGER NOT NULL DEFAULT 0,
	UNIQUE (day, number)
);

CREATE TABLE IF NOT EXISTS appointments (
	id INTEGER PRIMARY KEY,
	doctor_id INTEGER NOT NULL REFERENCES doctors(id),
	patient_name TEXT NOT NULL,
	phone TEXT NOT NULL,
	reason TEXT NOT NULL DEFAULT '',
	starts_at TEXT NOT NULL,
	ends_at TEXT NOT NULL,
	status TEXT NOT NULL DEFAULT 'booked',
	checked_in_at TEXT,
	created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_appointments_start ON appointments (starts_at);
CREATE INDEX IF NOT EXISTS idx_tickets_day ON tickets (day);
`;

let db: Database.Database | null = null;

export function getDb(): Database.Database {
	if (db) return db;

	const path = process.env.CLINICQ_DB_PATH || 'data/clinicq.db';
	if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });

	const conn = new Database(path);
	conn.pragma('journal_mode = WAL');
	conn.pragma('foreign_keys = ON');
	conn.exec(SCHEMA);

	const { user_version } = conn.prepare('PRAGMA user_version').get() as { user_version: number };
	if (user_version === 0) {
		fixAppointmentTimes(conn);
		conn.pragma('user_version = 1');
	}

	const { count } = conn.prepare('SELECT COUNT(*) AS count FROM doctors').get() as { count: number };
	if (count === 0 || process.env.CLINICQ_RESEED === '1') {
		seedDemoData(conn);
	}

	db = conn;
	return conn;
}

/** Instant as stored in the database (ISO 8601, UTC). */
export function stamp(date: Date = new Date()): string {
	return date.toISOString();
}
