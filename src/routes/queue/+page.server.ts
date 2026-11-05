import { fail } from '@sveltejs/kit';
import { int, readPatient } from '$lib/server/forms';
import { callNext, finishTicket, issueTicket, listTickets, markNoShow } from '$lib/server/queue';
import { onDutyDoctors } from '$lib/server/roster';
import { clinicToday, addDays } from '$lib/time';
import type { Actions, PageServerLoad } from '@sveltejs/kit';

export const load: PageServerLoad = () => {
	const today = clinicToday();
	const yesterday = addDays(today, -1);
	return {
		today,
		tickets: listTickets(today),
		yesterdayTickets: listTickets(yesterday),
		doctors: onDutyDoctors()
	};
};

export const actions: Actions = {
	issue: async ({ request }) => {
		const form = await request.formData();
		const patient = readPatient(form);
		if (!patient.ok) return fail(400, { error: patient.error });
		const ticket = issueTicket(patient.value);
		return { issued: { code: ticket.code, patientName: ticket.patientName, estWaitMinutes: ticket.estWaitMinutes } };
	},

	call: async ({ request }) => {
		const result = callNext(int(await request.formData(), 'doctorId'));
		if (!result.ok) return fail(409, { error: result.error });
		return { called: { code: result.ticket.code, patientName: result.ticket.patientName, doctorName: result.ticket.doctorName } };
	},

	finish: async ({ request }) => {
		const result = finishTicket(int(await request.formData(), 'id'));
		if (!result.ok) return fail(409, { error: result.error });
		return {};
	},

	noShow: async ({ request }) => {
		const result = markNoShow(int(await request.formData(), 'id'));
		if (!result.ok) return fail(409, { error: result.error });
		return {};
	}
};
