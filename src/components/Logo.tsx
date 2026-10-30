import { cx } from '../lib/cx';

interface LogoProps {
  onDark?: boolean;
  size?: 'sm' | 'lg';
  tagline?: string;
}

export default function Logo({ onDark = false, size = 'sm', tagline }: LogoProps) {
  const large = size === 'lg';
  return (
    <div className="flex items-center gap-3">
      <div
        className={cx(
          'grid place-items-center',
          large ? 'size-14 rounded-2xl text-3xl' : 'size-9 rounded-lg text-xl',
          onDark ? 'bg-white text-brand' : 'bg-brand text-white',
        )}
      >
        <i className="ri-store-2-line" aria-hidden="true" />
      </div>
      <div>
        <p className={cx('font-semibold leading-tight', large ? 'text-xl' : 'text-base', onDark ? 'text-white' : 'text-slate-900')}>
          StockPilot
        </p>
        {tagline && <p className="text-[13px] uppercase tracking-[0.2em] text-indigo-300">{tagline}</p>}
      </div>
    </div>
  );
}