import { isValidPhone, normalisePhone } from '$lib/phone';
import { isValidDay, isValidTime } from '$lib/time';

export function text(form: FormData, name: string): string {
	const value = form.get(name);
	return typeof value === 'string' ? value.trim() : '';
}

export function int(form: FormData, name: string): number {
	const value = Number.parseInt(text(form, name), 10);
	return Number.isFinite(value) ? value : 0;
}

export interface PatientFields {
	patientName: string;
	phone: string;
	reason: string;
}

export type Parsed<T> = { ok: true; value: T } | { ok: false; error: string };

export function readPatient(form: FormData): Parsed<PatientFields> {
	const patientName = text(form, 'patientName').replace(/\s+/g, ' ');
	const phone = text(form, 'phone');
	const reason = text(form, 'reason');
	if (patientName.length < 2) return { ok: false, error: "Enter the patient's name." };
	if (!isValidPhone(phone)) return { ok: false, error: 'Enter a Nigerian mobile number, e.g. 0803 123 4567.' };
	if (reason.length > 200) return { ok: false, error: 'Keep the reason under 200 characters.' };
	return { ok: true, value: { patientName, phone: normalisePhone(phone), reason } };
}

/** The date and time picked on a booking form. */
export function readSlot(form: FormData): Parsed<{ day: string; time: string; startsAt: Date }> {
	const day = text(form, 'date');
	const time = text(form, 'time');
	if (!isValidDay(day) || !isValidTime(time)) return { ok: false, error: 'Choose a date and a time.' };
	return { ok: true, value: { day, time, startsAt: new Date(`${day}T${time}:00`) } };
}
