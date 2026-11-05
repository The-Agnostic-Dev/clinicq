import type Database from 'better-sqlite3';
import { clinicInstant } from '$lib/time';

export function fixAppointmentTimes(db: Database.Database, offsetMinutes?: number): void {
	const rows = db.prepare('SELECT id, starts_at, ends_at FROM appointments').all() as Array<{
		id: number;
		starts_at: string;
		ends_at: string;
	}>;

	const update = db.prepare('UPDATE appointments SET starts_at = ?, ends_at = ? WHERE id = ?');

	const run = db.transaction(() => {
		for (const row of rows) {
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
