import { fail } from '@sveltejs/kit';
import { checkIn, listForDay, markMissed, markSeen, undoCheckIn, type BookingResult } from '$lib/server/appointments';
import { listDoctors } from '$lib/server/doctors';
import { int } from '$lib/server/forms';
import { clinicToday, isValidDay } from '$lib/time';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ url }) => {
	const today = clinicToday();
	const requested = url.searchParams.get('date') ?? '';
	const day = isValidDay(requested) ? requested : today;
	const doctorId = Number(url.searchParams.get('doctor')) || undefined;

	return {
		today,
		day,
		doctorId: doctorId ?? null,
		doctors: listDoctors(),
		appointments: listForDay(day, doctorId)
	};
};

function respond(result: BookingResult, message: string) {
	if (!result.ok) return fail(409, { error: result.error });
	return { message: `${result.appointment.patientName}: ${message}` };
}

export const actions: Actions = {
	checkIn: async ({ request }) => respond(checkIn(int(await request.formData(), 'id')), 'checked in.'),
	undoCheckIn: async ({ request }) => respond(undoCheckIn(int(await request.formData(), 'id')), 'check-in undone.'),
	seen: async ({ request }) => respond(markSeen(int(await request.formData(), 'id')), 'marked as seen.'),
	missed: async ({ request }) => respond(markMissed(int(await request.formData(), 'id')), 'marked as missed.')
};
