import { error, fail, redirect } from '@sveltejs/kit';
import { cancelAppointment, getAppointment, rescheduleAppointment } from '$lib/server/appointments';
import { listDoctors } from '$lib/server/doctors';
import { int, readSlot } from '$lib/server/forms';
import { clinicDayOf, clinicToday, formatTime } from '$lib/time';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params }) => {
	const appointment = getAppointment(Number(params.id));
	if (!appointment) error(404, 'Appointment not found');
	return {
		appointment,
		day: clinicDayOf(appointment.startsAt),
		time: formatTime(appointment.startsAt),
		today: clinicToday(),
		doctors: listDoctors()
	};
};

export const actions: Actions = {
	reschedule: async ({ request, params }) => {
		const form = await request.formData();
		const slot = readSlot(form);
		if (!slot.ok) return fail(400, { error: slot.error });
		const result = rescheduleAppointment(Number(params.id), int(form, 'doctorId'), slot.value.startsAt);
		if (!result.ok) return fail(409, { error: result.error });
		redirect(303, `/appointments?date=${slot.value.day}`);
	},

	cancel: async ({ params }) => {
		const appointment = getAppointment(Number(params.id));
		const result = cancelAppointment(Number(params.id));
		if (!result.ok) return fail(409, { error: result.error });
		redirect(303, `/appointments?date=${appointment ? clinicDayOf(appointment.startsAt) : clinicToday()}`);
	}
};
