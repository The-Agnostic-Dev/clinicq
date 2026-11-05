# ClinicQ

Front desk system for a small private clinic in Lagos. Receptionists use it to run the walk-in
queue, book and check in appointments, and see which doctors are in; the clinic manager keeps the
doctors' schedules and reads the daily summary; doctors call their next patient from the queue.

ClinicQ deliberately keeps no medical records: only patient names, phone numbers and the reason
for the visit as the patient gave it at the desk.

## Features

- **Walk-in queue** (`/queue`): issue numbered tickets (A1, A2, ...), see who is waiting and
  for how long, call the next patient to a free doctor, mark patients as seen or not here.
- **Appointments** (`/appointments`): day view grouped by doctor, book, move or cancel
  appointments, check patients in when they arrive, mark them seen or missed.
- **Doctors** (`/doctors`): consultation length, lunch break and fee per doctor; mark a doctor
  as "not in today".
- **Patients** (`/patients`): everyone who has visited or booked, searchable by name or phone.
- **Daily summary** (`/summary`): walk-ins, appointments and expected fees for any day.

## How the clinic works (business rules)

- The clinic runs on Lagos time (WAT, UTC+1) whatever timezone the server is in. Times are
  stored as UTC instants and always shown on the Lagos clock.
- **Ticket numbers continue from the last ticket issued**, so they never restart at A1. The
  queue page shows today's tickets plus yesterday's in their own section; earlier days are in
  the daily summary (pick the date) and in patient search.
- Walk-ins are not tied to a doctor. "Call next" always calls the waiting patient with the lowest
  ticket number to the doctor whose button was pressed. A doctor must press "Done" or "Not here"
  for their current patient before calling the next one.
- **Estimated wait** for a walk-in: the people waiting ahead of them, shared between the doctors on
  duty, each taking their usual consultation time. The first in line shows "Next".
- **Appointments** run from 08:00 to 16:00. Each one lasts the doctor's consultation time
  (15 or 20 minutes in the demo data). A booking is refused if it is in the past, falls outside
  opening hours, overlaps the doctor's break, or overlaps another of the doctor's appointments.
  Cancelled appointments stay on the day list, greyed out, and free the slot.
- Phone numbers are Nigerian mobiles. The desk can type them as `0803 123 4567`, `08031234567`
  or `+234 803 123 4567`; they are stored as `08031234567`.
- Patients can only be checked in on the day of their appointment. A patient marked missed can
  still be checked in if they turn up late.
- "Not in today" on the Doctors page only lasts for the day: the doctor is back on duty the next
  morning without anyone touching it.
- **Fees expected** on the daily summary is each doctor's consultation fee times the patients they
  saw: walk-ins marked Done, and appointments checked in or seen. Patients not here when called,
  missed appointments, cancellations and people still in the queue are not counted. ClinicQ does
  not record payments; this is what the desk should expect to have collected.

## Demo logins

All demo accounts use the password `clinicq2026`.

| Username     | Who                          | Role                                   |
| ------------ | ---------------------------- | -------------------------------------- |
| `blessing`   | Blessing Okafor              | Receptionist                           |
| `kemi`       | Kemi Balogun                 | Receptionist                           |
| `ifeoma`     | Ifeoma Nwachukwu             | Clinic manager (can edit doctors)      |
| `dr.okonkwo` | Dr Adaeze Okonkwo            | Doctor                                 |

The demo data is relative to the day it is loaded: today's queue is half-way through the
morning, and there are appointments yesterday, today and over the next two days.

## Running it

Requirements: Node.js 22 or newer. SQLite comes with `better-sqlite3`; nothing else to install.

```bash
npm install
npm run dev          # http://localhost:5114, hot reload
```

Production build:

```bash
npm run build
PORT=5114 ORIGIN=http://localhost:5114 npm start
```

With Docker:

```bash
docker compose up --build   # http://localhost:5114
```

The container reloads the demo data every time it starts.

### Configuration

See `.env.example`.

| Variable          | Default            | Meaning                                                     |
| ----------------- | ------------------ | ----------------------------------------------------------- |
| `CLINICQ_DB_PATH` | `data/clinicq.db`  | SQLite file. Created and filled with demo data if missing.  |
| `CLINICQ_RESEED`  | `0`                | `1` wipes the database and reloads the demo data on start.  |
| `PORT`            | `3000` (node), `5114` (dev and Docker) | HTTP port.                              |
| `ORIGIN`          |                    | Public URL, needed by SvelteKit for form posts in production. |

To start again from fresh demo data locally, stop the app and delete `data/clinicq.db`, or start
it once with `CLINICQ_RESEED=1`.

## Tests

```bash
npm test             # Vitest, uses an in-memory database
npm run check        # svelte-check / TypeScript
```

## Project layout

```
src/
  hooks.server.ts            session cookie -> locals.user, login redirect
  lib/
    time.ts                  Lagos clock helpers (days, instants, formatting)
    phone.ts                 Nigerian phone number parsing and display
    format.ts, waits.ts      naira, wait text, walk-in wait estimate
    tickets.ts               queue display helpers
    components/              Nav, Flash, StatusBadge, DayPicker
    server/
      db.ts, seed.ts         SQLite connection, schema, demo data
      auth.ts, password.ts   logins and sessions
      doctors.ts, roster.ts  doctors and today's on-duty roster
      queue.ts               walk-in tickets
      appointments.ts        booking rules, check-in, cancellations
      patients.ts            patient list and search
      summary.ts             daily summary
      forms.ts               form field parsing shared by actions
  routes/                    one folder per screen (+page.server.ts holds load and actions)
```

Stack: SvelteKit 2 with Svelte 5 runes, TypeScript, `@sveltejs/adapter-node`, SQLite via
`better-sqlite3`, Vitest.
