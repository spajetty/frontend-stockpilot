import { useState } from 'react';
import { Button, Select } from '../../components';
import type { SelectOption } from '../../components';
import { useAuth } from '../../auth/AuthContext';
import { cx } from '../../lib/cx';
import { formatDate, formatPeso, formatTime } from '../../lib/format';
import { SALES_PAGE_SIZE } from '../../api/salesApi';
import type { PaymentFilter, SortBy, SortDir, StatusFilter } from '../../api/salesApi';
import { useSales } from '../../hooks/useSales';
import { PaymentBadge, StatusBadge } from './SaleBadges';
import SaleDetailsModal from './SaleDetailsModal';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';

const PAYMENT_OPTIONS: SelectOption[] = [
  { value: 'all', label: 'All payments' },
  { value: 'Cash', label: 'Cash' },
  { value: 'Card', label: 'Card' },
  { value: 'PayPal', label: 'PayPal' },
];

const STATUS_OPTIONS: SelectOption[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'completed', label: 'Completed' },
  { value: 'partiallyrefunded', label: 'Part refunded' },
  { value: 'refunded', label: 'Refunded' },
  { value: 'voided', label: 'Voided' },
];

interface SortHeaderProps {
  label: string;
  col: SortBy;
  sortBy: SortBy;
  sortDir: SortDir;
  onSort: (col: SortBy) => void;
  align?: 'left' | 'right';
}

