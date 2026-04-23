type Props = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
};

export default function DateTimeField({ id, label, value, onChange, error }: Props) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        id={id}
        type="datetime-local"
        value={value}
        autoComplete="off"
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={
          'block min-h-[44px] w-full rounded-md border bg-white px-3 py-2 text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500 ' +
          (error ? 'border-red-500' : 'border-slate-300')
        }
      />
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
