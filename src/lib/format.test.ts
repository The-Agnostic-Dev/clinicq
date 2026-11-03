import { describe, expect, it } from 'vitest';
import { formatNaira, formatWait, plural } from './format';
import { estimateWaitMinutes } from './waits';

describe('formatting', () => {
	it('shows kobo amounts as naira', () => {
		expect(formatNaira(1_500_000)).toBe('₦15,000.00');
		expect(formatNaira(1_712_250)).toBe('₦17,122.50');
		expect(formatNaira(0)).toBe('₦0.00');
	});

	it('describes waits', () => {
		expect(formatWait(0)).toBe('Next');
		expect(formatWait(25)).toBe('about 25 min');
		expect(formatWait(60)).toBe('about 1 h');
		expect(formatWait(75)).toBe('about 1 h 15 min');
	});

	it('pluralises', () => {
		expect(plural(1, 'patient')).toBe('1 patient');
		expect(plural(3, 'patient')).toBe('3 patients');
	});
});

describe('wait estimate', () => {
	const doctors = [{ consultMinutes: 15 }, { consultMinutes: 20 }, { consultMinutes: 15 }];

	it('is zero for the first in line', () => {
		expect(estimateWaitMinutes(0, doctors)).toBe(0);
	});

	it('shares the people ahead between the doctors on duty', () => {
		expect(estimateWaitMinutes(3, doctors)).toBe(17);
		expect(estimateWaitMinutes(6, doctors)).toBe(33);
		expect(estimateWaitMinutes(2, [{ consultMinutes: 15 }])).toBe(30);
	});

	it('is zero when no doctor is on duty', () => {
		expect(estimateWaitMinutes(4, [])).toBe(0);
	});
});