function SortHeader({ label, col, sortBy, sortDir, onSort, align = 'left' }: SortHeaderProps) {
  const active = sortBy === col;
  const icon = !active
    ? 'ri-expand-up-down-line'
    : sortDir === 'asc'
      ? 'ri-arrow-up-s-line'
      : 'ri-arrow-down-s-line';

  return (
    <th
      aria-sort={active ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
      className={cx('px-4 py-3 font-semibold', align === 'right' ? 'text-right' : 'text-left')}
    >
      <button
        type="button"
        onClick={() => onSort(col)}
        className={cx(
          'inline-flex cursor-pointer items-center gap-1 uppercase tracking-wide transition-colors hover:text-brand',
          active ? 'text-brand' : 'text-slate-500',
        )}
      >
        {label}
        <i className={cx(icon, active ? 'text-brand' : 'text-slate-400')} aria-hidden="true" />
      </button>
    </th>
  );
}

const th = 'px-4 py-3 font-semibold uppercase tracking-wide text-slate-500';

export default function SalesPage() {
  const { user } = useAuth();
  const canSeeReports = user?.role === 'Owner';
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc'); 
  const [payment, setPayment] = useState<PaymentFilter>('all');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [searchInput, setSearchInput] = useState('');
  const search = useDebouncedValue(searchInput.trim(), 300);
  const [viewId, setViewId] = useState<number | null>(null);
  const [tab, setTab] = useState<'transactions' | 'reports'>('transactions');

  const { data, isLoading, isError, isFetching, refetch } = useSales({ page, sortBy, sortDir, payment, status, search });
  
  const onSort = (col: SortBy) => {
    if (col === sortBy) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortBy(col);
      setSortDir('desc'); // latest date / highest total first
    }
    setPage(1);
  };

  const sales = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const from = totalCount === 0 ? 0 : (page - 1) * SALES_PAGE_SIZE + 1;
  const to = Math.min(page * SALES_PAGE_SIZE, totalCount);
  const isCashier = user?.role === 'Cashier';

  return (
    <div>
      <p className="text-sm text-slate-500">
        Workspace <span className="mx-1.5 text-slate-300">&rsaquo;</span>
        <span className="text-slate-900">Sales</span>
      </p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
        {canSeeReports ? 'Sales & Reports' : 'Sales'}
      </h1>
      <p className="mt-1 text-slate-500">
        {isCashier ? 'Your own sales history.' : 'Sales history for this store.'}
      </p>

      {canSeeReports && (
        <div className="mt-6 inline-flex rounded-xl bg-slate-100 p-1">
          {(['transactions', 'reports'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cx(
                'cursor-pointer rounded-lg px-4 py-1.5 text-sm font-semibold capitalize',
                tab === t ? 'bg-white text-brand shadow-sm' : 'text-slate-500 hover:text-slate-700',
              )}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {canSeeReports && tab === 'reports' ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center text-slate-500">
          Reports coming soon
        </div>
      ) : (
        <>
          {/* Filters */}
          <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 lg:flex-row lg:items-end">
            <div className="lg:w-[65%]">
              <label htmlFor="sales-search" className="mb-1.5 block text-sm font-medium text-slate-700">
                Search
              </label>
              <div className="relative">
                <i
                  className="ri-search-line pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-lg text-slate-400"
                  aria-hidden="true"
                />
                <input
                  id="sales-search"
                  type="search"
                  value={searchInput}
                  onChange={(e) => {
                    setSearchInput(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search sale no., cashier, product, SKU or amount"
                  className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition-colors duration-200 placeholder:text-slate-400 hover:border-slate-300 focus:border-brand focus:ring-4 focus:ring-brand/15"
                />
              </div>
            </div>

            <div className="flex flex-1 gap-4">
              <Select
                label="Payment"
                className="min-w-0 flex-1"
                value={payment}
                options={PAYMENT_OPTIONS}
                onChange={(v) => {
                  setPayment(v as PaymentFilter);
                  setPage(1);
                }}
              />
              <Select
                label="Status"
                className="min-w-0 flex-1"
                value={status}
                options={STATUS_OPTIONS}
                onChange={(v) => {
                  setStatus(v as StatusFilter);
                  setPage(1);
                }}
              />
            </div>
          </div>

          {/* Table */}
          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className={cx('overflow-x-auto transition-opacity', isFetching && !isLoading && 'opacity-60')}>
              <table className="w-full min-w-[900px] text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs">
                  <tr>
                    <th className={cx(th, 'text-left')}>Sale</th>
                    <SortHeader label="Date" col="date" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
                    <th className={cx(th, 'text-left')}>Cashier</th>
                    <th className={cx(th, 'text-right')}>Items</th>
                    <th className={cx(th, 'text-right')}>Subtotal</th>
                    <SortHeader label="Total" col="total" sortBy={sortBy} sortDir={sortDir} onSort={onSort} align="right" />
                    <th className={cx(th, 'text-left')}>Payment</th>
                    <th className={cx(th, 'text-left')}>Status</th>
                    <th className={cx(th, 'text-right')}>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading && (
                    <tr>
                      <td colSpan={9} className="px-4 py-14 text-center text-slate-500">
                        <i className="ri-loader-4-line mr-2 animate-spin" aria-hidden="true" />
                        Loading sales…
                      </td>
                    </tr>
                  )}

                  {isError && (
                    <tr>
                      <td colSpan={9} className="px-4 py-14 text-center">
                        <p className="text-rose-600">Couldn't load sales.</p>
                        <Button variant="secondary" fullWidth={false} className="mx-auto mt-3" onClick={() => refetch()}>
                          Retry
                        </Button>
                      </td>
                    </tr>
                  )}

                  {!isLoading && !isError && sales.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-4 py-14 text-center text-slate-500">
                        No sales found.
                      </td>
                    </tr>
                  )}

                  {sales.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-4 font-semibold text-slate-900">{s.saleNumber}</td>
                      <td className="px-4 py-4">
                        <p className="text-slate-900">{formatDate(s.createdAt)}</p>
                        <p className="text-xs text-slate-500">{formatTime(s.createdAt)}</p>
                      </td>
                      <td className="px-4 py-4 text-slate-700">{s.cashierName}</td>
                      <td className="px-4 py-4 text-right text-slate-700">{s.items}</td>
                      <td className="px-4 py-4 text-right text-slate-700">{formatPeso(s.subtotal)}</td>
                      <td className="px-4 py-4 text-right font-semibold text-slate-900">{formatPeso(s.total)}</td>
                      <td className="px-4 py-4">
                        <PaymentBadge method={s.paymentMethod} status={s.paymentStatus} />
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={s.status} />
                      </td>
                      <td className="px-4 py-4 text-right">
                        <Button variant="view" className="ml-auto" onClick={() => setViewId(s.id)}>
                          View sale
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm text-slate-500">
              <p>
                Showing <span className="font-semibold text-slate-900">{from}–{to}</span> of {totalCount}
              </p>
              <div className="flex items-center gap-3">
                <Button
                  variant="secondary"
                  fullWidth={false}
                  icon="ri-arrow-left-s-line"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Prev
                </Button>
                <span className="font-semibold text-slate-900">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="secondary"
                  fullWidth={false}
                  icon="ri-arrow-right-s-line"
                  iconPosition="right"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      <SaleDetailsModal saleId={viewId} onClose={() => setViewId(null)} />
    </div>
  );
}