import type { Ticket, TicketStatus } from '$lib/types';
import { clinicToday, addDays } from '$lib/time';
import { estimateWaitMinutes } from '$lib/waits';
import { getDb, stamp } from './db';
import { onDutyDoctors } from './roster';

export const TICKET_PREFIX = 'A';

interface TicketRow {
	id: number;
	day: string;
	number: number;
	patient_name: string;
	phone: string;
	reason: string;
	status: TicketStatus;
	doctor_id: number | null;
	doctor_name: string | null;
	issued_at: string;
	called_at: string | null;
	finished_at: string | null;
	est_wait_minutes: number;
}

const SELECT_TICKETS = `
	SELECT t.*, d.name AS doctor_name
	FROM tickets t LEFT JOIN doctors d ON d.id = t.doctor_id`;

export function ticketCode(number: number): string {
	return `${TICKET_PREFIX}${number}`;
}

function toTicket(row: TicketRow): Ticket {
	return {
		id: row.id,
		day: row.day,
		number: row.number,
		code: ticketCode(row.number),
		patientName: row.patient_name,
		phone: row.phone,
		reason: row.reason,
		status: row.status,
		doctorId: row.doctor_id,
		doctorName: row.doctor_name,
		issuedAt: row.issued_at,
		calledAt: row.called_at,
		finishedAt: row.finished_at,
		estWaitMinutes: row.est_wait_minutes
	};
}

/** Every ticket issued on a day, in the order they were issued. */
export function listTickets(day = clinicToday()): Ticket[] {
	const rows = getDb()
		.prepare(`${SELECT_TICKETS} WHERE t.day = ? ORDER BY t.number`)
		.all(day) as TicketRow[];
	return rows.map(toTicket);
}

export function getTicket(id: number): Ticket | null {
	const row = getDb().prepare(`${SELECT_TICKETS} WHERE t.id = ?`).get(id) as TicketRow | undefined;
	return row ? toTicket(row) : null;
}

export interface NewTicket {
	patientName: string;
	phone: string;
	reason: string;
}

export function issueTicket(input: NewTicket, now = new Date()): Ticket {
	const db = getDb();
	const day = clinicToday(now);

	const issue = db.transaction(() => {
		const yesterday = addDays(day, -1);
		const { last } = db
			.prepare('SELECT COALESCE(MAX(number), 0) AS last FROM tickets WHERE day IN (?, ?)')
			.get(day, yesterday) as { last: number };
		const { ahead } = db
			.prepare(`SELECT COUNT(*) AS ahead FROM tickets WHERE day = ? AND status = 'waiting'`)
			.get(day) as { ahead: number };
		const estimate = estimateWaitMinutes(ahead, onDutyDoctors());

		const result = db
			.prepare(
				`INSERT INTO tickets (day, number, patient_name, phone, reason, status, issued_at, est_wait_minutes)
				 VALUES (?, ?, ?, ?, ?, 'waiting', ?, ?)`
			)
			.run(day, last + 1, input.patientName, input.phone, input.reason, stamp(now), estimate);
		return Number(result.lastInsertRowid);
	});

	return getTicket(issue())!;
}

export type QueueResult = { ok: true; ticket: Ticket } | { ok: false; error: string };

/** Call the longest-waiting patient to a doctor's room. */
export function callNext(doctorId: number, day = clinicToday()): QueueResult {
	const db = getDb();
	const busy = db
		.prepare(`SELECT number FROM tickets WHERE day = ? AND doctor_id = ? AND status = 'serving'`)
		.get(day, doctorId) as { number: number } | undefined;
	if (busy) {
		return { ok: false, error: `Finish with ${ticketCode(busy.number)} before calling the next patient.` };
	}

	const next = db
		.prepare(`SELECT id FROM tickets WHERE day = ? AND status = 'waiting' ORDER BY number LIMIT 1`)
		.get(day) as { id: number } | undefined;
	if (!next) return { ok: false, error: 'Nobody is waiting.' };

	db.prepare(`UPDATE tickets SET status = 'serving', doctor_id = ?, called_at = ? WHERE id = ?`).run(
		doctorId,
		stamp(),
		next.id
	);
	return { ok: true, ticket: getTicket(next.id)! };
}

export function finishTicket(id: number): QueueResult {
	const ticket = getTicket(id);
	if (!ticket || ticket.status !== 'serving') return { ok: false, error: 'That patient is not being seen.' };
	getDb().prepare(`UPDATE tickets SET status = 'done', finished_at = ? WHERE id = ?`).run(stamp(), id);
	return { ok: true, ticket: getTicket(id)! };
}

export function markNoShow(id: number): QueueResult {
	const ticket = getTicket(id);
	if (!ticket || (ticket.status !== 'waiting' && ticket.status !== 'serving')) {
		return { ok: false, error: 'Only waiting or called patients can be marked as not here.' };
	}
	getDb().prepare(`UPDATE tickets SET status = 'no_show', finished_at = ? WHERE id = ?`).run(stamp(), id);
	return { ok: true, ticket: getTicket(id)! };
}
