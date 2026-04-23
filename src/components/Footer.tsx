import { APP_VERSION, THRESHOLDS_REVIEWED } from '../lib/about';

export default function Footer() {
  return (
    <footer className="mt-8 border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-5xl px-4 py-4 text-xs text-slate-600">
        <p>
          This tool is for reference by qualified clinicians only. It is not a medical
          device and must not be the sole basis for clinical decisions. Thresholds are
          derived from NICE CG98 (published 2010, last updated October 2023). Bilirubin
          assays vary between manufacturers; consult your local pathology laboratory
          when interpreting thresholds.
        </p>
        <p className="mt-2 text-slate-500">
          v{APP_VERSION} · Thresholds reviewed against NICE CG98 on {THRESHOLDS_REVIEWED}.
        </p>
      </div>
    </footer>
  );
}
