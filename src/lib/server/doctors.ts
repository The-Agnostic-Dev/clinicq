import type { Doctor } from '$lib/types';
import { clinicToday } from '$lib/time';
import { getDb } from './db';

interface DoctorRow {
	id: number;
	name: string;
	specialty: string;
	room: string;
	consult_minutes: number;
	fee_kobo: number;
	break_start: string;
	break_end: string;
	off_day: string | null;
}

function toDoctor(row: DoctorRow): Doctor {
	return {
		id: row.id,
		name: row.name,
		specialty: row.specialty,
		room: row.room,
		consultMinutes: row.consult_minutes,
		feeKobo: row.fee_kobo,
		breakStart: row.break_start,
		breakEnd: row.break_end,
		offDay: row.off_day
	};
}

export function listDoctors(): Doctor[] {
	const rows = getDb().prepare('SELECT * FROM doctors ORDER BY id').all() as DoctorRow[];
	return rows.map(toDoctor);
}

export function getDoctor(id: number): Doctor | null {
	const row = getDb().prepare('SELECT * FROM doctors WHERE id = ?').get(id) as DoctorRow | undefined;
	return row ? toDoctor(row) : null;
}

export function isOffToday(doctor: Doctor, today = clinicToday()): boolean {
	return doctor.offDay === today;
}

/** Mark a doctor as not in today, or back in. Resets by itself the next day. */
export function setOffToday(id: number, off: boolean): void {
	getDb()
		.prepare('UPDATE doctors SET off_day = ? WHERE id = ?')
		.run(off ? clinicToday() : null, id);
}

export interface ScheduleInput {
	consultMinutes: number;
	breakStart: string;
	breakEnd: string;
	feeKobo: number;
}

export function updateSchedule(id: number, input: ScheduleInput): void {
	getDb()
		.prepare(
			`UPDATE doctors SET consult_minutes = ?, break_start = ?, break_end = ?, fee_kobo = ?
			 WHERE id = ?`
		)
		.run(input.consultMinutes, input.breakStart, input.breakEnd, input.feeKobo, id);
}
