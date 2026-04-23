import { thresholdSeries, type Gestation, MAX_CHART_HOURS } from './lib/thresholds';
import { derive, formatAge, type Reading } from './lib/derive';
import { parseDateTime, parseSbr, validate } from './lib/validation';
import { APP_VERSION, THRESHOLDS_REVIEWED } from './lib/about';

type State = {
  gestation: Gestation | null;
  dobRaw: string;
  currentAtRaw: string;
  currentSbrRaw: string;
  previousAtRaw: string;
  previousSbrRaw: string;
};

const state: State = {
  gestation: null,
  dobRaw: '',
  currentAtRaw: '',
  currentSbrRaw: '',
  previousAtRaw: '',
  previousSbrRaw: '',
};

const GESTATIONS: Gestation[] = [
  23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, '>=38',
];

const $ = <T extends Element>(sel: string) => {
  const el = document.querySelector<T>(sel);
  if (!el) throw new Error(`missing ${sel}`);
  return el;
};

function buildGestationPicker() {
  const host = $('#gest-group') as HTMLDivElement;
  host.innerHTML = '';
  for (const g of GESTATIONS) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.setAttribute('role', 'radio');
    btn.setAttribute('aria-checked', 'false');
    btn.setAttribute('aria-pressed', 'false');
    btn.dataset.g = String(g);
    btn.textContent = g === '>=38' ? '≥38' : String(g);
    btn.addEventListener('click', () => {
      state.gestation = g;
      render();
    });
    host.appendChild(btn);
  }
}

function bindInputs() {
  const bind = (id: string, key: keyof State) => {
    const el = $<HTMLInputElement>('#' + id);
    el.addEventListener('input', () => {
      (state as Record<string, unknown>)[key] = el.value;
      render();
    });
  };
  bind('dob', 'dobRaw');
  bind('cur-at', 'currentAtRaw');
  bind('cur-sbr', 'currentSbrRaw');
  bind('prev-at', 'previousAtRaw');
  bind('prev-sbr', 'previousSbrRaw');
}

function setErr(id: string, msg: string | undefined, inputId: string) {
  const errEl = $<HTMLElement>('#' + id);
  const input = $<HTMLInputElement>('#' + inputId);
  if (msg) {
    errEl.textContent = msg;
    errEl.hidden = false;
    input.setAttribute('aria-invalid', 'true');
  } else {
    errEl.hidden = true;
    input.removeAttribute('aria-invalid');
  }
}

function render() {
  // Gestation picker state
  for (const btn of document.querySelectorAll<HTMLButtonElement>('#gest-group button')) {
    const active = String(state.gestation) === btn.dataset.g;
    btn.setAttribute('aria-checked', active ? 'true' : 'false');
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
  }

  const dob = parseDateTime(state.dobRaw);
  const curAt = parseDateTime(state.currentAtRaw);
  const curSbr = parseSbr(state.currentSbrRaw);
  const prevAt = parseDateTime(state.previousAtRaw);
  const prevSbr = parseSbr(state.previousSbrRaw);

  const current: Reading | null =
    curAt && curSbr.value !== null
      ? { sampledAt: curAt, sbrUmolL: curSbr.value }
      : null;
  const previous: Reading | null =
    prevAt && prevSbr.value !== null
      ? { sampledAt: prevAt, sbrUmolL: prevSbr.value }
      : null;

  const { errors, notes } = validate(dob, current, previous);
  setErr('cur-at-err', errors.currentSampleAt, 'cur-at');
  setErr('cur-sbr-err', curSbr.error, 'cur-sbr');
  setErr('prev-at-err', errors.previousSampleAt, 'prev-at');
  setErr('prev-sbr-err', prevSbr.error, 'prev-sbr');

  const canDerive =
    state.gestation !== null && dob !== null && current !== null && !errors.currentSampleAt;

  const derivedValues = canDerive
    ? derive(
        state.gestation!,
        dob!,
        current!,
        previous && !errors.previousSampleAt ? previous : null,
      )
    : null;

  // Readout card
  const readoutEl = $<HTMLElement>('#readout');
  if (derivedValues && current) {
    readoutEl.classList.add('is-active');
    $('#r-sbr').textContent = String(Math.round(current.sbrUmolL));
    $('#r-age').textContent = `· ${formatAge(derivedValues.ageHours)} old`;
    renderPill('#r-photo', derivedValues.distanceToPhoto);
    renderPill('#r-exch', derivedValues.distanceToExchange);
    const riseRow = $<HTMLElement>('#r-rise-row');
    if (previous && !errors.previousSampleAt) {
      riseRow.hidden = false;
      renderRisePill('#r-rise', derivedValues.rateOfRise);
    } else {
      riseRow.hidden = true;
    }
    toggleNote('#r-note-over', notes.ageOverChart);
    toggleNote(
      '#r-note-interval',
      previous && !errors.previousSampleAt ? notes.shortInterval : undefined,
    );
  } else {
    readoutEl.classList.remove('is-active');
  }

  renderChart(
    state.gestation,
    canDerive && dob && current
      ? { ageDays: (current.sampledAt.getTime() - dob.getTime()) / 3_600_000 / 24, sbr: current.sbrUmolL }
      : null,
    dob && previous && !errors.previousSampleAt
      ? { ageDays: (previous.sampledAt.getTime() - dob.getTime()) / 3_600_000 / 24, sbr: previous.sbrUmolL }
      : null,
  );
}

