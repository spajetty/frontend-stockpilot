import { useEffect, useState } from 'react';
import { Button, Select } from '../../components';
import type { SelectOption } from '../../components';
import { useAuth } from '../../auth/AuthContext';
import { cx } from '../../lib/cx';
import { formatPeso } from '../../lib/format';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useStores } from '../../stores/StoreContext';
import { PRODUCTS_PAGE_SIZE, downloadProductsCsv } from '../../api/productsApi';
import type { ProductSort, ProductStatusFilter } from '../../api/productsApi';
import { useCategories, usePendingProducts, useProducts } from '../../hooks/useProducts';
import { ProductThumb, StatusBadge, StockCell } from './ProductBadges';
import ProductDetailsModal from './ProductDetailsModal';
import ProductFormModal from './ProductFormModal';
import type { FormTarget } from './ProductFormModal';
import ProductStatusModal from './ProductStatusModal';
import type { StatusTarget } from './ProductStatusModal';
import ApprovalsModal from './ApprovalsModal';

const SORT_OPTIONS: SelectOption[] = [
  { value: 'name_asc', label: 'Name (A–Z)' },
  { value: 'name_desc', label: 'Name (Z–A)' },
  { value: 'price_asc', label: 'Price (low to high)' },
  { value: 'price_desc', label: 'Price (high to low)' },
  { value: 'newest', label: 'Newest first' },
];

