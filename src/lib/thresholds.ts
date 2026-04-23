export type Gestation =
  | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30
  | 31 | 32 | 33 | 34 | 35 | 36 | 37
  | '>=38';

export type ThresholdPair = { photo: number; exch: number };

const TERM_TABLE: ReadonlyArray<readonly [number, number, number]> = [
  [ 0, 100, 100], [ 6, 125, 150], [12, 150, 200], [18, 175, 250],
  [24, 200, 300], [30, 212, 350], [36, 225, 400], [42, 237, 450],
  [48, 250, 450], [54, 262, 450], [60, 275, 450], [66, 287, 450],
  [72, 300, 450], [78, 312, 450], [84, 325, 450], [90, 337, 450],
  [96, 350, 450],
];

export const MAX_CHART_HOURS = 336;

function interp(x: number, x0: number, x1: number, y0: number, y1: number): number {
  if (x1 === x0) return y0;
  return y0 + ((x - x0) / (x1 - x0)) * (y1 - y0);
}

function termThreshold(ageHours: number): ThresholdPair {
  const h = Math.max(0, Math.min(MAX_CHART_HOURS, ageHours));
  if (h >= 96) return { photo: 350, exch: 450 };
  for (let i = 0; i < TERM_TABLE.length - 1; i++) {
    const [h0, p0, e0] = TERM_TABLE[i];
    const [h1, p1, e1] = TERM_TABLE[i + 1];
    if (h >= h0 && h <= h1) {
      return {
        photo: interp(h, h0, h1, p0, p1),
        exch: interp(h, h0, h1, e0, e1),
      };
    }
  }
  return { photo: 350, exch: 450 };
}

function pretermThreshold(g: number, ageHours: number): ThresholdPair {
  const h = Math.max(0, Math.min(MAX_CHART_HOURS, ageHours));
  const plateauPhoto = g * 10 - 100;
  const plateauExch = g * 10;
  const photo =
    h >= 72 ? plateauPhoto : 40 + (h / 72) * (plateauPhoto - 40);
  const exch =
    h >= 72 ? plateauExch : 80 + (h / 72) * (plateauExch - 80);
  return { photo, exch };
}

export function thresholds(gestation: Gestation, ageHours: number): ThresholdPair {
  if (gestation === '>=38') return termThreshold(ageHours);
  return pretermThreshold(gestation, ageHours);
}

/**
 * Dense sample of threshold values across the chart, for plotting lines.
 * Returns points spaced every `stepHours`, plus the knot at 72h (preterm)
 * or every term-table grid point (term), so kinks are exact.
 */
export function thresholdSeries(
  gestation: Gestation,
  stepHours = 6,
): Array<{ hours: number; photo: number; exch: number }> {
  const points: number[] = [];
  for (let h = 0; h <= MAX_CHART_HOURS; h += stepHours) points.push(h);
  if (gestation === '>=38') {
    for (const [h] of TERM_TABLE) if (!points.includes(h)) points.push(h);
  } else {
    if (!points.includes(72)) points.push(72);
  }
  if (!points.includes(MAX_CHART_HOURS)) points.push(MAX_CHART_HOURS);
  points.sort((a, b) => a - b);
  return points.map((hours) => {
    const { photo, exch } = thresholds(gestation, hours);
    return { hours, photo, exch };
  });
}
