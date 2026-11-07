import { formatPeso } from '../../lib/format';
import { stockStatus, type PosProduct } from '../../api/posApi';

interface Props {
  product: PosProduct;
  categoryName?: string;
  inCartQty?: number;
  onAdd: (p: PosProduct) => void;
}

export function ProductCard({ product: p, categoryName, inCartQty = 0, onAdd }: Props) {
  const status = stockStatus(p);
  const out = status === 'out';

  return (
    <button
      type="button"
      disabled={out}
      onClick={() => onAdd(p)}
      className={`relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-left
        transition hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5b44d6]
        ${out ? 'cursor-not-allowed opacity-70' : ''}`}
    >
      <div className="relative aspect-square bg-slate-100">
        {p.imageUrl ? (
          <img src={p.imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="grid h-full w-full place-items-center text-3xl text-slate-300">
            <i className="ri-image-line" />
          </div>
        )}
        {status === 'low' && (
          <span className="absolute left-2 top-2 rounded-full bg-amber-500 px-2 py-0.5 text-xs font-semibold text-white">
            Low
          </span>
        )}
        {inCartQty > 0 && (
          <span className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-[#5b44d6] text-sm font-semibold text-white">
            {inCartQty}
          </span>
        )}
        {out && (
          <div className="absolute inset-x-0 bottom-0 bg-slate-500/80 py-1 text-center text-xs font-semibold tracking-wide text-white">
            OUT OF STOCK
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="line-clamp-2 text-sm font-semibold text-slate-900">{p.name}</p>
        {categoryName && <p className="text-xs text-slate-500">{categoryName}</p>}
        <div className="mt-auto flex items-baseline justify-between pt-2">
          <span className="text-base font-bold text-[#5b44d6]">{formatPeso(p.price)}</span>
          <span className="text-xs text-slate-500">{p.stock} left</span>
        </div>
      </div>
    </button>
  );
}