/**
 * Reference test: the NICE CG98 "Treatment threshold graphs" workbook is the
 * authoritative source of the algorithm. This test parses that workbook at
 * runtime and verifies every cell it publishes matches thresholds(...).
 *
 * The workbook has one "Data sheet" with 57 hour rows (0, 6, ..., 336). Cols
 * I/J hold the static >=38w photo / exchange table. Cols D/E hold preterm
 * formulas that compute a 12-step linear ramp from (40, 80) at hour 0 to
 * (g*10-100, g*10) at hour 72, then flat to hour 336.
 *
 * Tolerance: ±0.5 μmol/L, as required by the build spec §9.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import * as XLSX from 'xlsx';
import { describe, it, expect } from 'vitest';
import { thresholds, type Gestation } from './thresholds';

const WORKBOOK = resolve(
  __dirname,
  '..',
  '..',
  'treatment-threshold-graphs-excel-544300525.xls',
);
const TOLERANCE = 0.5;

type HourRow = {
  hours: number;
  termPhoto: number;
  termExch: number;
};

function loadWorkbookRows(): HourRow[] {
  const buf = readFileSync(WORKBOOK);
  const wb = XLSX.read(buf, { type: 'buffer' });
  const sheet = wb.Sheets['Data sheet'];
  if (!sheet) throw new Error('Workbook missing "Data sheet"');
  const rows: HourRow[] = [];
  for (let r = 2; r <= 58; r++) {
    const h = sheet[`A${r}`]?.v;
    const photo = sheet[`I${r}`]?.v;
    const exch = sheet[`J${r}`]?.v;
    if (typeof h !== 'number' || typeof photo !== 'number' || typeof exch !== 'number') {
      throw new Error(`Workbook row ${r} has non-numeric cells (A=${h}, I=${photo}, J=${exch})`);
    }
    rows.push({ hours: h, termPhoto: photo, termExch: exch });
  }
  return rows;
}

/**
 * Expected preterm values derived from the xls formula structure:
 *   - row 0 (h=0):   photo=40, exch=80
 *   - rows 1..11 (h=6..66): ramp E2 + k*(E14-E2)/12, photo analogue
 *   - row 12 (h=72): photo=g*10-100, exch=g*10       (plateau reached)
 *   - row 13+ (h>=78): flat at plateau
 */
function expectedPreterm(g: number, hours: number): { photo: number; exch: number } {
  const plateauPhoto = g * 10 - 100;
  const plateauExch = g * 10;
  if (hours >= 72) return { photo: plateauPhoto, exch: plateauExch };
  const stepPhoto = (plateauPhoto - 40) / 12;
  const stepExch = (plateauExch - 80) / 12;
  const k = hours / 6;
  return {
    photo: 40 + k * stepPhoto,
    exch: 80 + k * stepExch,
  };
}

const workbookRows = loadWorkbookRows();

describe('NICE CG98 workbook — sheet structure', () => {
  it('has the expected 57 hour rows from 0 to 336 in 6-hour steps', () => {
    expect(workbookRows).toHaveLength(57);
    expect(workbookRows[0].hours).toBe(0);
    expect(workbookRows[workbookRows.length - 1].hours).toBe(336);
    for (let i = 0; i < workbookRows.length; i++) {
      expect(workbookRows[i].hours).toBe(i * 6);
    }
  });

  it('preterm formulas use the expected anchors (D2=40, E2=80, D15=g*10-100, E14=g*10)', () => {
    const buf = readFileSync(WORKBOOK);
    const wb = XLSX.read(buf, { type: 'buffer' });
    const sh = wb.Sheets['Data sheet'];
    // D2 / E2 are IF(AND(...),<start>,...). Confirm the start constants.
    expect(sh['D2'].f).toMatch(/,\s*40\s*,/);
    expect(sh['E2'].f).toMatch(/,\s*80\s*,/);
    // D15 / E14 hold the plateau formulas referencing the gestation cell.
    expect(sh['D15'].f).toContain('*10-100');
    expect(sh['E14'].f).toContain('*10');
    // Intermediate rows step by (plateau - start) / 12.
    expect(sh['D3'].f).toContain('($D$15-$D$2)/12');
    expect(sh['E3'].f).toContain('($E$14-$E$2)/12');
  });
});

describe('NICE CG98 workbook — term (≥38w) thresholds match every row', () => {
  it.each(workbookRows)(
    'at hour $hours: photo=$termPhoto, exch=$termExch',
    (row: HourRow) => {
      const got = thresholds('>=38', row.hours);
      expect(Math.abs(got.photo - row.termPhoto)).toBeLessThanOrEqual(TOLERANCE);
      expect(Math.abs(got.exch - row.termExch)).toBeLessThanOrEqual(TOLERANCE);
    },
  );
});

describe('NICE CG98 workbook — preterm thresholds match every (gestation, hour) cell', () => {
  const gestations: ReadonlyArray<Exclude<Gestation, '>=38'>> = [
    23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37,
  ];
  for (const g of gestations) {
    describe(`gestation ${g}w`, () => {
      it.each(workbookRows)('at hour $hours', (row: HourRow) => {
        const expected = expectedPreterm(g, row.hours);
        const got = thresholds(g, row.hours);
        expect(Math.abs(got.photo - expected.photo)).toBeLessThanOrEqual(TOLERANCE);
        expect(Math.abs(got.exch - expected.exch)).toBeLessThanOrEqual(TOLERANCE);
      });
    });
  }
});

describe('NICE CG98 workbook — off-grid term interpolation matches linear xls behaviour', () => {
  const cases = [
    { hours: 3, between: [0, 6] },
    { hours: 15, between: [12, 18] },
    { hours: 45, between: [42, 48] },
    { hours: 58, between: [54, 60] },
    { hours: 81, between: [78, 84] },
  ];
  it.each(cases)('at hour $hours, interpolated between rows at $between', ({ hours, between }) => {
    const [h0, h1] = between;
    const r0 = workbookRows.find((r) => r.hours === h0)!;
    const r1 = workbookRows.find((r) => r.hours === h1)!;
    const f = (hours - h0) / (h1 - h0);
    const expectedPhoto = r0.termPhoto + f * (r1.termPhoto - r0.termPhoto);
    const expectedExch = r0.termExch + f * (r1.termExch - r0.termExch);
    const got = thresholds('>=38', hours);
    expect(Math.abs(got.photo - expectedPhoto)).toBeLessThanOrEqual(TOLERANCE);
    expect(Math.abs(got.exch - expectedExch)).toBeLessThanOrEqual(TOLERANCE);
  });
});
