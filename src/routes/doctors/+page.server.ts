import { error, fail } from '@sveltejs/kit';
import { canManageDoctors } from '$lib/server/auth';
import { getDoctor, isOffToday, listDoctors, setOffToday, updateSchedule } from '$lib/server/doctors';
import { int, text } from '$lib/server/forms';
import { invalidateRoster } from '$lib/server/roster';
import { isValidTime, minutesOfDay } from '$lib/time';

export const load = ({ locals }) => {
	return {
		canEdit: canManageDoctors(locals.user),
		doctors: listDoctors().map((d) => ({ ...d, onDuty: !isOffToday(d) }))
	};
};

function requireManager(user: Parameters<typeof canManageDoctors>[0]) {
	if (!canManageDoctors(user)) error(403, 'Only the clinic manager can change doctor schedules.');
}

/** "15,000" or "15000.50" naira -> kobo */
function parseFee(raw: string): number | null {
	const value = Number(raw.replace(/[₦,\s]/g, ''));
	return Number.isFinite(value) && value > 0 ? Math.round(value * 100) : null;
}

export const actions = {
	toggleDuty: async ({ request, locals }) => {
		requireManager(locals.user);
		const form = await request.formData();
		const doctor = getDoctor(int(form, 'id'));
		if (!doctor) return fail(404, { error: 'Doctor not found.' });
		const off = text(form, 'off') === '1';
		setOffToday(doctor.id, off);
		invalidateRoster();
		return { message: off ? `${doctor.name} is marked as not in today.` : `${doctor.name} is back on duty today.` };
	},

	saveSchedule: async ({ request, locals }) => {
		requireManager(locals.user);
		const form = await request.formData();
		const doctor = getDoctor(int(form, 'id'));
		if (!doctor) return fail(404, { error: 'Doctor not found.' });

		const consultMinutes = int(form, 'consultMinutes');
		const breakStart = text(form, 'breakStart');
		const breakEnd = text(form, 'breakEnd');
		const feeKobo = parseFee(text(form, 'fee'));

		if (consultMinutes < 5 || consultMinutes > 60) return fail(400, { error: 'Consultation time must be between 5 and 60 minutes.' });
		if (!isValidTime(breakStart) || !isValidTime(breakEnd) || minutesOfDay(breakEnd) <= minutesOfDay(breakStart)) {
			return fail(400, { error: 'The break must end after it starts.' });
		}
		if (feeKobo === null) return fail(400, { error: 'Enter the consultation fee in naira.' });

		updateSchedule(doctor.id, { consultMinutes, breakStart, breakEnd, feeKobo });
		invalidateRoster();
		return { message: `Saved ${doctor.name}'s schedule.` };
	}
};