function toggleNote(sel: string, msg: string | undefined) {
  const el = $<HTMLElement>(sel);
  if (msg) {
    el.textContent = msg;
    el.hidden = false;
  } else {
    el.hidden = true;
  }
}

function renderPill(sel: string, distance: number) {
  const el = $<HTMLElement>(sel);
  const n = Math.round(distance);
  el.classList.toggle('on-line', n === 0);
  if (n === 0) {
    el.textContent = 'on line';
  } else if (n > 0) {
    el.innerHTML = `<span class="arrow" aria-hidden="true">↑</span><span>${n} above</span>`;
  } else {
    el.innerHTML = `<span class="arrow" aria-hidden="true">↓</span><span>${Math.abs(n)} below</span>`;
  }
}

function renderRisePill(sel: string, rate: number | null) {
  const el = $<HTMLElement>(sel);
  if (rate === null) {
    el.classList.add('on-line');
    el.textContent = '—';
    return;
  }
  el.classList.remove('on-line');
  const sign = rate >= 0 ? '+' : '−';
  const arrow = rate >= 0 ? '↑' : '↓';
  el.innerHTML = `<span class="arrow" aria-hidden="true">${arrow}</span><span>${sign}${Math.abs(rate).toFixed(1)} μmol/L/hr</span>`;
}

// ──────────────── SVG chart ────────────────

const VIEW = { w: 600, h: 375, pad: { l: 38, r: 64, t: 12, b: 28 } };
const X_MAX_DAYS = MAX_CHART_HOURS / 24; // 14
const X_TICKS = [0, 2, 4, 6, 8, 10, 12, 14];

function yDomainFor(
  gestation: Gestation | null,
  points: Array<{ sbr: number } | null>,
): [number, number] {
  let max = 500;
  if (gestation) {
    const series = thresholdSeries(gestation);
    for (const p of series) if (p.exch > max) max = p.exch;
  }
  for (const p of points) if (p && p.sbr + 20 > max) max = p.sbr + 20;
  return [0, Math.ceil(max / 50) * 50];
}

