import { randomBytes } from 'node:crypto';
import type { Role, SessionUser } from '$lib/types';
import { getDb } from './db';
import { verifyPassword } from './password';

export const SESSION_COOKIE = 'clinicq_session';
const SESSION_HOURS = 12;

interface UserRow {
	username: string;
	name: string;
	role: Role;
	doctor_id: number | null;
	password_hash: string;
}

function toSessionUser(row: UserRow): SessionUser {
	return { username: row.username, name: row.name, role: row.role, doctorId: row.doctor_id };
}

export function authenticate(username: string, password: string): SessionUser | null {
	const row = getDb()
		.prepare('SELECT * FROM users WHERE username = ?')
		.get(username.trim().toLowerCase()) as UserRow | undefined;
	if (!row || !verifyPassword(password, row.password_hash)) return null;
	return toSessionUser(row);
}

export function createSession(username: string): { token: string; expires: Date } {
	const token = randomBytes(24).toString('base64url');
	const expires = new Date(Date.now() + SESSION_HOURS * 3600_000);
	getDb()
		.prepare('INSERT INTO sessions (token, username, expires_at) VALUES (?, ?, ?)')
		.run(token, username, expires.toISOString());
	return { token, expires };
}

export function userForSession(token: string | undefined): SessionUser | null {
	if (!token) return null;
	const row = getDb()
		.prepare(
			`SELECT u.* FROM sessions s JOIN users u ON u.username = s.username
			 WHERE s.token = ? AND s.expires_at > ?`
		)
		.get(token, new Date().toISOString()) as UserRow | undefined;
	return row ? toSessionUser(row) : null;
}

export function endSession(token: string | undefined): void {
	if (token) getDb().prepare('DELETE FROM sessions WHERE token = ?').run(token);
}

export function canManageDoctors(user: SessionUser | null): boolean {
	return user?.role === 'manager';
}
