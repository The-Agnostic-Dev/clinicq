import { redirect } from '@sveltejs/kit';
import { endSession, SESSION_COOKIE } from '$lib/server/auth';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	redirect(303, '/');
};

export const actions: Actions = {
	default: ({ cookies }) => {
		endSession(cookies.get(SESSION_COOKIE));
		cookies.delete(SESSION_COOKIE, { path: '/' });
		redirect(303, '/login');
	}
};
