import { fail, redirect } from '@sveltejs/kit';
import { authenticate, createSession, SESSION_COOKIE } from '$lib/server/auth';
import { text } from '$lib/server/forms';
import type { Actions, PageServerLoad } from './$types';

function safeNext(value: string | null): string {
	return value && value.startsWith('/') && !value.startsWith('//') ? value : '/';
}

export const load: PageServerLoad = ({ locals, url }) => {
	if (locals.user) redirect(303, safeNext(url.searchParams.get('next')));
};

export const actions: Actions = {
	default: async ({ request, cookies, url }) => {
		const form = await request.formData();
		const username = text(form, 'username');
		const user = authenticate(username, text(form, 'password'));
		if (!user) return fail(400, { username, error: 'Wrong username or password.' });

		const session = createSession(user.username);
		cookies.set(SESSION_COOKIE, session.token, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: url.protocol === 'https:',
			expires: session.expires
		});
		redirect(303, safeNext(url.searchParams.get('next')));
	}
};
