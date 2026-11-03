import type { RosterEntry } from '$lib/types';
import { clinicToday } from '$lib/time';
import { isOffToday, listDoctors } from './doctors';

/**
 * Today's roster is read on every queue refresh and every booking, so it is kept in
 * memory for the day. Anything that changes a doctor must call invalidateRoster().
 */
let cached: { day: string; entries: RosterEntry[] } | null = null;

export function getRoster(): RosterEntry[] {
	const day = clinicToday();
	if (cached && cached.day === day) return cached.entries;
	const entries = listDoctors().map((d) => ({ ...d, onDuty: !isOffToday(d, day) }));
	cached = { day, entries };
	return entries;
}

export function onDutyDoctors(): RosterEntry[] {
	return getRoster().filter((d) => d.onDuty);
}

export function invalidateRoster(): void {
	cached = null;
}