const BASE_STATUS_OPTIONS: SelectOption[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

const REVIEW_STATUS_OPTIONS: SelectOption[] = [
  { value: 'pending', label: 'Pending approval' },
  { value: 'rejected', label: 'Rejected' },
];

const th = 'px-4 py-3 font-semibold uppercase tracking-wide text-slate-500';

export default function ProductsPage() {
  const { user } = useAuth();
  const { activeStore } = useStores();
  const isOwner = user?.role === 'Owner';
  const canManage = isOwner || user?.role === 'Manager';

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const search = useDebouncedValue(searchInput.trim(), 300);
  const [categoryId, setCategoryId] = useState('all');
  const [status, setStatus] = useState<ProductStatusFilter>('all');
  const [sort, setSort] = useState<ProductSort>('name_asc');

  const [viewId, setViewId] = useState<number | null>(null);
  const [form, setForm] = useState<FormTarget | null>(null);
  const [statusTarget, setStatusTarget] = useState<StatusTarget | null>(null);
  const [approvalsOpen, setApprovalsOpen] = useState(false);

  const [notice, setNotice] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const catId = categoryId === 'all' ? null : Number(categoryId);
  const { data, isLoading, isError, isFetching, refetch } = useProducts({
    page,
    search,
    categoryId: catId,
    status,
    sort,
  });
  const { data: categories = [] } = useCategories();
  const { data: pending } = usePendingProducts(isOwner);
  const pendingCount = pending?.totalCount ?? 0;

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 6000);
    return () => clearTimeout(t);
  }, [notice]);

  const products = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const from = totalCount === 0 ? 0 : (page - 1) * PRODUCTS_PAGE_SIZE + 1;
  const to = Math.min(page * PRODUCTS_PAGE_SIZE, totalCount);

  // Low-stock warnings only make sense for one store's stock
  const showLow = activeStore !== null;

  const categoryOptions: SelectOption[] = [
    { value: 'all', label: 'All categories' },
    ...categories.map((c) => ({ value: String(c.id), label: c.name })),
  ];
  const statusOptions = canManage ? [...BASE_STATUS_OPTIONS, ...REVIEW_STATUS_OPTIONS] : BASE_STATUS_OPTIONS;

  const onExport = async () => {
    setExporting(true);
    setExportError(null);
    try {
      await downloadProductsCsv({ search, categoryId: catId, status, sort });
    } catch (e) {
      setExportError(e instanceof Error ? e.message : "Couldn't export products.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div>
      <p className="text-sm text-slate-500">
        Workspace <span className="mx-1.5 text-slate-300">&rsaquo;</span>
        <span className="text-slate-900">Products</span>
      </p>

      <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Products</h1>
          <p className="mt-1 text-slate-500">
            Searchable catalogue with pricing, stock levels, and margin visibility. SKUs must stay unique.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {isOwner && (
            <Button
              variant="secondary"
              fullWidth={false}
              icon="ri-shield-check-line"
              onClick={() => setApprovalsOpen(true)}
            >
              {pendingCount > 0 ? `Approvals (${pendingCount})` : 'Approvals'}
            </Button>
          )}
          <Button
            variant="secondary"
            fullWidth={false}
            icon="ri-download-2-line"
            loading={exporting}
            loadingText="Exporting…"
            onClick={() => void onExport()}
          >
            Export CSV
          </Button>
          {canManage && (
            <Button variant="primary" fullWidth={false} icon="ri-add-line" onClick={() => setForm({ mode: 'create' })}>
              New product
            </Button>
          )}
        </div>
      </div>

      {notice && (
        <p role="status" className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {notice}
        </p>
      )}
      {exportError && (
        <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {exportError}
        </p>
      )}

      {/* Filters */}
      <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 lg:flex-row lg:items-end">
        <div className="lg:w-[34%]">
          <label htmlFor="products-search" className="mb-1.5 block text-sm font-medium text-slate-700">
            Search
          </label>
          <div className="relative">
            <i
              className="ri-search-line pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-lg text-slate-400"
              aria-hidden="true"
            />
            <input
              id="products-search"
              type="search"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setPage(1);
              }}
              placeholder="Search name, SKU or barcode…"
              className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition-colors duration-200 placeholder:text-slate-400 hover:border-slate-300 focus:border-brand focus:ring-4 focus:ring-brand/15"
            />
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-4 sm:flex-row">
          <Select
            label="Category"
            className="min-w-0 flex-1"
            value={categoryId}
            options={categoryOptions}
            onChange={(v) => {
              setCategoryId(v);
              setPage(1);
            }}
          />
          <Select
            label="Status"
            className="min-w-0 flex-1"
            value={status}
            options={statusOptions}
            onChange={(v) => {
              setStatus(v as ProductStatusFilter);
              setPage(1);
            }}
          />
          <Select
            label="Sort by"
            className="min-w-0 flex-1"
            value={sort}
            options={SORT_OPTIONS}
            onChange={(v) => {
              setSort(v as ProductSort);
              setPage(1);
            }}
          />
        </div>

        <p className="whitespace-nowrap pb-2.5 text-sm text-slate-500 lg:pl-2">
          {totalCount} {totalCount === 1 ? 'product' : 'products'}
        </p>
      </div>

      {/* Table */}
      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className={cx('overflow-x-auto transition-opacity', isFetching && !isLoading && 'opacity-60')}>
          <table className="w-full min-w-[1000px] text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs">
              <tr>
                <th className={cx(th, 'text-left')}>Product</th>
                <th className={cx(th, 'text-left')}>SKU / Barcode</th>
                <th className={cx(th, 'text-left')}>Category</th>
                <th className={cx(th, 'text-right')}>Cost</th>
                <th className={cx(th, 'text-right')}>Price</th>
                <th className={cx(th, 'text-right')}>Margin</th>
                <th className={cx(th, 'text-right')}>Stock</th>
                <th className={cx(th, 'text-left')}>Status</th>
                <th className={cx(th, 'text-right')}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading && (
                <tr>
                  <td colSpan={9} className="px-4 py-14 text-center text-slate-500">
                    <i className="ri-loader-4-line mr-2 animate-spin" aria-hidden="true" />
                    Loading products…
                  </td>
                </tr>
              )}

              {isError && (
                <tr>
                  <td colSpan={9} className="px-4 py-14 text-center">
                    <p className="text-rose-600">Couldn't load products.</p>
                    <Button variant="secondary" fullWidth={false} className="mx-auto mt-3" onClick={() => refetch()}>
                      Retry
                    </Button>
                  </td>
                </tr>
              )}

              {!isLoading && !isError && products.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-14 text-center text-slate-500">
                    No products match these filters.
                  </td>
                </tr>
              )}

              {products.map((p) => {
                const approved = p.status === 'Active' || p.status === 'Inactive';
                return (
                  <tr key={p.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <ProductThumb url={p.imageUrl} name={p.name} />
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-900">{p.name}</p>
                          <p className="truncate text-xs text-slate-500">{p.supplierName ?? 'No supplier'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">{p.sku}</p>
                      <p className="text-xs text-slate-500">{p.barcode ?? '—'}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{p.categoryName ?? '—'}</td>
                    <td className="px-4 py-3 text-right text-slate-700">{formatPeso(p.costPrice)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">{formatPeso(p.sellingPrice)}</td>
                    <td
                      className={cx(
                        'px-4 py-3 text-right font-medium',
                        p.margin >= 30 ? 'text-emerald-600' : 'text-slate-600',
                      )}
                    >
                      {p.margin.toFixed(1)}%
                    </td>
                    <td className="px-4 py-3">
                      <StockCell item={p} showLow={showLow} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={p.status} availableInPos={p.availableInPos} />
                      {p.requestedByStoreName && <p className="mt-1 text-xs text-slate-400">{p.requestedByStoreName}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="view" onClick={() => setViewId(p.id)}>
                          View product
                        </Button>
                        {canManage && (
                          <Button variant="edit" onClick={() => setForm({ mode: 'edit', id: p.id })}>
                            Edit product
                          </Button>
                        )}
                        {canManage && approved && p.status === 'Active' && (
                          <Button
                            variant="deleteicon"
                            icon="ri-eye-off-line"
                            onClick={() => setStatusTarget({ product: p, action: 'deactivate' })}
                          >
                            Deactivate product
                          </Button>
                        )}
                        {canManage && approved && p.status === 'Inactive' && (
                          <Button
                            variant="edit"
                            icon="ri-arrow-go-back-line"
                            onClick={() => setStatusTarget({ product: p, action: 'reactivate' })}
                          >
                            Reactivate product
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
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
              onClick={() => setPage((n) => n - 1)}
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
              onClick={() => setPage((n) => n + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      <ProductDetailsModal
        productId={viewId}
        onClose={() => setViewId(null)}
        onEdit={(id) => {
          setViewId(null);
          setForm({ mode: 'edit', id });
        }}
      />
      <ProductFormModal target={form} onClose={() => setForm(null)} onSaved={setNotice} />
      <ProductStatusModal target={statusTarget} onClose={() => setStatusTarget(null)} onDone={setNotice} />
      {isOwner && <ApprovalsModal open={approvalsOpen} onClose={() => setApprovalsOpen(false)} onDone={setNotice} />}
    </div>
  );
}