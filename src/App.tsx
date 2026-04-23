import { useMemo, useState } from 'react';
import GestationPicker from './components/GestationPicker';
import DateTimeField from './components/DateTimeField';
import ReadingInput from './components/ReadingInput';
import PreviousReadingSection from './components/PreviousReadingSection';
import ThresholdChart from './components/ThresholdChart';
import ReadoutPanel from './components/ReadoutPanel';
import Footer from './components/Footer';
import { derive, type Reading } from './lib/derive';
import { parseDateTime, parseSbr, validate } from './lib/validation';
import type { Gestation } from './lib/thresholds';

export default function App() {
  const [gestation, setGestation] = useState<Gestation | null>(null);
  const [dobRaw, setDobRaw] = useState('');
  const [currentAtRaw, setCurrentAtRaw] = useState('');
  const [currentSbrRaw, setCurrentSbrRaw] = useState('');
  const [previousAtRaw, setPreviousAtRaw] = useState('');
  const [previousSbrRaw, setPreviousSbrRaw] = useState('');

  const parsed = useMemo(() => {
    const dob = parseDateTime(dobRaw);
    const currentSampledAt = parseDateTime(currentAtRaw);
    const currentSbrParsed = parseSbr(currentSbrRaw);
    const previousSampledAt = parseDateTime(previousAtRaw);
    const previousSbrParsed = parseSbr(previousSbrRaw);

    const current: Reading | null =
      currentSampledAt && currentSbrParsed.value !== null
        ? { sampledAt: currentSampledAt, sbrUmolL: currentSbrParsed.value }
        : null;

    const previous: Reading | null =
      previousSampledAt && previousSbrParsed.value !== null
        ? { sampledAt: previousSampledAt, sbrUmolL: previousSbrParsed.value }
        : null;

    return {
      dob,
      current,
      previous,
      currentSbrError: currentSbrParsed.error,
      previousSbrError: previousSbrParsed.error,
    };
  }, [dobRaw, currentAtRaw, currentSbrRaw, previousAtRaw, previousSbrRaw]);

  const { errors, notes } = useMemo(
    () => validate(parsed.dob, parsed.current, parsed.previous),
    [parsed.dob, parsed.current, parsed.previous],
  );

  const canDerive =
    gestation !== null &&
    parsed.dob !== null &&
    parsed.current !== null &&
    !errors.currentSampleAt;

  const derived = canDerive
    ? derive(gestation!, parsed.dob!, parsed.current!, parsed.previous && !errors.previousSampleAt ? parsed.previous : null)
    : null;

  const currentChartPoint =
    canDerive && parsed.current
      ? {
          ageDays: Math.max(0, Math.min(14, derived!.ageHours / 24)),
          sbr: parsed.current.sbrUmolL,
        }
      : null;

  const previousChartPoint =
    parsed.dob && parsed.previous && !errors.previousSampleAt
      ? {
          ageDays: Math.max(
            0,
            Math.min(
              14,
              (parsed.previous.sampledAt.getTime() - parsed.dob.getTime()) / 3_600_000 / 24,
            ),
          ),
          sbr: parsed.previous.sbrUmolL,
        }
      : null;

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-3">
          <h1 className="text-lg font-semibold text-slate-900 sm:text-xl">
            Neonatal Bilirubin Threshold Calculator
          </h1>
          <p className="text-xs text-slate-500">NICE CG98 · μmol/L</p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-4">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="space-y-5" aria-label="Inputs">
            <GestationPicker value={gestation} onChange={setGestation} />

            <DateTimeField
              id="dob"
              label="Date and time of birth"
              value={dobRaw}
              onChange={setDobRaw}
            />

            <ReadingInput
              idPrefix="current"
              title="Current sample"
              sampledAt={currentAtRaw}
              sbr={currentSbrRaw}
              onSampledAtChange={setCurrentAtRaw}
              onSbrChange={setCurrentSbrRaw}
              sampledAtError={errors.currentSampleAt}
              sbrError={parsed.currentSbrError}
            />

            <PreviousReadingSection
              sampledAt={previousAtRaw}
              sbr={previousSbrRaw}
              onSampledAtChange={setPreviousAtRaw}
              onSbrChange={setPreviousSbrRaw}
              sampledAtError={errors.previousSampleAt}
              sbrError={parsed.previousSbrError}
            />
          </section>

          <section className="space-y-4" aria-label="Chart and readouts">
            <ThresholdChart
              gestation={gestation}
              currentPoint={currentChartPoint}
              previousPoint={previousChartPoint}
            />
            {derived && parsed.current && (
              <ReadoutPanel
                sbr={parsed.current.sbrUmolL}
                derived={derived}
                hasPrevious={parsed.previous !== null && !errors.previousSampleAt}
                ageOverChartNote={notes.ageOverChart}
                shortIntervalNote={notes.shortInterval}
              />
            )}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
