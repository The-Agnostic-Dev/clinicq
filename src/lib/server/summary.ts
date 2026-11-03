import { addDays, clinicInstant, minutesBetween } from '$lib/time';
import { getDb } from './db';
import { listDoctors } from './doctors';

export interface DoctorLine {
	doctorId: number;
	name: string;
	walkIns: number;
	appointments: number;
	feesKobo: number;
}

export interface DailySummary {
	day: string;
	walkIns: { issued: number; seen: number; noShow: number; stillWaiting: number; averageWait: number | null };
	appointments: { booked: number; attended: number; missed: number; cancelled: number };
	doctors: DoctorLine[];
	feesKobo: number;
}

export function dailySummary(day: string): DailySummary {
	const db = getDb();
	const tickets = db
		.prepare('SELECT status, doctor_id, issued_at, called_at FROM tickets WHERE day = ?')
		.all(day) as { status: string; doctor_id: number | null; issued_at: string; called_at: string | null }[];

	const from = clinicInstant(day, '00:00').toISOString();
	const to = clinicInstant(addDays(day, 1), '00:00').toISOString();
	const appointments = db
		.prepare('SELECT status, doctor_id FROM appointments WHERE starts_at >= ? AND starts_at < ?')
		.all(from, to) as { status: string; doctor_id: number }[];

	const waits = tickets.filter((t) => t.called_at).map((t) => minutesBetween(t.issued_at, t.called_at!));
	const averageWait = waits.length ? Math.round(waits.reduce((a, b) => a + b, 0) / waits.length) : null;

	const doctors: DoctorLine[] = listDoctors().map((d) => {
		const walkIns = tickets.filter((t) => t.doctor_id === d.id && t.status === 'done').length;
		const attended = appointments.filter(
			(a) => a.doctor_id === d.id && (a.status === 'done' || a.status === 'checked_in')
		).length;
		return { doctorId: d.id, name: d.name, walkIns, appointments: attended, feesKobo: (walkIns + attended) * d.feeKobo };
	});

	const count = <T extends { status: string }>(rows: T[], ...statuses: string[]) =>
		rows.filter((r) => statuses.includes(r.status)).length;

	return {
		day,
		walkIns: {
			issued: tickets.length,
			seen: count(tickets, 'done'),
			noShow: count(tickets, 'no_show'),
			stillWaiting: count(tickets, 'waiting', 'serving'),
			averageWait
		},
		appointments: {
			booked: appointments.length - count(appointments, 'cancelled'),
			attended: count(appointments, 'done', 'checked_in'),
			missed: count(appointments, 'no_show'),
			cancelled: count(appointments, 'cancelled')
		},
		doctors,
		feesKobo: doctors.reduce((sum, d) => sum + d.feesKobo, 0)
	};
}
