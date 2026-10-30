import type { ReactNode } from 'react';
import { cx } from '../lib/cx';

type AlertVariant = 'error' | 'warning' | 'success' | 'info';

interface AlertProps {
  variant?: AlertVariant;
  children: ReactNode;
  className?: string;
}

const styles: Record<AlertVariant, { box: string; icon: string }> = {
  error: { box: 'border-red-200 bg-red-50 text-red-700', icon: 'ri-error-warning-line' },
  warning: { box: 'border-amber-200 bg-amber-50 text-amber-800', icon: 'ri-alert-line' },
  success: { box: 'border-emerald-200 bg-emerald-50 text-emerald-800', icon: 'ri-checkbox-circle-line' },
  info: { box: 'border-sky-200 bg-sky-50 text-sky-800', icon: 'ri-information-line' },
};

export default function Alert({ variant = 'info', children, className }: AlertProps) {
  const s = styles[variant];
  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={cx('flex items-start gap-2 rounded-lg border px-4 py-3 text-sm', s.box, className)}
    >
      <i className={cx(s.icon, 'mt-0.5 shrink-0')} aria-hidden="true" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}