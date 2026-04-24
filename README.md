# Bilirubin · NICE CG98

A neonatal bilirubin threshold calculator that plots a baby's serum bilirubin
(SBR) against the phototherapy and exchange-transfusion thresholds defined by
[NICE CG98](https://www.nice.org.uk/guidance/cg98).

Live: <https://tsmilton.com/jaundice/>

> [!WARNING]
> For reference by qualified clinicians only. Not a medical device, and not to
> be used as the sole basis for clinical decisions. Bilirubin assays vary
> between manufacturers — consult your local pathology laboratory when
> interpreting thresholds.

## What it does

Given a gestational age, date/time of birth, and one or two SBR samples, the
app:

- computes the phototherapy and exchange thresholds at the sample age,
- shows the distance above or below each threshold,
- plots the reading(s) against the NICE threshold curves,
- derives a rate of rise when a previous sample is supplied.

Thresholds are computed from the closed-form formulas in NICE CG98, and pinned
numerically against the official NICE *Treatment threshold graphs* Excel
workbook — see [docs/verification.md](docs/verification.md) for the full audit.

## Development

```bash
npm install
npm run dev        # vite dev server
npm run build      # typecheck + production build into dist/
npm run test       # vitest (963 tests, including the xls reference suite)
npm run typecheck
```

The app is vanilla TypeScript + hand-rendered SVG. The whole bundle is ~7 kB
gzipped — no framework, no charting library.

### Layout

| Path | Purpose |
|---|---|
| `index.html` | Single page, inline CSS, mounts `src/main.ts` |
| `src/main.ts` | DOM wiring, input handling, SVG chart rendering |
| `src/lib/thresholds.ts` | NICE CG98 threshold formulas |
| `src/lib/derive.ts` | Age-at-sample and rate-of-rise derivations |
| `src/lib/validation.ts` | Input validation |
| `src/lib/*.test.ts` | Unit tests |
| `src/lib/thresholds.reference.test.ts` | Row-by-row check against the NICE xls |
| `treatment-threshold-graphs-excel-544300525.xls` | NICE reference workbook |
| `docs/verification.md` | How the reference test works and what it pins |

## Deploy

GitHub Pages deploys automatically from `main` via
[.github/workflows/pages.yml](.github/workflows/pages.yml). Every push runs the
full test suite before publishing.
