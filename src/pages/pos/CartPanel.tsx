import { formatPeso } from '../../lib/format';
import type { Totals } from './totals';
import type { CartLine } from './useCart';

interface Props {
  lines: CartLine[];
  stockById: Map<number, number>;
  totals: Totals;
  taxRate: number;
  discount: number;
  canCharge: boolean;
  onDiscount: (v: number) => void;
  onQty: (productId: number, qty: number) => void;
  onRemove: (productId: number) => void;
  onClear: () => void;
  onCharge: () => void;
}

export function CartPanel({
  lines, stockById, totals, taxRate, discount, canCharge,
  onDiscount, onQty, onRemove, onClear, onCharge,
}: Props) {
  return (
    <aside className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)]">
      <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
        <div>
          <h2 className="font-semibold text-slate-900">Current sale</h2>
          <p className="text-sm text-slate-500">
            {lines.length === 0 ? 'Cart is empty' : `${lines.length} product${lines.length > 1 ? 's' : ''} · ${totals.units} unit${totals.units > 1 ? 's' : ''}`}
          </p>
        </div>
        {lines.length > 0 && (
          <button onClick={onClear} className="flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-700">
            <i className="ri-delete-bin-line" /> Clear
          </button>
        )}
      </div>

      <div className="min-h-[180px] flex-1 space-y-3 overflow-y-auto p-4">
        {lines.length === 0 ? (
          <div className="grid h-full place-items-center py-10 text-center">
            <div>
              <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-slate-100 text-2xl text-slate-400">
                <i className="ri-shopping-cart-line" />
              </div>
              <p className="font-semibold text-slate-900">Cart is empty</p>
              <p className="text-sm text-slate-500">Tap a product on the left to start a sale.</p>
            </div>
          </div>
        ) : (
          lines.map((l) => {
            const stock = stockById.get(l.productId) ?? 0;
            const over = l.qty > stock;
            return (
              <div key={l.productId} className={`rounded-xl border p-3 ${over ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}>
                <div className="flex gap-3">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                    {l.imageUrl && <img src={l.imageUrl} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{l.name}</p>
                    <p className="text-xs text-slate-500">{formatPeso(l.price)} each</p>
                  </div>
                  <button onClick={() => onRemove(l.productId)} aria-label="Remove" className="self-start text-slate-400 hover:text-slate-600">
                    <i className="ri-close-line text-lg" />
                  </button>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center rounded-lg border border-slate-200">
                    <button onClick={() => onQty(l.productId, l.qty - 1)} className="px-3 py-1.5 text-slate-600 hover:bg-slate-50" aria-label="Decrease">
                      <i className="ri-subtract-line" />
                    </button>
                    <span className="w-8 text-center text-sm font-semibold">{l.qty}</span>
                    <button
                      onClick={() => onQty(l.productId, Math.min(l.qty + 1, stock))}
                      disabled={l.qty >= stock}
                      className="px-3 py-1.5 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label="Increase"
                    >
                      <i className="ri-add-line" />
                    </button>
                  </div>
                  <span className="font-bold text-slate-900">{formatPeso(l.price * l.qty)}</span>
                </div>

                {over && <p className="mt-2 text-xs font-medium text-red-600">Only {stock} left. Lower the quantity.</p>}
              </div>
            );
          })
        )}
      </div>

      <div className="space-y-2 border-t border-slate-100 px-5 py-4 text-sm">
        <label className="flex items-center justify-between gap-3">
          <span className="font-medium text-slate-700">Discount (₱)</span>
          <input
            type="number" min={0} inputMode="decimal" placeholder="0"
            value={discount === 0 ? '' : discount}
            onChange={(e) => onDiscount(Math.max(0, Number(e.target.value) || 0))}
            className="w-28 rounded-lg border border-slate-200 px-3 py-1.5 text-right outline-none focus:border-[#5b44d6]"
          />
        </label>
        <Row label="Subtotal" value={formatPeso(totals.subtotal)} />
        <Row label="Discount" value={`-${formatPeso(totals.discount)}`} />
        <Row label={`VAT (${taxRate}%)`} value={formatPeso(totals.tax)} />
        <div className="flex items-baseline justify-between border-t border-dashed border-slate-200 pt-3">
          <span className="font-semibold text-slate-900">Total</span>
          <span className="text-2xl font-bold text-[#5b44d6]">{formatPeso(totals.total)}</span>
        </div>
        <button
          onClick={onCharge}
          disabled={!canCharge}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#5b44d6] py-3 font-semibold text-white transition hover:bg-[#4d38c0] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <i className="ri-bank-card-line" /> Charge {formatPeso(totals.total)}
        </button>
      </div>
    </aside>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-slate-600">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}