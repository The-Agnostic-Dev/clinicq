import { describe, it, expect, beforeEach } from 'vitest';
import { seedDemoData } from '$lib/server/seed';
import { getDb } from '$lib/server/db';
import { listTickets, issueTicket, markNoShow } from '$lib/server/queue';
import { waitingTickets } from '$lib/tickets';
import { addDays, clinicInstant, clinicToday } from '$lib/time';
import type { Ticket } from '$lib/types';

describe('waitingTickets', () => {
	beforeEach(() => {
		seedDemoData(getDb());
	});

	it('counts only the tickets shown in the Waiting list', () => {
		const tickets = listTickets(clinicToday());
		const waiting = waitingTickets(tickets);
		expect(waiting).toHaveLength(3);
		expect(waiting.map((t: Ticket) => t.number)).toEqual([7, 8, 9]);
	});

	it('returns an empty list after all waiting tickets are marked as no-shows', () => {
		const tickets = listTickets(clinicToday());
		const waiting = waitingTickets(tickets);
		for (const ticket of waiting) {
			markNoShow(ticket.id);
		}
		const updatedTickets = listTickets(clinicToday());
		const updatedWaiting = waitingTickets(updatedTickets);
		expect(updatedWaiting).toHaveLength(0);
	});
});

describe('listTickets across days', () => {
	beforeEach(() => {
		seedDemoData(getDb());
	});

	it("returns yesterday's tickets separately from today's and continues numbering from them", () => {
		const today = clinicToday();
		const yesterday = addDays(today, -1);
		const todaysBefore = listTickets(today);
		const highestToday = Math.max(...todaysBefore.map((t: Ticket) => t.number));

		const yesterdayTicket = issueTicket(
			{ patientName: 'Bisi Yesterday', phone: '08031234599', reason: 'Check-up' },
			clinicInstant(yesterday, '09:00')
		);

		const yesterdays = listTickets(yesterday);
		const todaysAfter = listTickets(today);

		expect(yesterdays.map((t: Ticket) => t.id)).toContain(yesterdayTicket.id);
		expect(todaysAfter.map((t: Ticket) => t.id)).not.toContain(yesterdayTicket.id);
		expect(yesterdayTicket.number).toBeGreaterThan(highestToday);
	});
});
