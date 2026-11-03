import { describe, expect, it } from 'vitest';
import { clinicToday } from '$lib/time';
import { dailySummary } from './summary';

describe('daily summary', () => {
	it('counts the seeded day', () => {
		const s = dailySummary(clinicToday());
		expect(s.walkIns).toMatchObject({ issued: 9, seen: 3, noShow: 1, stillWaiting: 5 });
		expect(s.appointments).toMatchObject({ booked: 11, attended: 4, missed: 1, cancelled: 0 });
	});

	it('adds up fees for patients seen at each doctor\'s fee', () => {
		const s = dailySummary(clinicToday());
		const okonkwo = s.doctors.find((d) => d.doctorId === 1)!;
		expect(okonkwo.walkIns + okonkwo.appointments).toBe(3);
		expect(okonkwo.feesKobo).toBe(3 * 1_500_000);
		expect(s.feesKobo).toBe(s.doctors.reduce((sum, d) => sum + d.feesKobo, 0));
	});
});
