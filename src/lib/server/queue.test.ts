import { beforeEach, describe, expect, it } from 'vitest';
import { clinicToday } from '$lib/time';
import { actions } from '../../routes/doctors/+page.server';
import { authenticate } from './auth';
import { getDb } from './db';
import { setOffToday } from './doctors';
import { callNext, finishTicket, issueTicket, listTickets, markNoShow } from './queue';
import { getRoster, invalidateRoster, onDutyDoctors } from './roster';
import { DEMO_PASSWORD, seedDemoData } from './seed';

describe('walk-in queue', () => {
	beforeEach(() => seedDemoData(getDb()));

	it('numbers tickets for the day in order', () => {
		const before = listTickets().length;
		const first = issueTicket({ patientName: 'Ada Obi', phone: '08030000001', reason: 'Cough' });
		const second = issueTicket({ patientName: 'Bayo Ade', phone: '08030000002', reason: '' });
		expect(first.number).toBe(before + 1);
		expect(second.number).toBe(before + 2);
		expect(second.code).toBe(`A${before + 2}`);
		expect(first.day).toBe(clinicToday());
		expect(first.status).toBe('waiting');
	});

	it('continues numbering from the highest number already issued, not per day', () => {
		const yesterday = clinicToday(new Date(Date.now() - 24 * 60 * 60 * 1000));
		getDb()
			.prepare(
				`INSERT INTO tickets (day, number, patient_name, phone, reason, status, issued_at)
				 VALUES (?, ?, ?, ?, ?, 'done', ?)`
			)
			.run(yesterday, 500, 'Yesterday Patient', '08030000009', 'Old visit', new Date().toISOString());
		const ticket = issueTicket({ patientName: 'Ada Obi', phone: '08030000001', reason: 'Cough' });
		expect(ticket.number).toBe(501);
		expect(ticket.code).toBe('A501');
	});

	it('gives a new ticket an estimate based on the people already waiting', () => {
		const waiting = listTickets().filter((t) => t.status === 'waiting').length;
		const ticket = issueTicket({ patientName: 'Chidi Eke', phone: '08030000003', reason: '' });
		expect(waiting).toBeGreaterThan(0);
		expect(ticket.estWaitMinutes).toBeGreaterThan(0);
	});

	it('calls the longest-waiting patient to a free doctor', () => {
		const result = callNext(2);
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.ticket.code).toBe('A7');
			expect(result.ticket.status).toBe('serving');
			expect(result.ticket.doctorName).toBe('Dr Tunde Bakare');
		}
	});

	it('will not call a patient to a doctor who is off today', () => {
		setOffToday(2, true);
		invalidateRoster();
		try {
			expect(onDutyDoctors().map((d) => d.id)).not.toContain(2);
			const result = callNext(2);
			expect(result.ok).toBe(false);
			if (!result.ok) expect(result.error).toContain('Dr Tunde Bakare');
		} finally {
			setOffToday(2, false);
			invalidateRoster();
		}
	});

	it('clears the front-desk roster when a doctor is toggled off from the doctors page', async () => {
		expect(onDutyDoctors().map((d) => d.id)).toContain(2);
		const user = authenticate('ifeoma', DEMO_PASSWORD)!;
		const form = new FormData();
		form.set('id', '2');
		form.set('off', '1');
		const request = new Request('http://localhost/doctors', { method: 'POST', body: form });
		try {
			const result = await actions.toggleDuty({ request, locals: { user } } as never);
			expect(result).toMatchObject({ message: 'Dr Tunde Bakare is marked as not in today.' });
			expect(getRoster().find((d) => d.id === 2)?.onDuty).toBe(false);
			expect(onDutyDoctors().map((d) => d.id)).not.toContain(2);
		} finally {
			setOffToday(2, false);
			invalidateRoster();
		}
	});

	it('will not call a new patient while the doctor is still with one', () => {
		const result = callNext(1);
		expect(result.ok).toBe(false);
	});

	it('finishes and marks no-shows', () => {
		const serving = listTickets().find((t) => t.status === 'serving')!;
		expect(finishTicket(serving.id).ok).toBe(true);
		expect(finishTicket(serving.id).ok).toBe(false);

		const waiting = listTickets().find((t) => t.status === 'waiting')!;
		const result = markNoShow(waiting.id);
		expect(result.ok && result.ticket.status).toBe('no_show');
	});
});
