import { describe, it, expect } from 'vitest';
import { thresholds, thresholdSeries, type Gestation } from './thresholds';

const near = (actual: number, expected: number, tol = 0.5) => {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tol);
};

describe('preterm thresholds (§11.1)', () => {
  const cases: Array<[Gestation, number, number, number]> = [
    [30, 0, 40, 80],
    [30, 36, 120, 190],
    [30, 72, 200, 300],
    [30, 168, 200, 300],
    [23, 0, 40, 80],
    [23, 72, 130, 230],
    [37, 0, 40, 80],
    [37, 72, 270, 370],
    [37, 336, 270, 370],
  ];
  it.each(cases)('gestation %s, age %s h', (g, h, photo, exch) => {
    const r = thresholds(g, h);
    near(r.photo, photo);
    near(r.exch, exch);
  });

  it('matches formula sanity at 30w, 36h', () => {
    const r = thresholds(30, 36);
    expect(r.photo).toBeCloseTo(120, 6);
  });

  it('clamps ageHours < 0 to 0', () => {
    const r = thresholds(30, -10);
    expect(r.photo).toBe(40);
    expect(r.exch).toBe(80);
  });

  it('clamps ageHours > 336 to 336', () => {
    const r = thresholds(30, 10_000);
    expect(r.photo).toBe(200);
    expect(r.exch).toBe(300);
  });
});

describe('term thresholds at grid points (§11.2)', () => {
  const cases: Array<[number, number, number]> = [
    [0, 100, 100],
    [24, 200, 300],
    [48, 250, 450],
    [96, 350, 450],
    [200, 350, 450],
  ];
  it.each(cases)('age %s h', (h, photo, exch) => {
    const r = thresholds('>=38', h);
    near(r.photo, photo);
    near(r.exch, exch);
  });
});

describe('term interpolation between grid points (§11.3)', () => {
  const cases: Array<[number, number, number]> = [
    [3, 112.5, 125],
    [15, 162.5, 225],
    [45, 243.5, 450],
  ];
  it.each(cases)('age %s h', (h, photo, exch) => {
    const r = thresholds('>=38', h);
    near(r.photo, photo);
    near(r.exch, exch);
  });

  it('58h photo interpolates between 54h and 60h rows', () => {
    const r = thresholds('>=38', 58);
    expect(r.photo).toBeCloseTo(262 + (4 / 6) * 13, 4);
    expect(r.exch).toBe(450);
  });
});

describe('thresholdSeries', () => {
  it('starts at 0 and ends at 336', () => {
    const series = thresholdSeries(30);
    expect(series[0].hours).toBe(0);
    expect(series[series.length - 1].hours).toBe(336);
  });

  it('includes knot at 72h for preterm', () => {
    const series = thresholdSeries(30);
    const knot = series.find((p) => p.hours === 72);
    expect(knot).toBeDefined();
    expect(knot?.photo).toBeCloseTo(200, 6);
  });

  it('contains every term-table grid point', () => {
    const series = thresholdSeries('>=38');
    for (const h of [0, 6, 12, 18, 24, 30, 36, 42, 48, 54, 60, 66, 72, 78, 84, 90, 96]) {
      expect(series.some((p) => p.hours === h)).toBe(true);
    }
  });
});
