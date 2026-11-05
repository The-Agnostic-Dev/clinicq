import { describe, it, expect, beforeEach } from 'vitest';
import { seedDemoData } from '$lib/server/seed';
import { getDb } from '$lib/server/db';
import { listTickets, waitingTickets, markNoShow } from '$lib/tickets';
import { clinicToday } from '$lib/time';

describe('waitingTickets', () => {
	beforeEach(() => {
		seedDemoData(getDb());
	});

	it('counts only the tickets shown in the Waiting list', () => {
		const tickets = listTickets(clinicToday());
		const waiting = waitingTickets(tickets);
		expect(waiting).toHaveLength(3);
		expect(waiting.map((t) => t.number)).toEqual([7, 8, 9]);
	});

	it('returns an empty list after all waiting tickets are marked as no-shows', () => {
		const tickets = listTickets(clinicToday());
		const waiting = waitingTickets(tickets);
		for (const ticket of waiting) {
			markNoShow(ticket);
		}
		const updatedTickets = listTickets(clinicToday());
		const updatedWaiting = waitingTickets(updatedTickets);
		expect(updatedWaiting).toHaveLength(0);
	});
});
