import { describe, it, expect } from 'vitest';
import { readSlot } from './forms';
import { clinicInstant } from '$lib/time';
import { getDb } from './db';
import { seedDemoData } from './seed';
import { fixAppointmentTimes } from './migrate';

describe('readSlot', () => {
  it('builds startsAt in clinic time, not server local time', () => {
    const form = new FormData();
    form.append('date', '2026-05-01');
    form.append('time', '10:00');

    const result = readSlot(form);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.startsAt.toISOString()).toBe(clinicInstant('2026-05-01', '10:00').toISOString());
  });
});

describe('fixAppointmentTimes', () => {
  it('shifts rows written by the old booking form and preserves duration', () => {
    const db = getDb();
    seedDemoData(db);

    const uniqueCreatedAt = new Date('2020-01-01T00:00:00.000Z').toISOString();
    db.prepare(
      `INSERT INTO appointments (doctor_id, patient_name, phone, reason, starts_at, ends_at, status, checked_in_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      1,
      'Test Patient',
      '08000000000',
      'Test reason',
      '2026-05-01T10:00:00.000Z',
      '2026-05-01T10:20:00.000Z',
      'booked',
      null,
      uniqueCreatedAt
    );

    fixAppointmentTimes(db, 0);

    const row = db
      .prepare('SELECT starts_at, ends_at FROM appointments WHERE patient_name = ?')
      .get('Test Patient') as { starts_at: string; ends_at: string };
    expect(row.starts_at).toBe('2026-05-01T09:00:00.000Z');
    expect(row.ends_at).toBe('2026-05-01T09:20:00.000Z');
  });

  it('leaves already-correct seed rows unchanged because their created_at is shared', () => {
    const db = getDb();
    seedDemoData(db);

    const find = db.prepare(
      `SELECT starts_at, ends_at FROM appointments WHERE patient_name = ? AND reason = ?`
    );
    const before = find.get('Chioma Okeke', 'Antenatal booking') as {
      starts_at: string;
      ends_at: string;
    };

    fixAppointmentTimes(db, 0);

    const after = find.get('Chioma Okeke', 'Antenatal booking') as {
      starts_at: string;
      ends_at: string;
    };
    expect(after.starts_at).toBe(before.starts_at);
    expect(after.ends_at).toBe(before.ends_at);
  });
});
