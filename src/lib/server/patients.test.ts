import { describe, expect, it } from 'vitest';
import { searchPatients } from './patients';

describe('patient search', () => {
	it('groups visits by patient', () => {
		const chioma = searchPatients('chioma').find((p) => p.name === 'Chioma Okeke');
		expect(chioma?.visits).toBe(3);
	});

	it('finds patients by phone number however it is typed', () => {
		expect(searchPatients('0803 555 0142').map((p) => p.name)).toContain('Chioma Okeke');
		expect(searchPatients('+234 803 555 0142').map((p) => p.name)).toContain('Chioma Okeke');
		expect(searchPatients('5550142').map((p) => p.name)).toContain('Chioma Okeke');
	});

	it('lists recent patients when the search is empty', () => {
		expect(searchPatients('').length).toBeGreaterThan(10);
	});
});
