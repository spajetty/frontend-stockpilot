import { cx } from '../lib/cx';

interface ProgressStepsProps {
  steps: string[];
  current: number; // 0-based index of the active step
}

export default function ProgressSteps({ steps, current }: ProgressStepsProps) {
  const percent = ((current + 1) / steps.length) * 100;

  return (
    <div>
      <div
        role="progressbar"
        aria-label="Setup progress"
        aria-valuemin={0}
        aria-valuemax={steps.length}
        aria-valuenow={current + 1}
        className="h-2 overflow-hidden rounded-full bg-slate-200"
      >
        <div className="h-full rounded-full bg-brand transition-all duration-500" style={{ width: `${percent}%` }} />
      </div>

      <ol className="mt-4 flex gap-6">
        {steps.map((label, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <li key={label} className="flex items-center gap-2" aria-current={active ? 'step' : undefined}>
              <span
                className={cx(
                  'grid size-6 place-items-center rounded-full text-xs font-semibold',
                  done && 'bg-brand text-white',
                  active && 'border-2 border-brand text-brand',
                  !done && !active && 'border border-slate-300 text-slate-400',
                )}
              >
                {done ? <i className="ri-check-line" aria-hidden="true" /> : i + 1}
              </span>
              <span className={cx('text-sm font-medium', active ? 'text-slate-900' : 'text-slate-500')}>{label}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}