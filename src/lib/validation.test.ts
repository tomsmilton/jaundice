import { describe, it, expect } from 'vitest';
import { parseSbr, parseDateTime, validate } from './validation';

describe('parseSbr', () => {
  it('parses a positive number', () => {
    expect(parseSbr('245')).toEqual({ value: 245 });
    expect(parseSbr('0.5')).toEqual({ value: 0.5 });
  });

  it('returns empty for blank input', () => {
    expect(parseSbr('')).toEqual({ value: null });
    expect(parseSbr('   ')).toEqual({ value: null });
  });

  it('rejects non-numeric', () => {
    const r = parseSbr('abc');
    expect(r.value).toBeNull();
    expect(r.error).toMatch(/number/);
  });

  it('rejects zero and negative', () => {
    expect(parseSbr('0').error).toMatch(/greater/);
    expect(parseSbr('-5').error).toMatch(/greater/);
  });
});

describe('parseDateTime', () => {
  it('parses valid datetime-local strings', () => {
    const d = parseDateTime('2025-01-01T12:30');
    expect(d).toBeInstanceOf(Date);
    expect(d?.getHours()).toBe(12);
  });

  it('returns null for empty/invalid', () => {
    expect(parseDateTime('')).toBeNull();
    expect(parseDateTime('not a date')).toBeNull();
  });
});

describe('validate', () => {
  const dob = new Date('2025-01-01T00:00:00');

  it('flags sample before DoB', () => {
    const { errors } = validate(
      dob,
      { sampledAt: new Date('2024-12-31T23:00:00'), sbrUmolL: 100 },
      null,
    );
    expect(errors.currentSampleAt).toMatch(/before date of birth/);
  });

  it('notes age over 14 days', () => {
    const { notes } = validate(
      dob,
      { sampledAt: new Date('2025-01-16T00:00:00'), sbrUmolL: 300 },
      null,
    );
    expect(notes.ageOverChart).toMatch(/14 days/);
  });

  it('flags previous sample after current', () => {
    const { errors } = validate(
      dob,
      { sampledAt: new Date('2025-01-03T10:00:00'), sbrUmolL: 245 },
      { sampledAt: new Date('2025-01-03T12:00:00'), sbrUmolL: 230 },
    );
    expect(errors.previousSampleAt).toMatch(/after current/);
  });

  it('notes short interval < 1h', () => {
    const { notes } = validate(
      dob,
      { sampledAt: new Date('2025-01-03T10:30:00'), sbrUmolL: 245 },
      { sampledAt: new Date('2025-01-03T10:00:00'), sbrUmolL: 240 },
    );
    expect(notes.shortInterval).toMatch(/< 1 hour/);
  });

  it('no errors on happy path', () => {
    const { errors, notes } = validate(
      dob,
      { sampledAt: new Date('2025-01-03T10:00:00'), sbrUmolL: 245 },
      { sampledAt: new Date('2025-01-02T22:00:00'), sbrUmolL: 230 },
    );
    expect(errors).toEqual({});
    expect(notes).toEqual({});
  });
});
