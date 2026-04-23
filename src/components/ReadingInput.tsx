import DateTimeField from './DateTimeField';

type Props = {
  idPrefix: string;
  title: string;
  sampledAt: string;
  sbr: string;
  onSampledAtChange: (value: string) => void;
  onSbrChange: (value: string) => void;
  sampledAtError?: string;
  sbrError?: string;
};

export default function ReadingInput({
  idPrefix,
  title,
  sampledAt,
  sbr,
  onSampledAtChange,
  onSbrChange,
  sampledAtError,
  sbrError,
}: Props) {
  const sbrId = `${idPrefix}-sbr`;
  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-semibold text-slate-800">{title}</legend>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <DateTimeField
          id={`${idPrefix}-sampled-at`}
          label="Sample date and time"
          value={sampledAt}
          onChange={onSampledAtChange}
          error={sampledAtError}
        />
        <div>
          <label htmlFor={sbrId} className="mb-1 block text-sm font-medium text-slate-700">
            Serum bilirubin (μmol/L)
          </label>
          <input
            id={sbrId}
            type="number"
            inputMode="decimal"
            step="any"
            min="0"
            value={sbr}
            autoComplete="off"
            onChange={(e) => onSbrChange(e.target.value)}
            aria-invalid={sbrError ? true : undefined}
            aria-describedby={sbrError ? `${sbrId}-error` : undefined}
            className={
              'block min-h-[44px] w-full rounded-md border bg-white px-3 py-2 text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500 ' +
              (sbrError ? 'border-red-500' : 'border-slate-300')
            }
          />
          {sbrError && (
            <p id={`${sbrId}-error`} role="alert" className="mt-1 text-sm text-red-600">
              {sbrError}
            </p>
          )}
        </div>
      </div>
    </fieldset>
  );
}
