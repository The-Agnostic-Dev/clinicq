import { describe, expect, it } from 'vitest';
import { addDays, clinicDayOf, clinicInstant, formatTime, isValidTime, minutesOfDay, timeOfMinutes } from './time';

describe('clinic time', () => {
	it('builds instants on the Lagos clock', () => {
		expect(clinicInstant('2026-03-02', '09:30').toISOString()).toBe('2026-03-02T08:30:00.000Z');
	});

	it('formats instants on the Lagos clock', () => {
		expect(formatTime('2026-03-02T08:30:00.000Z')).toBe('09:30');
		expect(formatTime(clinicInstant('2026-07-15', '15:45'))).toBe('15:45');
	});

	it('works out the Lagos day for late-evening UTC instants', () => {
		expect(clinicDayOf('2026-03-01T23:30:00.000Z')).toBe('2026-03-02');
		expect(clinicDayOf('2026-03-01T22:30:00.000Z')).toBe('2026-03-01');
	});

	it('adds days across month and year ends', () => {
		expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
		expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
		expect(addDays('2028-03-01', -1)).toBe('2028-02-29');
	});

	it('converts between HH:MM and minutes', () => {
		expect(minutesOfDay('13:30')).toBe(810);
		expect(timeOfMinutes(810)).toBe('13:30');
		expect(isValidTime('9:30')).toBe(false);
		expect(isValidTime('09:30')).toBe(true);
	});
});
