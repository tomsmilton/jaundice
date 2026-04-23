import { thresholds, type Gestation } from './thresholds';

export type Reading = {
  sampledAt: Date;
  sbrUmolL: number;
};

export type Derived = {
  ageHours: number;
  photoThreshold: number;
  exchangeThreshold: number;
  distanceToPhoto: number;
  distanceToExchange: number;
  rateOfRise: number | null;
};

export const MS_PER_HOUR = 3_600_000;

export function ageHours(sampledAt: Date, dob: Date): number {
  return (sampledAt.getTime() - dob.getTime()) / MS_PER_HOUR;
}

export function rateOfRise(current: Reading, previous: Reading): number | null {
  const dt = ageHours(current.sampledAt, previous.sampledAt);
  if (dt <= 0) return null;
  return (current.sbrUmolL - previous.sbrUmolL) / dt;
}

export function derive(
  gestation: Gestation,
  dob: Date,
  current: Reading,
  previous: Reading | null,
): Derived {
  const age = ageHours(current.sampledAt, dob);
  const { photo, exch } = thresholds(gestation, age);
  return {
    ageHours: age,
    photoThreshold: photo,
    exchangeThreshold: exch,
    distanceToPhoto: current.sbrUmolL - photo,
    distanceToExchange: current.sbrUmolL - exch,
    rateOfRise: previous ? rateOfRise(current, previous) : null,
  };
}

export function formatDistance(distance: number): string {
  const rounded = Math.round(distance);
  if (rounded === 0) return 'on line';
  if (rounded > 0) return `${rounded} above`;
  return `${Math.abs(rounded)} below`;
}

export function formatRateOfRise(rate: number | null): string {
  if (rate === null) return '—';
  const sign = rate >= 0 ? '+' : '−';
  return `${sign}${Math.abs(rate).toFixed(1)} μmol/L/hr`;
}

export function formatAge(ageH: number): string {
  return `${Math.round(ageH)} hour${Math.round(ageH) === 1 ? '' : 's'}`;
}
