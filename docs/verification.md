# Verification against the NICE CG98 workbook

This document records how the app's `thresholds(gestation, ageHours)` function
was verified against NICE CG98's official *Treatment threshold graphs* Excel
workbook, which is the clinical source of truth for the preterm and term
threshold values used in the UK.

## 1. Reference artefact

| Field | Value |
|---|---|
| File | `treatment-threshold-graphs-excel-544300525.xls` |
| Size | 269 312 bytes |
| MD5 | `61879fb585f803bf8c74ae954cd05ba1` |
| Source | NICE CG98 resources page (workbook published 12 Aug 2011, guideline last reviewed 31 Oct 2023) |
| Location in repo | repository root |

The file ships with the repository so the test is fully reproducible offline.

## 2. How the workbook encodes the algorithm

The workbook has six sheets; only two carry calculation logic:

- **`Data sheet`** — 57 rows, one per 6-hour tick from hour 0 to hour 336
  (day 0 to day 14). Columns carry:

    | Col | Meaning |
    |---|---|
    | A | Age in hours (`0, 6, 12, … 336`) |
    | B | Age in whole days (blank on sub-day rows) |
    | C | Age in fractional days (`=A/24`) |
    | D | Phototherapy threshold for the **selected gestation** |
    | E | Exchange-transfusion threshold for the **selected gestation** |
    | I | Phototherapy threshold for **≥38 weeks** (static literals) |
    | J | Exchange-transfusion threshold for **≥38 weeks** (static literals) |

- **`Treatment threshold graphs`** — a form with a single data-validation
  cell `M6` that the clinician uses to pick a gestation (an integer 22–37,
  or the text `>=38`).

### 2.1 Term (≥38w) — a static 17-point lookup

Columns **I** and **J** rows 2–58 are plain numeric literals. They define
the canonical term table and never change. They are identical to the table
in the build spec (§6.5).

### 2.2 Preterm (23–37w) — a 12-step linear ramp

Columns **D** and **E** are formulas. Each cell has the shape:

```excel
=IF(AND('Treatment threshold graphs'!$M$6 >= 22,
        'Treatment threshold graphs'!$M$6 <= 37),
    <preterm branch>,
    'Data sheet'!<term column>)
```

So when the gestation selector is an integer in [22, 37] the preterm branch
is used; otherwise the cell falls through to the ≥38w value in I/J. That's
why the workbook *as shipped* caches the ≥38w values in cols D/E — `M6`
defaults to the text `">=38"`, which fails the numeric AND.

The preterm branch has exactly this structure:

| Cell | Formula (simplified) | Meaning |
|---|---|---|
| `D2` | `40` | photo start @ h=0 |
| `E2` | `80` | exchange start @ h=0 |
| `D3..D14` | `D{prev} + ($D$15 - $D$2) / 12` | linear ramp (12 steps of 6 h) |
| `E3..E13` | `E{prev} + ($E$14 - $E$2) / 12` | linear ramp (12 steps of 6 h) |
| `D15` | `M6 * 10 - 100` | photo plateau |
| `E14` | `M6 * 10` | exchange plateau |
| `D16..D58` | `M6 * 10 - 100` | photo flat beyond 72 h |
| `E15..E58` | `M6 * 10` | exchange flat beyond 72 h |

Algebraically, each preterm row satisfies:

```
photo(h) = 40 + (h / 72) · (g·10 - 100 - 40)   for 0 ≤ h ≤ 72
photo(h) = g·10 - 100                          for h > 72
exch(h)  = 80 + (h / 72) · (g·10 - 80)         for 0 ≤ h ≤ 72
exch(h)  = g·10                                for h > 72
```

This is identical to the closed-form formulas in the build spec §6.4 and in
`src/lib/thresholds.ts`.

## 3. How the verification test works

File: `src/lib/thresholds.reference.test.ts`.

1. At test start, `xlsx` (SheetJS) parses the workbook from disk and reads
   every row of columns A, I and J, as well as the **raw formula text** of
   the key cells D2, E2, D3, E3, D15, E14.
