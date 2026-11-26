import { cx } from '../../lib/cx';

interface StoreChoice {
  id: number;
  name: string;
  code?: string | null;
}

interface Props {
  stores: StoreChoice[];
  selected: number[];
  onChange: (ids: number[]) => void;
  // Opening stock typed for each selected store, keyed by store id
  quantities: Record<number, string>;
  onQuantityChange: (id: number, value: string) => void;
  error?: string;
}

const isWholeNumber = (v: string) => /^[0-9]+$/.test(v.trim());

// Pick one store, several, or all of them, and give each picked store its own opening stock.
// "All stores" shows a dash when only some are picked.
export default function StoreMultiSelect({ stores, selected, onChange, quantities, onQuantityChange, error }: Props) {
  const all = stores.length > 0 && selected.length === stores.length;
  const some = selected.length > 0 && !all;
  const qtyOf = (id: number) => quantities[id] ?? '0';
  const total = selected.reduce((n, id) => n + (isWholeNumber(qtyOf(id)) ? Number(qtyOf(id)) : 0), 0);

  const toggle = (id: number) =>
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);

  return (
    <fieldset>
      <legend className="mb-1.5 text-sm font-medium text-slate-700">Stores and opening stock</legend>

      <div className={cx('rounded-lg border bg-white', error ? 'border-red-400' : 'border-slate-200')}>
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-2.5">
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-900">
            <input
              type="checkbox"
              checked={all}
              aria-invalid={!!error}
              ref={(el) => {
                if (el) el.indeterminate = some;
              }}
              onChange={() => onChange(all ? [] : stores.map((s) => s.id))}
              className="size-4 cursor-pointer accent-brand"
            />
            All stores
            <span className="text-xs font-normal text-slate-400">({stores.length})</span>
          </label>
          {selected.length > 0 && <span className="text-xs text-slate-400">Opening stock</span>}
        </div>

        {stores.length === 0 ? (
          <p className="px-4 py-3 text-sm text-slate-500">No stores found.</p>
        ) : (
          <ul>
            {stores.map((s) => {
              const checked = selected.includes(s.id);
              const invalid = checked && !isWholeNumber(qtyOf(s.id));
              return (
                <li key={s.id} className="flex items-center justify-between gap-3 px-4 py-2 hover:bg-slate-50">
                  <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(s.id)}
                      className="size-4 cursor-pointer accent-brand"
                    />
                    <span className="truncate">{s.name}</span>
                    {s.code && <span className="text-xs text-slate-400">{s.code}</span>}
                  </label>

                  {checked && (
                    <input
                      type="text"
                      inputMode="numeric"
                      aria-label={`Opening stock for ${s.name}`}
                      aria-invalid={invalid}
                      value={qtyOf(s.id)}
                      onChange={(e) => onQuantityChange(s.id, e.target.value.replace(/[^0-9]/g, '').slice(0, 7))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') e.preventDefault();
                      }}
                      className={cx(
                        'w-24 rounded-lg border bg-white px-3 py-1.5 text-right text-sm text-slate-900 outline-none transition-colors duration-200 focus:ring-4',
                        invalid
                          ? 'border-red-400 focus:border-red-500 focus:ring-red-500/10'
                          : 'border-slate-200 hover:border-slate-300 focus:border-brand focus:ring-brand/15',
                      )}
                    />
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {error ? (
        <p className="mt-1.5 flex items-start gap-1 text-xs text-red-500">
          <i className="ri-error-warning-line mt-[1px] shrink-0" aria-hidden="true" />
          <span className="min-w-0 flex-1 break-words">{error}</span>
        </p>
      ) : (
        <p className="mt-1.5 text-xs text-slate-500">
          {selected.length} of {stores.length} stores selected
          {selected.length > 0 ? ` · ${total} units in total` : ''}. Each selected store gets the product set up with its
          own quantity.
        </p>
      )}
    </fieldset>
  );
}