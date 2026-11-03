import { beforeEach, describe, expect, it } from 'vitest';
import { addDays, clinicInstant, clinicToday, formatTime } from '$lib/time';
import { bookAppointment, cancelAppointment, checkIn, getAppointment, undoCheckIn } from './appointments';
import { getDb } from './db';
import { seedDemoData } from './seed';

const patient = { patientName: 'Amina Lawal', phone: '08030001111', reason: 'BP review' };

describe('appointments', () => {
	const day = addDays(clinicToday(), 10);
	beforeEach(() => seedDemoData(getDb()));

	it('books a slot as long as the doctor takes', () => {
		const result = bookAppointment({ ...patient, doctorId: 2, startsAt: clinicInstant(day, '10:00') });
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(formatTime(result.appointment.startsAt)).toBe('10:00');
		expect(formatTime(result.appointment.endsAt)).toBe('10:20');
		expect(result.appointment.status).toBe('booked');
	});

	it('refuses a slot that overlaps another booking', () => {
		bookAppointment({ ...patient, doctorId: 1, startsAt: clinicInstant(day, '10:00') });
		const clash = bookAppointment({ ...patient, patientName: 'Tayo Bello', doctorId: 1, startsAt: clinicInstant(day, '10:10') });
		expect(clash.ok).toBe(false);
		const other = bookAppointment({ ...patient, patientName: 'Tayo Bello', doctorId: 3, startsAt: clinicInstant(day, '10:10') });
		expect(other.ok).toBe(true);
	});

	it('frees the slot when an appointment is cancelled', () => {
		const first = bookAppointment({ ...patient, doctorId: 1, startsAt: clinicInstant(day, '11:00') });
		expect(first.ok).toBe(true);
		if (!first.ok) return;
		expect(cancelAppointment(first.appointment.id).ok).toBe(true);
		expect(bookAppointment({ ...patient, doctorId: 1, startsAt: clinicInstant(day, '11:00') }).ok).toBe(true);
	});

	it('respects breaks, opening hours and the past', () => {
		expect(bookAppointment({ ...patient, doctorId: 1, startsAt: clinicInstant(day, '13:15') }).ok).toBe(false);
		expect(bookAppointment({ ...patient, doctorId: 1, startsAt: clinicInstant(day, '07:30') }).ok).toBe(false);
		expect(bookAppointment({ ...patient, doctorId: 1, startsAt: clinicInstant(day, '15:50') }).ok).toBe(false);
		expect(bookAppointment({ ...patient, doctorId: 1, startsAt: clinicInstant(addDays(clinicToday(), -1), '10:00') }).ok).toBe(false);
	});

	it('only checks patients in on the day', () => {
		const future = bookAppointment({ ...patient, doctorId: 3, startsAt: clinicInstant(day, '09:00') });
		expect(future.ok && checkIn(future.appointment.id).ok).toBe(false);

		const todays = getDb()
			.prepare(`SELECT id FROM appointments WHERE status = 'booked' AND patient_name = 'Chinwe Okafor'`)
			.get() as { id: number };
		expect(checkIn(todays.id).ok).toBe(true);
		expect(getAppointment(todays.id)?.status).toBe('checked_in');
		expect(undoCheckIn(todays.id).ok).toBe(true);
		expect(getAppointment(todays.id)?.status).toBe('booked');
	});
});
