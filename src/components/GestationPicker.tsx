import type { Gestation } from '../lib/thresholds';

const OPTIONS: Gestation[] = [
  23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, '>=38',
];

type Props = {
  value: Gestation | null;
  onChange: (value: Gestation) => void;
};

export default function GestationPicker({ value, onChange }: Props) {
  return (
    <fieldset>
      <legend className="mb-2 block text-sm font-medium text-slate-700">
        Gestational age (weeks)
      </legend>
      <div
        role="radiogroup"
        aria-label="Gestational age in weeks"
        className="grid grid-cols-4 gap-1.5 sm:grid-cols-8"
      >
        {OPTIONS.map((opt) => {
          const selected = value === opt;
          const label = opt === '>=38' ? '≥38' : String(opt);
          return (
            <button
              key={String(opt)}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(opt)}
              className={
                'min-h-[44px] rounded-md border px-2 text-sm font-medium transition-colors ' +
                (selected
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-300 bg-white text-slate-700 hover:border-slate-500 hover:bg-slate-50')
              }
            >
              {label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
