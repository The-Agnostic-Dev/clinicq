import { searchPatients } from '$lib/server/patients';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ url }) => {
	const q = url.searchParams.get('q') ?? '';
	return { q, patients: searchPatients(q) };
};
