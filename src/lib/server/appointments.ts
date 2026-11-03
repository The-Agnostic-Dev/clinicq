import type { Appointment, AppointmentStatus, Doctor } from '$lib/types';
import { CLOSING_TIME, OPENING_TIME } from '$lib/types';
import { addDays, clinicDayOf, clinicInstant, clinicToday, formatTime, minutesOfDay } from '$lib/time';
import { getDb, stamp } from './db';
import { getDoctor } from './doctors';

interface AppointmentRow {
	id: number;
	doctor_id: number;
	doctor_name: string;
	patient_name: string;
	phone: string;
	reason: string;
	starts_at: string;
	ends_at: string;
	status: AppointmentStatus;
	checked_in_at: string | null;
}

const SELECT_APPOINTMENTS = `
	SELECT a.*, d.name AS doctor_name
	FROM appointments a JOIN doctors d ON d.id = a.doctor_id`;

/** Statuses that hold a doctor's time. */
const ACTIVE = `('booked', 'checked_in', 'done')`;

function toAppointment(row: AppointmentRow): Appointment {
	return {
		id: row.id,
		doctorId: row.doctor_id,
		doctorName: row.doctor_name,
		patientName: row.patient_name,
		phone: row.phone,
		reason: row.reason,
		startsAt: row.starts_at,
		endsAt: row.ends_at,
		status: row.status,
		checkedInAt: row.checked_in_at
	};
}

export function listForDay(day: string, doctorId?: number): Appointment[] {
	const from = clinicInstant(day, '00:00').toISOString();
	const to = clinicInstant(addDays(day, 1), '00:00').toISOString();
	const params: (string | number)[] = [from, to];
	let where = 'a.starts_at >= ? AND a.starts_at < ?';
	if (doctorId) {
		where += ' AND a.doctor_id = ?';
		params.push(doctorId);
	}
	const rows = getDb()
		.prepare(`${SELECT_APPOINTMENTS} WHERE ${where} ORDER BY a.doctor_id, a.id`)
		.all(...params) as AppointmentRow[];
	return rows.map(toAppointment);
}

export function getAppointment(id: number): Appointment | null {
	const row = getDb().prepare(`${SELECT_APPOINTMENTS} WHERE a.id = ?`).get(id) as AppointmentRow | undefined;
	return row ? toAppointment(row) : null;
}

function endOf(start: Date, doctor: Doctor): Date {
	return new Date(start.getTime() + doctor.consultMinutes * 60_000);
}

/** Why a doctor cannot see someone at this time, or null if the slot is free. */
export function slotProblem(doctor: Doctor, start: Date, excludeId?: number, now = new Date()): string | null {
	if (Number.isNaN(start.getTime())) return 'Choose a valid date and time.';
	if (start.getTime() <= now.getTime()) return 'That time has already passed.';

	const end = endOf(start, doctor);
	const from = minutesOfDay(formatTime(start));
	const to = from + doctor.consultMinutes;
	if (from < minutesOfDay(OPENING_TIME) || to > minutesOfDay(CLOSING_TIME)) {
		return `The clinic sees appointments between ${OPENING_TIME} and ${CLOSING_TIME}.`;
	}
	if (from < minutesOfDay(doctor.breakEnd) && to > minutesOfDay(doctor.breakStart)) {
		return `${doctor.name} is on break from ${doctor.breakStart} to ${doctor.breakEnd}.`;
	}

	const clash = getDb()
		.prepare(
			`SELECT patient_name, starts_at FROM appointments
			 WHERE doctor_id = ? AND status IN ${ACTIVE} AND id != ?
			   AND starts_at < ? AND ends_at > ?`
		)
		.get(doctor.id, excludeId ?? 0, end.toISOString(), start.toISOString()) as
		| { patient_name: string; starts_at: string }
		| undefined;
	if (clash) {
		return `${doctor.name} already has ${clash.patient_name} at ${formatTime(clash.starts_at)} on that day.`;
	}
	return null;
}

