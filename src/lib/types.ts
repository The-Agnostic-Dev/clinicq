export type Role = 'reception' | 'manager' | 'doctor';

export interface SessionUser {
	username: string;
	name: string;
	role: Role;
	doctorId: number | null;
}

export interface Doctor {
	id: number;
	name: string;
	specialty: string;
	room: string;
	consultMinutes: number;
	feeKobo: number;
	breakStart: string;
	breakEnd: string;
	offDay: string | null;
}

export interface RosterEntry extends Doctor {
	onDuty: boolean;
}

export type TicketStatus = 'waiting' | 'serving' | 'done' | 'no_show';

export interface Ticket {
	id: number;
	day: string;
	number: number;
	code: string;
	patientName: string;
	phone: string;
	reason: string;
	status: TicketStatus;
	doctorId: number | null;
	doctorName: string | null;
	issuedAt: string;
	calledAt: string | null;
	finishedAt: string | null;
	estWaitMinutes: number;
}

export type AppointmentStatus = 'booked' | 'checked_in' | 'done' | 'no_show' | 'cancelled';

export interface Appointment {
	id: number;
	doctorId: number;
	doctorName: string;
	patientName: string;
	phone: string;
	reason: string;
	startsAt: string;
	endsAt: string;
	status: AppointmentStatus;
	checkedInAt: string | null;
}

export const OPENING_TIME = '08:00';
export const CLOSING_TIME = '16:00';
