import { useState } from 'react';
import ReadingInput from './ReadingInput';

type Props = {
  sampledAt: string;
  sbr: string;
  onSampledAtChange: (value: string) => void;
  onSbrChange: (value: string) => void;
  sampledAtError?: string;
  sbrError?: string;
};

export default function PreviousReadingSection(props: Props) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-md border border-slate-200 bg-white">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-[44px] w-full items-center justify-between rounded-md px-4 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
      >
        <span>Add previous reading for rate of rise</span>
        <span aria-hidden="true" className="text-slate-500">
          {open ? '▾' : '▸'}
        </span>
      </button>
      {open && (
        <div className="border-t border-slate-200 px-4 py-4">
          <ReadingInput
            idPrefix="previous"
            title="Previous sample"
            {...props}
          />
        </div>
      )}
    </div>
  );
}
