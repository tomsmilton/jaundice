import type { Derived } from '../lib/derive';
import { formatAge, formatDistance, formatRateOfRise } from '../lib/derive';

type Props = {
  sbr: number;
  derived: Derived;
  hasPrevious: boolean;
  ageOverChartNote?: string;
  shortIntervalNote?: string;
};

export default function ReadoutPanel({
  sbr,
  derived,
  hasPrevious,
  ageOverChartNote,
  shortIntervalNote,
}: Props) {
  return (
    <section
      aria-label="Threshold readouts"
      className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
    >
      <p className="text-lg font-semibold text-slate-900 sm:text-xl">
        SBR {Math.round(sbr)} μmol/L at {formatAge(derived.ageHours)} of age
      </p>
      <dl className="mt-3 space-y-2 text-base sm:text-lg">
        <Row label="Phototherapy" value={formatDistance(derived.distanceToPhoto)} />
        <Row label="Exchange" value={formatDistance(derived.distanceToExchange)} />
        {hasPrevious && (
          <Row label="Rate of rise" value={formatRateOfRise(derived.rateOfRise)} />
        )}
      </dl>
      {ageOverChartNote && (
        <p className="mt-3 text-sm text-slate-600" role="note">
          {ageOverChartNote}
        </p>
      )}
      {hasPrevious && shortIntervalNote && (
        <p className="mt-2 text-sm text-slate-600" role="note">
          {shortIntervalNote}
        </p>
      )}
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="font-medium text-slate-600">{label}</dt>
      <dd className="font-mono tabular-nums text-slate-900">{value}</dd>
    </div>
  );
}
