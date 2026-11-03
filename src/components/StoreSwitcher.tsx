import { useEffect, useRef, useState } from 'react';
import { useStores } from '../stores/StoreContext';

const labelStyle = 'truncate text-base font-semibold text-slate-900';

interface OptionProps {
  label: string;
  hint?: string;
  selected: boolean;
  onSelect: () => void;
}

function StoreOption({ label, hint, selected, onSelect }: OptionProps) {
  return (
    <li role="option" aria-selected={selected}>
      <button
        type="button"
        onClick={onSelect}
        className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100 ${
          selected ? 'font-semibold text-[#5b44d6]' : 'text-slate-700'
        }`}
      >
        <span className="truncate">{label}</span>
        <span className="flex shrink-0 items-center gap-2">
          {hint && <span className="text-xs font-normal text-slate-400">{hint}</span>}
          {selected && <i className="ri-check-line" aria-hidden="true" />}
        </span>
      </button>
    </li>
  );
}

// Sits in the Topbar where the hardcoded store name used to be.
// Staff see their store as plain text; an owner with several stores gets a dropdown.
export function StoreSwitcher() {
  const { stores, activeStore, canSwitch, loading, error, selectStore, reload } = useStores();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  if (loading) {
    return <div className="h-5 w-36 animate-pulse rounded bg-slate-200" aria-busy="true" />;
  }

  if (error) {
    return (
      <button
        type="button"
        onClick={reload}
        className="flex items-center gap-1.5 text-sm font-medium text-red-600 hover:underline"
      >
        <i className="ri-error-warning-line" aria-hidden="true" />
        Store unavailable, retry
      </button>
    );
  }

  if (!canSwitch) {
    return <p className={labelStyle}>{activeStore?.name ?? 'No store assigned'}</p>;
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="-ml-1.5 flex max-w-full items-center gap-1 rounded-lg px-1.5 py-0.5 hover:bg-slate-100"
      >
        <span className={labelStyle}>{activeStore?.name ?? 'All stores'}</span>
        <i
          className={`ri-arrow-down-s-line text-lg text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute left-0 top-full z-50 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg"
        >
          <StoreOption
            label="All stores"
            selected={activeStore === null}
            onSelect={() => {
              selectStore(null);
              setOpen(false);
            }}
          />
          {stores.map((s) => (
            <StoreOption
              key={s.id}
              label={s.name}
              hint={s.code}
              selected={activeStore?.id === s.id}
              onSelect={() => {
                selectStore(s.id);
                setOpen(false);
              }}
            />
          ))}
        </ul>
      )}
    </div>
  );
}