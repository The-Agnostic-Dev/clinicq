import { fail } from '@sveltejs/kit';
import { bookAppointment } from '$lib/server/appointments';
import { listDoctors } from '$lib/server/doctors';
import { int, readPatient, readSlot } from '$lib/server/forms';
import { clinicToday, isValidDay } from '$lib/time';
import { CLOSING_TIME, OPENING_TIME } from '$lib/types';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ url }) => {
	const today = clinicToday();
	const requested = url.searchParams.get('date') ?? '';
	return {
		today,
		day: isValidDay(requested) && requested >= today ? requested : today,
		doctorId: Number(url.searchParams.get('doctor')) || null,
		doctors: listDoctors(),
		opening: OPENING_TIME,
		closing: CLOSING_TIME
	};
};

export const actions: Actions = {
	default: async ({ request }) => {
		const form = await request.formData();
		const values = {
			doctorId: int(form, 'doctorId'),
			patientName: String(form.get('patientName') ?? ''),
			phone: String(form.get('phone') ?? ''),
			reason: String(form.get('reason') ?? ''),
			date: String(form.get('date') ?? ''),
			time: String(form.get('time') ?? '')
		};

		const patient = readPatient(form);
		if (!patient.ok) return fail(400, { values, error: patient.error });
		const slot = readSlot(form);
		if (!slot.ok) return fail(400, { values, error: slot.error });

		const result = bookAppointment({ ...patient.value, doctorId: values.doctorId, startsAt: slot.value.startsAt });
		if (!result.ok) return fail(409, { values, error: result.error });

		return { booked: { id: result.appointment.id, day: slot.value.day } };
	}
};
