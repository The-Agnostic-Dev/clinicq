import { describe, expect, it } from 'vitest';
import { formatPhone, isValidPhone, normalisePhone } from './phone';

describe('phone numbers', () => {
	it('normalises the usual ways people write a number', () => {
		expect(normalisePhone('0803 123 4567')).toBe('08031234567');
		expect(normalisePhone('+234 803 123 4567')).toBe('08031234567');
		expect(normalisePhone('2348031234567')).toBe('08031234567');
		expect(normalisePhone('0803-123-4567')).toBe('08031234567');
	});

	it('accepts Nigerian mobile numbers only', () => {
		expect(isValidPhone('08031234567')).toBe(true);
		expect(isValidPhone('+2349061234567')).toBe(true);
		expect(isValidPhone('0803123456')).toBe(false);
		expect(isValidPhone('01234567890')).toBe(false);
	});

	it('formats for display', () => {
		expect(formatPhone('08031234567')).toBe('0803 123 4567');
	});
});
