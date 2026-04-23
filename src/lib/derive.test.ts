import { describe, it, expect } from 'vitest';
import {
  ageHours,
  derive,
  formatAge,
  formatDistance,
  formatRateOfRise,
  rateOfRise,
} from './derive';

describe('ageHours', () => {
  it('returns hours between two dates', () => {
    const dob = new Date('2025-01-01T00:00:00');
    const sample = new Date('2025-01-03T10:00:00');
    expect(ageHours(sample, dob)).toBeCloseTo(58, 6);
  });

  it('is negative when sample precedes dob', () => {
    const dob = new Date('2025-01-01T12:00:00');
    const sample = new Date('2025-01-01T10:00:00');
    expect(ageHours(sample, dob)).toBeCloseTo(-2, 6);
  });
});

describe('derive (§11.4)', () => {
  const dob = new Date('2025-01-01T00:00:00');
  const current = {
    sampledAt: new Date('2025-01-03T10:00:00'),
    sbrUmolL: 245,
  };
  const previous = {
    sampledAt: new Date('2025-01-02T22:00:00'),
    sbrUmolL: 230,
  };

  it('computes age, thresholds, and distances without previous', () => {
    const d = derive('>=38', dob, current, null);
    expect(d.ageHours).toBeCloseTo(58, 6);
    expect(d.photoThreshold).toBeCloseTo(270.666, 2);
    expect(d.exchangeThreshold).toBe(450);
    expect(Math.round(d.distanceToPhoto)).toBe(-26);
    expect(d.distanceToExchange).toBe(-205);
    expect(d.rateOfRise).toBeNull();
  });

  it('computes rate of rise when previous present', () => {
    const d = derive('>=38', dob, current, previous);
    expect(d.rateOfRise).toBeCloseTo(1.25, 3);
  });
});

describe('rateOfRise edge cases', () => {
  it('returns null when samples share a timestamp', () => {
    const t = new Date('2025-01-01T12:00:00');
    expect(
      rateOfRise(
        { sampledAt: t, sbrUmolL: 100 },
        { sampledAt: t, sbrUmolL: 90 },
      ),
    ).toBeNull();
  });

  it('returns null when previous after current', () => {
    expect(
      rateOfRise(
        { sampledAt: new Date('2025-01-01T10:00:00'), sbrUmolL: 100 },
        { sampledAt: new Date('2025-01-01T12:00:00'), sbrUmolL: 90 },
      ),
    ).toBeNull();
  });
});

describe('formatters', () => {
  it('formatDistance above/below/on line', () => {
    expect(formatDistance(42.4)).toBe('42 above');
    expect(formatDistance(-25.6)).toBe('26 below');
    expect(formatDistance(0)).toBe('on line');
    expect(formatDistance(0.3)).toBe('on line');
  });

  it('formatRateOfRise signed with one decimal', () => {
    expect(formatRateOfRise(3.2)).toBe('+3.2 μmol/L/hr');
    expect(formatRateOfRise(-1.25)).toBe('−1.3 μmol/L/hr');
    expect(formatRateOfRise(0)).toBe('+0.0 μmol/L/hr');
    expect(formatRateOfRise(null)).toBe('—');
  });

  it('formatAge rounds to nearest whole hour', () => {
    expect(formatAge(57.8)).toBe('58 hours');
    expect(formatAge(1)).toBe('1 hour');
    expect(formatAge(0.4)).toBe('0 hours');
  });
});
