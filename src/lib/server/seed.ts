import type Database from 'better-sqlite3';
import { addDays, clinicInstant, clinicToday } from '$lib/time';
import { estimateWaitMinutes } from '$lib/waits';
import { hashPassword } from './password';

export const DEMO_PASSWORD = 'clinicq2026';

const DOCTORS = [
	{ id: 1, name: 'Dr Adaeze Okonkwo', specialty: 'General Practice', room: 'Room 1', minutes: 15, fee: 1_500_000, breakStart: '13:00', breakEnd: '13:30' },
	{ id: 2, name: 'Dr Tunde Bakare', specialty: 'Paediatrics', room: 'Room 2', minutes: 20, fee: 2_000_000, breakStart: '12:30', breakEnd: '13:30' },
	{ id: 3, name: 'Dr Funmilayo Adeyemi', specialty: 'Family Medicine', room: 'Room 3', minutes: 15, fee: 1_500_000, breakStart: '13:30', breakEnd: '14:00' }
];

const USERS = [
	{ username: 'blessing', name: 'Blessing Okafor', role: 'reception', doctorId: null },
	{ username: 'kemi', name: 'Kemi Balogun', role: 'reception', doctorId: null },
	{ username: 'ifeoma', name: 'Ifeoma Nwachukwu', role: 'manager', doctorId: null },
	{ username: 'dr.okonkwo', name: 'Dr Adaeze Okonkwo', role: 'doctor', doctorId: 1 }
];

type SeedTicket = [name: string, phone: string, reason: string, status: string, doctorId: number | null, minutesAgo: number];

// Today's walk-ins, in the order they arrived.
const TODAY_TICKETS: SeedTicket[] = [
	['Emeka Obi', '08031234501', 'Fever and headache', 'done', 1, 170],
	['Halima Yusuf', '08061234502', 'Blood pressure check', 'done', 3, 150],
	['Chukwudi Nnaji', '07031234503', 'Child with cough', 'done', 2, 135],
	['Folake Adebayo', '09021234504', 'Malaria test', 'no_show', null, 120],
	['Ibrahim Musa', '08121234505', 'Back pain', 'serving', 1, 95],
	['Grace Etim', '08091234506', 'Follow-up on test results', 'serving', 3, 80],
	['Tolu Ogunleye', '08051234507', 'Sore throat', 'waiting', null, 45],
	['Musa Danjuma', '07061234508', 'Rash on arm', 'waiting', null, 30],
	['Patience Okoro', '08171234509', 'Stomach pain', 'waiting', null, 12]
];

type SeedAppointment = [dayOffset: number, doctorId: number, time: string, name: string, phone: string, reason: string, status: string];

// Listed in the order the bookings were made, not by time.
const APPOINTMENTS: SeedAppointment[] = [
	[-2, 3, '10:00', 'Chioma Okeke', '08035550142', 'Antenatal booking', 'done'],
	[-1, 1, '09:00', 'Chioma Okeke', '08035550142', 'Review of scan', 'done'],
	[-1, 3, '10:00', 'Chinedu Eze', '08023456789', 'Diabetes review', 'done'],
	[-1, 2, '11:00', 'Adaobi Nwosu', '08134567890', 'Vaccination (6 weeks)', 'no_show'],
	[0, 1, '11:30', 'Chinwe Okafor', '08045678901', 'Annual check-up', 'booked'],
	[0, 3, '12:00', 'Ngozi Eze', '08056789012', 'Family planning', 'booked'],
	[0, 1, '09:00', 'Bola Ahmed', '09067890123', 'Asthma review', 'done'],
	[0, 2, '10:40', 'Zainab Bello', '08078901234', 'Child: ear infection', 'booked'],
	[0, 1, '14:00', 'Uche Nwosu', '08089012345', 'Blood test results', 'booked'],
	[0, 3, '08:30', 'Yemi Alabi', '08090123456', 'Hypertension review', 'no_show'],
	[0, 2, '09:00', 'Kelechi Obi', '07012345678', 'Child: fever', 'checked_in'],
	[0, 1, '10:00', 'Chinedu Eze', '08023456789', 'Foot check', 'booked'],
	[0, 3, '09:30', 'Segun Ojo', '08111222333', 'Medical certificate', 'done'],
	[0, 2, '15:00', 'Tobi Lawal', '08122233344', 'Child: allergy review', 'booked'],
	[0, 1, '08:30', 'Amaka Igwe', '08133344455', 'Wound dressing', 'done'],
	[1, 1, '09:00', 'Ada Nwankwo', '08144455566', 'Fertility consultation', 'booked'],
	[1, 2, '10:00', 'Fatima Sani', '08155566677', 'Child: growth check', 'booked'],
	[1, 1, '10:00', 'Peter Udo', '08166677788', 'Chest pain follow-up', 'booked'],
	[1, 3, '11:00', 'Kunle Ade', '08177788899', 'Cholesterol review', 'booked'],
	[2, 3, '09:00', 'Chioma Okeke', '08035550142', 'Antenatal visit', 'booked']
];