function renderChart(
  gestation: Gestation | null,
  current: { ageDays: number; sbr: number } | null,
  previous: { ageDays: number; sbr: number } | null,
) {
  const svg = $<SVGSVGElement>('#chart');
  const { w, h, pad } = VIEW;
  const plotW = w - pad.l - pad.r;
  const plotH = h - pad.t - pad.b;

  const [y0, y1] = yDomainFor(gestation, [current, previous]);
  const xToPx = (d: number) => pad.l + (d / X_MAX_DAYS) * plotW;
  const yToPx = (v: number) => pad.t + (1 - (v - y0) / (y1 - y0)) * plotH;

  // Y ticks: every 100, or every 50 if range is small
  const step = y1 - y0 > 400 ? 100 : 50;
  const yTicks: number[] = [];
  for (let v = y0; v <= y1 + 0.5; v += step) yTicks.push(v);

  const parts: string[] = [];

  // Grid
  parts.push('<g class="grid">');
  for (const d of X_TICKS) {
    const x = xToPx(d);
    const major = d % 7 === 0 && d !== 0;
    parts.push(
      `<line class="${major ? 'major' : ''}" x1="${x}" y1="${pad.t}" x2="${x}" y2="${pad.t + plotH}" />`,
    );
  }
  for (const v of yTicks) {
    const y = yToPx(v);
    parts.push(`<line x1="${pad.l}" y1="${y}" x2="${pad.l + plotW}" y2="${y}" />`);
  }
  parts.push('</g>');

  // Axis labels
  parts.push('<g class="axis">');
  parts.push(
    `<line x1="${pad.l}" y1="${pad.t + plotH}" x2="${pad.l + plotW}" y2="${pad.t + plotH}" />`,
    `<line x1="${pad.l}" y1="${pad.t}" x2="${pad.l}" y2="${pad.t + plotH}" />`,
  );
  for (const d of X_TICKS) {
    const x = xToPx(d);
    parts.push(
      `<text x="${x}" y="${pad.t + plotH + 14}" text-anchor="middle">${d}</text>`,
    );
  }
  parts.push(
    `<text x="${pad.l + plotW / 2}" y="${h - 4}" text-anchor="middle" fill="var(--ink-2)">Age (days)</text>`,
  );
  for (const v of yTicks) {
    const y = yToPx(v);
    parts.push(
      `<text x="${pad.l - 6}" y="${y + 3}" text-anchor="end">${v}</text>`,
    );
  }
  parts.push('</g>');

  // Threshold lines + labels
  if (gestation) {
    const series = thresholdSeries(gestation);
    const pathP = series
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${xToPx(p.hours / 24)},${yToPx(p.photo)}`)
      .join(' ');
    const pathE = series
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${xToPx(p.hours / 24)},${yToPx(p.exch)}`)
      .join(' ');
    parts.push(`<path class="threshold" d="${pathP}" />`);
    parts.push(`<path class="threshold dashed" d="${pathE}" />`);

    const lastP = series[series.length - 1];
    parts.push(
      `<text class="threshold-label" x="${xToPx(lastP.hours / 24) + 6}" y="${yToPx(lastP.photo) + 3}">Photo</text>`,
      `<text class="threshold-label" x="${xToPx(lastP.hours / 24) + 6}" y="${yToPx(lastP.exch) + 3}">Exchange</text>`,
    );
  } else {
    parts.push(
      `<text class="empty-hint" x="${pad.l + plotW / 2}" y="${pad.t + plotH / 2}">Choose a gestation to show threshold lines</text>`,
    );
  }

  // Reading connector + dots
  if (previous && current) {
    parts.push(
      `<path class="reading-connector" d="M${xToPx(clamp(previous.ageDays, 0, X_MAX_DAYS))},${yToPx(clamp(previous.sbr, y0, y1))} L${xToPx(clamp(current.ageDays, 0, X_MAX_DAYS))},${yToPx(clamp(current.sbr, y0, y1))}" />`,
    );
  }
  if (previous) {
    parts.push(
      `<circle class="reading-dot prev" cx="${xToPx(clamp(previous.ageDays, 0, X_MAX_DAYS))}" cy="${yToPx(clamp(previous.sbr, y0, y1))}" r="5" />`,
    );
  }
  if (current) {
    parts.push(
      `<circle class="reading-dot" cx="${xToPx(clamp(current.ageDays, 0, X_MAX_DAYS))}" cy="${yToPx(clamp(current.sbr, y0, y1))}" r="5.5" />`,
    );
  }

  svg.innerHTML = parts.join('');
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function renderFooter() {
  $('#footer-meta').textContent =
    `v${APP_VERSION} · Thresholds reviewed against NICE CG98 on ${THRESHOLDS_REVIEWED}.`;
}

// ──────────────── boot ────────────────
buildGestationPicker();
bindInputs();
renderFooter();
render();
