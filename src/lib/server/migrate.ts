import type Database from 'better-sqlite3';
import { clinicInstant } from '$lib/time';

/**
 * Rewrites appointments whose starts_at was stored by the old buggy booking
 * form (which used the server's local timezone) to use clinic time.
 *
 * Seed rows written by seedDemoData are already in clinic time and all share
 * a single created_at value, so they are skipped. Booking-form rows get a
 * unique created_at and are rewritten. Trade-off: two genuine user bookings
 * created in the same millisecond would also be skipped, and historical rows
 * on reseeded deployments stay exactly as the seed wrote them.
 */
export function fixAppointmentTimes(db: Database.Database, offsetMinutes?: number): void {
	const rows = db.prepare('SELECT id, starts_at, ends_at, created_at FROM appointments').all() as Array<{
		id: number;
		starts_at: string;
		ends_at: string;
		created_at: string;
	}>;

	const shared = new Set(
		(db.prepare('SELECT created_at FROM appointments GROUP BY created_at HAVING COUNT(*) > 1').all() as Array<{
			created_at: string;
		}>).map((row) => row.created_at)
	);

	const update = db.prepare('UPDATE appointments SET starts_at = ?, ends_at = ? WHERE id = ?');

	const run = db.transaction(() => {
		for (const row of rows) {
			if (shared.has(row.created_at)) continue;
			const startsAt = new Date(row.starts_at);
			const endsAt = new Date(row.ends_at);
			const offset = offsetMinutes ?? startsAt.getTimezoneOffset();
			const localMs = startsAt.getTime() - offset * 60_000;
			const local = new Date(localMs);
			const day = `${local.getFullYear()}-${String(local.getMonth() + 1).padStart(2, '0')}-${String(local.getDate()).padStart(2, '0')}`;
			const time = `${String(local.getHours()).padStart(2, '0')}:${String(local.getMinutes()).padStart(2, '0')}`;
			const newStartsAt = clinicInstant(day, time);
			const duration = endsAt.getTime() - startsAt.getTime();
			const newEndsAt = new Date(newStartsAt.getTime() + duration);
			update.run(newStartsAt.toISOString(), newEndsAt.toISOString(), row.id);
		}
	});
	run();
}