2. A structural assertion pins the anchor formulas so that if a future NICE
   revision changes the shape of the ramp, the test fails loudly rather than
   silently.
3. A term-lookup assertion compares `thresholds('>=38', h)` against cols I/J
   for every one of the 57 hour rows.
4. For each of the 15 preterm gestations (23–37 weeks), and each of the 57
   hour rows, the test derives the expected value from the workbook's
   formula anchors (`(40, 80)` start; `(g·10 - 100, g·10)` plateau; 12 equal
   steps) and compares it against `thresholds(g, h)`.
5. Five off-grid term samples (h = 3, 15, 45, 58, 81) are checked against a
   linear interpolation of the two bracketing rows in the xls — matching how
   the spec specifies §6.5 and how the xls chart renders between points.

Tolerance: **±0.5 μmol/L**, as required by the build spec §9. All assertions
pass with zero tolerance consumed — the implementation is exact against the
workbook values.

### 3.1 Assertion counts

| Group | Assertions |
|---|---|
| Workbook shape (57 rows) | 1 |
| Formula anchors | 1 |
| Term table rows | 57 |
| Preterm rows (15 gestations × 57 rows) | 855 |
| Off-grid term interpolation | 5 |
| **Total in reference test** | **919** |

Plus the existing closed-form unit suite:

| File | Tests |
|---|---|
| `src/lib/thresholds.test.ts` | 24 |
| `src/lib/derive.test.ts` | 9 |
| `src/lib/validation.test.ts` | 11 |
| `src/lib/thresholds.reference.test.ts` | 919 |
| **Total across project** | **963** |

## 4. Proof of success

Run the suite locally:

```
npx vitest run
```

Recorded output (truncated to the summary block):

```
 ✓ src/lib/thresholds.test.ts  (24 tests) 5ms
 ✓ src/lib/derive.test.ts  (9 tests) 4ms
 ✓ src/lib/thresholds.reference.test.ts  (919 tests) 74ms
 ✓ src/lib/validation.test.ts  (11 tests) 4ms

 Test Files  4 passed (4)
      Tests  963 passed (963)
```

Every row of the NICE workbook matches the app's implementation within
0.5 μmol/L (and in practice, matches to floating-point precision).

### 4.1 Worked example (spec §11.4)

Given gestation ≥ 38, DoB `2025-01-01 00:00`, current sample
`2025-01-03 10:00` (= 58 h of age), SBR 245 μmol/L:

| Quantity | Calculation | Value |
|---|---|---|
| Photo threshold at 58 h | interp(54 h → 262, 60 h → 275) | 270.67 |
| Exchange threshold at 58 h | interp(54 h → 450, 60 h → 450) | 450.00 |
| Distance to phototherapy | 245 − 270.67 | −25.67 → **"26 below"** |
| Distance to exchange | 245 − 450 | −205 → **"205 below"** |

Add a previous sample at 46 h, SBR 230 μmol/L: rate of rise = (245 − 230) / (58 − 46) = **+1.3 μmol/L/hr**. These are pinned by
`src/lib/derive.test.ts > derive (§11.4)`.

## 5. Caveats

- The workbook is the numeric source of truth. The **clinical** source of
  truth is still NICE CG98 itself — if NICE updates the guideline, the xls
  ships last, so re-run this test after every NICE update.
- Bilirubin assays vary between manufacturers (NICE safety notice,
  March 2023). The app surfaces this as a static footer disclaimer.
- The xls chart ends at day 14 (hour 336). Ages beyond that are clamped to
  the day-14 values and the UI surfaces the note required by spec §6.8.

## 6. Reproduce the verification

```bash
# Clean install
npm install

# Run only the reference test
npx vitest run src/lib/thresholds.reference.test.ts

# Run the full suite
npx vitest run
```

If the xls file is ever replaced, re-parse it with:

```bash
node -e "const X=require('xlsx');const w=X.readFile('treatment-threshold-graphs-excel-544300525.xls');console.log(X.utils.sheet_to_json(w.Sheets['Data sheet'],{header:1}))"
```

and sanity-check the row count and the (hours, I, J) triples before
committing.
