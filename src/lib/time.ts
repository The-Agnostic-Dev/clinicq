/**
 * Date and time helpers. The clinic runs on Lagos time (WAT, UTC+1, no daylight saving),
 * whatever timezone the server or the browser happens to be in.
 */
export const CLINIC_TZ = 'Africa/Lagos';
export const CLINIC_UTC_OFFSET = '+01:00';

const dayFormatter = new Intl.DateTimeFormat('en-CA', {
	timeZone: CLINIC_TZ,
	year: 'numeric',
	month: '2-digit',
	day: '2-digit'
});

const timeFormatter = new Intl.DateTimeFormat('en-GB', {
	timeZone: CLINIC_TZ,
	hour: '2-digit',
	minute: '2-digit',
	hour12: false
});

const longDayFormatter = new Intl.DateTimeFormat('en-GB', {
	timeZone: CLINIC_TZ,
	weekday: 'long',
	day: 'numeric',
	month: 'long',
	year: 'numeric'
});

/** Calendar day (YYYY-MM-DD) in Lagos for an instant. */
export function clinicDayOf(instant: Date | string): string {
	return dayFormatter.format(new Date(instant));
}

/** Today's date in Lagos (YYYY-MM-DD). */
export function clinicToday(now: Date = new Date()): string {
	return clinicDayOf(now);
}

/** Shift a YYYY-MM-DD day by a number of days. */
export function addDays(day: string, days: number): string {
	const d = new Date(`${day}T12:00:00Z`);
	d.setUTCDate(d.getUTCDate() + days);
	return d.toISOString().slice(0, 10);
}

/** The instant of a Lagos wall-clock time on a given day, e.g. ('2026-03-02', '09:30'). */
export function clinicInstant(day: string, time: string): Date {
	return new Date(`${day}T${time}:00${CLINIC_UTC_OFFSET}`);
}

/** HH:MM on the Lagos clock. */
export function formatTime(instant: Date | string): string {
	return timeFormatter.format(new Date(instant));
}

/** "Tuesday, 3 March 2026" for a YYYY-MM-DD day. */
export function formatDay(day: string): string {
	return longDayFormatter.format(clinicInstant(day, '12:00'));
}

/** Minutes since midnight for "HH:MM". */
export function minutesOfDay(time: string): number {
	const [h, m] = time.split(':').map(Number);
	return h * 60 + m;
}

/** "HH:MM" for minutes since midnight. */
export function timeOfMinutes(total: number): string {
	const h = Math.floor(total / 60);
	const m = total % 60;
	return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function isValidDay(value: string): boolean {
	return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

export function isValidTime(value: string): boolean {
	return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

/** Whole minutes between two instants (b - a). */
export function minutesBetween(a: Date | string, b: Date | string): number {
	return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 60000);
}
