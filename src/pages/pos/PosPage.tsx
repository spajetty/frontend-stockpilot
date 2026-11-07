import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { usePosCatalog } from '../../hooks/usePosCatalog';
import { useLiveStock } from '../../hooks/useLiveStock';
import { stockStatus } from '../../api/posApi';
import { CartPanel } from './CartPanel';
import { CheckoutModal } from './CheckoutModal';
import { ProductCard } from './ProductCard';
import { calcTotals } from './totals';
import { useCart } from './useCart';

export default function PosPage() {
  const { user } = useAuth();
  const storeId: number | null = user?.storeId ?? null;

  const { data, isLoading, isError, refetch, isFetching } = usePosCatalog(storeId);
  const live = useLiveStock(storeId);
  const cart = useCart();

  const [query, setQuery] = useState('');
  const deferred = useDeferredValue(query);
  const [categoryId, setCategoryId] = useState<number | 'all'>('all');
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const { clear } = cart;
  useEffect(() => { clear(); }, [storeId, clear]);

  const taxRate = data?.taxRate ?? 12;
  const totals = useMemo(() => calcTotals(cart.lines, cart.discount, taxRate), [cart.lines, cart.discount, taxRate]);

  const categoryName = useMemo(() => new Map(data?.categories.map((c) => [c.id, c.name])), [data]);
  const stockById = useMemo(() => new Map(data?.products.map((p) => [p.id, p.stock])), [data]);
  const hasOverStock = cart.lines.some((l) => l.qty > (stockById.get(l.productId) ?? 0));
  const canCharge = cart.lines.length > 0 && !hasOverStock && totals.total > 0;

  const visible = useMemo(() => {
    if (!data) return [];
    const q = deferred.trim().toLowerCase();
    return data.products.filter((p) =>
      (categoryId === 'all' || p.categoryId === categoryId) &&
      (!q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.barcode?.includes(q)));
  }, [data, deferred, categoryId]);

  const onScanEnter = () => {
    const code = query.trim().toLowerCase();
    const hit = data?.products.find((p) => p.barcode === query.trim() || p.sku.toLowerCase() === code);
    if (hit && stockStatus(hit) !== 'out') { cart.add(hit); setQuery(''); }
  };

  const finishSale = () => {
    cart.clear();
    setCheckoutOpen(false);
    searchRef.current?.focus();
  };

  if (storeId == null) return <p className="p-6 text-slate-500">Select a store to start selling.</p>;
  if (isLoading) return <p className="p-6 text-slate-500">Loading products…</p>;
  if (isError || !data)
    return (
      <div className="p-6">
        <p className="text-red-600">Couldn't load products.</p>
        <button className="mt-2 underline" onClick={() => refetch()}>Retry</button>
      </div>
    );

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <section>
        <div className="mb-4 flex items-center gap-3">
          <div className="relative flex-1">
            <i className="ri-search-line pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onScanEnter()}
              placeholder="Scan barcode or search name / SKU…"
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 outline-none focus:border-[#5b44d6]"
              autoFocus
            />
          </div>
          <span className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${live === 'live' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
            {live === 'live' ? 'Live' : live === 'offline' ? 'Offline' : 'Connecting…'}
            {isFetching && ' · syncing'}
          </span>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {[{ id: 'all' as const, name: 'All items' }, ...data.categories].map((c) => (
            <button
              key={c.id}
              onClick={() => setCategoryId(c.id)}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                categoryId === c.id
                  ? 'border-[#5b44d6] bg-[#5b44d6] text-white'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'}`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {visible.length === 0 ? (
          <p className="py-16 text-center text-slate-500">No products match your search.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 2xl:grid-cols-4">
            {visible.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                categoryName={p.categoryId ? categoryName.get(p.categoryId) : undefined}
                inCartQty={cart.qtyById.get(p.id)}
                onAdd={cart.add}
              />
            ))}
          </div>
        )}
      </section>

      <CartPanel
        lines={cart.lines}
        stockById={stockById}
        totals={totals}
        taxRate={taxRate}
        discount={cart.discount}
        canCharge={canCharge}
        onDiscount={cart.setDiscount}
        onQty={cart.setQty}
        onRemove={cart.remove}
        onClear={cart.clear}
        onCharge={() => setCheckoutOpen(true)}
      />

      <CheckoutModal
        open={checkoutOpen}
        storeId={storeId}
        lines={cart.lines}
        totals={totals}
        taxRate={taxRate}
        onClose={() => setCheckoutOpen(false)}
        onSaleDone={finishSale}
      />
    </div>
  );
}