import { redirect, type Handle } from '@sveltejs/kit';
import { SESSION_COOKIE, userForSession } from '$lib/server/auth';

const PUBLIC_PATHS = ['/login', '/healthz'];

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.user = userForSession(event.cookies.get(SESSION_COOKIE));

	const isPublic = PUBLIC_PATHS.some((p) => event.url.pathname.startsWith(p));
	if (!event.locals.user && !isPublic) {
		const next = event.url.pathname + event.url.search;
		redirect(303, `/login?next=${encodeURIComponent(next)}`);
	}

	return resolve(event);
};
