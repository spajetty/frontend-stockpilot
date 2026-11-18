import { cx } from '../../lib/cx';
import { spaceCamel } from '../../lib/format';
import type { PaymentMethodName } from '../../api/posApi';
import type { PaymentStatusName, SaleStatusName } from '../../api/salesApi';

const methodStyle: Record<PaymentMethodName, string> = {
  Cash: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  Card: 'border-sky-200 bg-sky-50 text-sky-700',
  PayPal: 'border-indigo-200 bg-indigo-50 text-indigo-700',
};

const statusStyle: Record<SaleStatusName, string> = {
  Completed: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  PartiallyRefunded: 'border-amber-200 bg-amber-50 text-amber-700',
  Refunded: 'border-rose-200 bg-rose-50 text-rose-700',
  Voided: 'border-slate-200 bg-slate-100 text-slate-600',
};

const statusLabel: Record<SaleStatusName, string> = {
  Completed: 'Completed',
  PartiallyRefunded: 'Part refunded',
  Refunded: 'Refunded',
  Voided: 'Voided',
};

export function PaymentBadge({ method, status }: { method: PaymentMethodName; status: PaymentStatusName }) {
  return (
    <div>
      <span className={cx('inline-block rounded-full border px-3 py-0.5 text-xs font-semibold', methodStyle[method])}>
        {method}
      </span>
      <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-slate-400">
        {spaceCamel(status)}
      </p>
    </div>
  );
}

export function StatusBadge({ status }: { status: SaleStatusName }) {
  return (
    <span className={cx('inline-block rounded-full border px-3 py-0.5 text-xs font-semibold', statusStyle[status])}>
      {statusLabel[status]}
    </span>
  );
}