import { ageHours, type Reading } from './derive';

export type FieldErrors = {
  dob?: string;
  currentSampleAt?: string;
  currentSbr?: string;
  previousSampleAt?: string;
  previousSbr?: string;
};

export type FieldNotes = {
  ageOverChart?: string;
  shortInterval?: string;
};

export function parseSbr(raw: string): { value: number | null; error?: string } {
  if (raw.trim() === '') return { value: null };
  const n = Number(raw);
  if (!Number.isFinite(n)) {
    return { value: null, error: 'Enter a number.' };
  }
  if (n <= 0) {
    return { value: null, error: 'Must be greater than zero.' };
  }
  return { value: n };
}

export function parseDateTime(raw: string): Date | null {
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function validate(
  dob: Date | null,
  current: Reading | null,
  previous: Reading | null,
): { errors: FieldErrors; notes: FieldNotes } {
  const errors: FieldErrors = {};
  const notes: FieldNotes = {};

  if (dob && current?.sampledAt) {
    const age = ageHours(current.sampledAt, dob);
    if (age < 0) {
      errors.currentSampleAt = 'Sample time is before date of birth.';
    } else if (age > 336) {
      notes.ageOverChart =
        'Age > 14 days — NICE chart ends at day 14; threshold shown is the day-14 value.';
    }
  }

  if (current && previous) {
    const interval = ageHours(current.sampledAt, previous.sampledAt);
    if (interval < 0) {
      errors.previousSampleAt = 'Previous sample is after current sample.';
    } else if (interval > 0 && interval < 1) {
      notes.shortInterval =
        'Interval < 1 hour — rate of rise is sensitive to small measurement variation.';
    }
  }

  return { errors, notes };
}