export interface BookingInput {
	doctorId: number;
	patientName: string;
	phone: string;
	reason: string;
	startsAt: Date;
}

export type BookingResult = { ok: true; appointment: Appointment } | { ok: false; error: string };

export function bookAppointment(input: BookingInput): BookingResult {
	const doctor = getDoctor(input.doctorId);
	if (!doctor) return { ok: false, error: 'Choose a doctor.' };
	const problem = slotProblem(doctor, input.startsAt);
	if (problem) return { ok: false, error: problem };

	const result = getDb()
		.prepare(
			`INSERT INTO appointments (doctor_id, patient_name, phone, reason, starts_at, ends_at, status, created_at)
			 VALUES (?, ?, ?, ?, ?, ?, 'booked', ?)`
		)
		.run(
			doctor.id,
			input.patientName,
			input.phone,
			input.reason,
			input.startsAt.toISOString(),
			endOf(input.startsAt, doctor).toISOString(),
			stamp()
		);
	return { ok: true, appointment: getAppointment(Number(result.lastInsertRowid))! };
}

export function rescheduleAppointment(id: number, doctorId: number, startsAt: Date): BookingResult {
	const current = getAppointment(id);
	if (!current) return { ok: false, error: 'Appointment not found.' };
	if (current.status !== 'booked') return { ok: false, error: 'Only booked appointments can be moved.' };
	const doctor = getDoctor(doctorId);
	if (!doctor) return { ok: false, error: 'Choose a doctor.' };
	const problem = slotProblem(doctor, startsAt, id);
	if (problem) return { ok: false, error: problem };

	getDb()
		.prepare('UPDATE appointments SET doctor_id = ?, starts_at = ? WHERE id = ?')
		.run(doctor.id, startsAt.toISOString(), id);
	return { ok: true, appointment: getAppointment(id)! };
}

function setStatus(id: number, from: AppointmentStatus[], to: AppointmentStatus, checkedInAt: string | null): boolean {
	const placeholders = from.map(() => '?').join(', ');
	const result = getDb()
		.prepare(`UPDATE appointments SET status = ?, checked_in_at = ? WHERE id = ? AND status IN (${placeholders})`)
		.run(to, checkedInAt, id, ...from);
	return result.changes > 0;
}

/** Patients can only be checked in on the day of their appointment. */
export function checkIn(id: number): BookingResult {
	const appt = getAppointment(id);
	if (!appt) return { ok: false, error: 'Appointment not found.' };
	if (clinicDayOf(appt.startsAt) !== clinicToday()) {
		return { ok: false, error: 'Patients can only be checked in on the day of their appointment.' };
	}
	if (!setStatus(id, ['booked', 'no_show'], 'checked_in', stamp())) {
		return { ok: false, error: 'This appointment cannot be checked in.' };
	}
	return { ok: true, appointment: getAppointment(id)! };
}

export function undoCheckIn(id: number): BookingResult {
	if (!setStatus(id, ['checked_in'], 'booked', null)) return { ok: false, error: 'Nothing to undo.' };
	return { ok: true, appointment: getAppointment(id)! };
}

export function markSeen(id: number): BookingResult {
	const appt = getAppointment(id);
	if (!appt || !setStatus(id, ['checked_in'], 'done', appt.checkedInAt)) {
		return { ok: false, error: 'Check the patient in first.' };
	}
	return { ok: true, appointment: getAppointment(id)! };
}

export function markMissed(id: number): BookingResult {
	if (!setStatus(id, ['booked'], 'no_show', null)) return { ok: false, error: 'Only booked appointments can be marked missed.' };
	return { ok: true, appointment: getAppointment(id)! };
}

export function cancelAppointment(id: number): BookingResult {
	if (!setStatus(id, ['booked'], 'cancelled', null)) return { ok: false, error: 'Only booked appointments can be cancelled.' };
	return { ok: true, appointment: getAppointment(id)! };
}
