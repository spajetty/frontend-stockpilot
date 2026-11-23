import { useState } from 'react';
import { cx } from '../../lib/cx';
import type { ProductListItem, ProductStatusName } from '../../api/productsApi';

const STATUS_STYLES: Record<ProductStatusName, string> = {
  Active: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  Inactive: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  Pending: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  Rejected: 'bg-rose-50 text-rose-700 ring-rose-600/20',
};

const STATUS_LABELS: Record<ProductStatusName, string> = {
  Active: 'Active',
  Inactive: 'Inactive',
  Pending: 'Pending approval',
  Rejected: 'Rejected',
};

export function StatusBadge({ status, availableInPos = true }: { status: ProductStatusName; availableInPos?: boolean }) {
  return (
    <div>
      <span
        className={cx(
          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset',
          STATUS_STYLES[status],
        )}
      >
        {STATUS_LABELS[status]}
      </span>
      {status === 'Active' && !availableInPos && <p className="mt-1 text-xs text-slate-400">Not in POS</p>}
    </div>
  );
}

interface ThumbProps {
  url: string | null;
  name: string;
  size?: 'sm' | 'lg';
}

export function ProductThumb({ url, name, size = 'sm' }: ThumbProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const broken = !url || failedUrl === url;

  return (
    <div
      className={cx(
        'grid shrink-0 place-items-center overflow-hidden bg-slate-100 text-slate-400',
        size === 'sm' ? 'size-11 rounded-lg text-xl' : 'size-32 rounded-xl text-4xl',
      )}
    >
      {broken ? (
        <i className="ri-image-line" aria-hidden="true" />
      ) : (
        <img
          src={url}
          alt={name}
          loading="lazy"
          onError={() => setFailedUrl(url)}
          className="size-full object-cover"
        />
      )}
    </div>
  );
}

interface StockCellProps {
  item: ProductListItem;
  // Only meaningful for one store. With "All stores" the reorder level is just the default.
  showLow: boolean;
}

export function StockCell({ item, showLow }: StockCellProps) {
  if (item.status === 'Pending' || item.status === 'Rejected') {
    return (
      <div className="text-right">
        <p className="font-semibold text-slate-900">{item.pendingOpeningStock}</p>
        <p className="text-xs text-slate-400">opening stock</p>
      </div>
    );
  }

  const out = showLow && item.stock <= 0;
  const low = showLow && !out && item.stock <= item.reorderLevel;

  return (
    <div className="text-right">
      <p className={cx('font-semibold', out ? 'text-rose-600' : low ? 'text-amber-600' : 'text-slate-900')}>
        {item.stock}
      </p>
      <p className="text-xs text-slate-400">
        {out ? 'out of stock' : low ? `low · reorder ${item.reorderLevel}` : `reorder ${item.reorderLevel}`}
      </p>
    </div>
  );
}
