import { normalisePhone } from '$lib/phone';
import { getDb } from './db';

export interface PatientSummary {
	name: string;
	phone: string;
	visits: number;
	lastVisit: string;
	lastReason: string;
}

interface VisitRow {
	name: string;
	phone: string;
	at: string;
	reason: string;
}

/** Collapse whitespace so pasted names and numbers still match. */
function cleanQuery(raw: string): string {
	return raw.trim().replace(/\s+/g, ' ');
}

/**
 * Everyone who has come in, from walk-in tickets and appointments, grouped by name and
 * phone number. Most recent first.
 */
export function listPatients(): PatientSummary[] {
	const rows = getDb()
		.prepare(
			`SELECT patient_name AS name, phone, issued_at AS at, reason FROM tickets
			 UNION ALL
			 SELECT patient_name AS name, phone, starts_at AS at, reason FROM appointments WHERE status != 'cancelled'
			 ORDER BY at DESC`
		)
		.all() as VisitRow[];

	const byKey = new Map<string, PatientSummary>();
	for (const row of rows) {
		const key = `${row.name.toLowerCase()}|${row.phone}`;
		const existing = byKey.get(key);
		if (existing) {
			existing.visits += 1;
		} else {
			byKey.set(key, { name: row.name, phone: row.phone, visits: 1, lastVisit: row.at, lastReason: row.reason });
		}
	}
	return [...byKey.values()];
}

export function searchPatients(raw: string, limit = 50): PatientSummary[] {
	const query = cleanQuery(raw);
	const patients = listPatients();
	if (!query) return patients.slice(0, limit);

	const phoneQuery = normalisePhone(query);
	const isPhone = /^\d{3,}$/.test(phoneQuery);
	return patients
		.filter((p) => (isPhone ? p.phone.includes(phoneQuery) : p.name.toLowerCase().includes(query)))
		.slice(0, limit);
}
