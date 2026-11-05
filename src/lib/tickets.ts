import type { Ticket } from './types';

/** Display order for queue boards: by ticket code. */
export function byCode(a: Ticket, b: Ticket): number {
	return a.code.localeCompare(b.code);
}

export function waitingTickets(tickets: Ticket[]): Ticket[] {
	return tickets.filter((t) => t.status === 'waiting').toSorted(byCode);
}

export function waitingSince(ticket: Ticket, now = Date.now()): number {
	return Math.max(0, Math.round((now - new Date(ticket.issuedAt).getTime()) / 60000));
}
