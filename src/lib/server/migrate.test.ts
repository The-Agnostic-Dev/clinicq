import { describe, it, expect } from 'vitest';
import { readSlot } from './forms';
import { clinicInstant } from '$lib/time';

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