export function seedDemoData(db: Database.Database, now: Date = new Date()): void {
	const today = clinicToday(now);
	const minutesAgo = (m: number) => new Date(now.getTime() - m * 60_000).toISOString();

	const run = db.transaction(() => {
		db.exec('DELETE FROM sessions; DELETE FROM tickets; DELETE FROM appointments; DELETE FROM users; DELETE FROM doctors;');

		const insertDoctor = db.prepare(
			`INSERT INTO doctors (id, name, specialty, room, consult_minutes, fee_kobo, break_start, break_end)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
		);
		for (const d of DOCTORS) {
			insertDoctor.run(d.id, d.name, d.specialty, d.room, d.minutes, d.fee, d.breakStart, d.breakEnd);
		}

		const insertUser = db.prepare(
			'INSERT INTO users (username, name, role, doctor_id, password_hash) VALUES (?, ?, ?, ?, ?)'
		);
		const passwordHash = hashPassword(DEMO_PASSWORD);
		for (const u of USERS) {
			insertUser.run(u.username, u.name, u.role, u.doctorId, passwordHash);
		}

		const onDuty = DOCTORS.map((d) => ({ consultMinutes: d.minutes }));
		const insertTicket = db.prepare(
			`INSERT INTO tickets (day, number, patient_name, phone, reason, status, doctor_id, issued_at, called_at, finished_at, est_wait_minutes)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
		);
		let ahead = 0;
		TODAY_TICKETS.forEach(([name, phone, reason, status, doctorId, ago], index) => {
			const issued = minutesAgo(ago);
			const called = status === 'done' || status === 'serving' ? minutesAgo(ago - 10) : null;
			const finished = status === 'done' ? minutesAgo(ago - 25) : null;
			const estimate = status === 'waiting' ? estimateWaitMinutes(ahead++, onDuty) : 0;
			insertTicket.run(today, index + 1, name, phone, reason, status, doctorId, issued, called, finished, estimate);
		});

		const minutesById = new Map(DOCTORS.map((d) => [d.id, d.minutes]));
		const insertAppointment = db.prepare(
			`INSERT INTO appointments (doctor_id, patient_name, phone, reason, starts_at, ends_at, status, checked_in_at, created_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
		);
		for (const [offset, doctorId, time, name, phone, reason, status] of APPOINTMENTS) {
			const start = clinicInstant(addDays(today, offset), time);
			const end = new Date(start.getTime() + (minutesById.get(doctorId) ?? 15) * 60_000);
			const checkedIn = status === 'checked_in' || status === 'done' ? new Date(start.getTime() - 10 * 60_000).toISOString() : null;
			insertAppointment.run(doctorId, name, phone, reason, start.toISOString(), end.toISOString(), status, checkedIn, minutesAgo(60 * 24 * 3));
		}
	});
	run();
}
