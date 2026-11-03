import { listForDay } from '$lib/server/appointments';
import { listTickets } from '$lib/server/queue';
import { getRoster } from '$lib/server/roster';
import { clinicToday } from '$lib/time';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	const today = clinicToday();
	const tickets = listTickets(today);
	const now = new Date().toISOString();
	const upcoming = listForDay(today)
		.filter((a) => a.status === 'booked' && a.startsAt >= now)
		.sort((a, b) => a.startsAt.localeCompare(b.startsAt))
		.slice(0, 6);

	return {
		today,
		roster: getRoster(),
		upcoming,
		counts: {
			waiting: tickets.filter((t) => t.status === 'waiting').length,
			serving: tickets.filter((t) => t.status === 'serving').length,
			seen: tickets.filter((t) => t.status === 'done').length
		}
	};
};
