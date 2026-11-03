import { dailySummary } from '$lib/server/summary';
import { clinicToday, isValidDay } from '$lib/time';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ url }) => {
	const today = clinicToday();
	const requested = url.searchParams.get('date') ?? '';
	const day = isValidDay(requested) ? requested : today;
	return { today, summary: dailySummary(day) };
};
