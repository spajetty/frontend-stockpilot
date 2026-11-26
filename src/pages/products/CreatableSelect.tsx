import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { cx } from '../../lib/cx';

export interface LookupChoice {
  value: string;
  label: string;
}

interface Props {
  label: string;
  entity: string; // 'category' | 'supplier', used in the empty and add lines
  value: string; // selected id, '' for none
  onChange: (value: string) => void;
  options: LookupChoice[];
  onCreate: (name: string) => Promise<LookupChoice>;
  placeholder?: string;
  className?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  onTouched?: () => void; // called when the list closes, so the form knows the field was visited
}

// A search box that doubles as a dropdown. When nothing matches what was typed,
// the list offers to add it as a new entry instead.
export default function CreatableSelect({
  label,
  entity,
  value,
  onChange,
  options,
  onCreate,
  placeholder,
  className,
  required = false,
  hint,
  error: fieldError,
  onTouched,
}: Props) {
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState<string | null>(null); // null = not typing, show the selected label
  const [added, setAdded] = useState<LookupChoice[]>([]); // new entries the list hasn't refetched yet
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const all = useMemo(() => {
    const known = new Set(options.map((o) => o.value));
    return [...options, ...added.filter((a) => !known.has(a.value))];
  }, [options, added]);

  const selected = all.find((o) => o.value === value);
  const text = query ?? selected?.label ?? '';
  const term = (query ?? '').trim().toLowerCase();
  const matches = term ? all.filter((o) => o.label.toLowerCase().includes(term)) : all;
  const exact = term ? all.find((o) => o.label.toLowerCase() === term) : undefined;
  const canCreate = term !== '' && !exact;

  const close = () => {
    setOpen(false);
    setQuery(null);
    setError('');
    onTouched?.();
  };

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setQuery(null);
        setError('');
        onTouched?.();
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open, onTouched]);

  const pick = (v: string) => {
    onChange(v);
    close();
  };

  const create = async () => {
    const name = (query ?? '').trim();
    if (!name || creating) return;
    setCreating(true);
    setError('');
    try {
      const made = await onCreate(name);
      setAdded((a) => [...a, made]);
      onChange(made.value);
      close();
    } catch (e) {
      setError(e instanceof Error ? e.message : `Couldn't add the ${entity}.`);
    } finally {
      setCreating(false);
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      if (open) {
        e.stopPropagation();
        close();
      }
      return;
    }
    if (e.key !== 'Enter') return;

    // Enter never submits the surrounding form from this field
    e.preventDefault();
    if (!open) return;
    const target = exact ?? matches[0];
    if (term && target) pick(target.value);
    else if (canCreate) void create();
  };

  return (
    <div ref={rootRef} className={cx('relative', className)}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>

      <div className="relative">
        <input
          id={id}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-invalid={!!fieldError}
          aria-controls={`${id}-list`}
          autoComplete="off"
          value={text}
          placeholder={placeholder ?? `Search or add a ${entity}`}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setError('');
          }}
          onKeyDown={onKeyDown}
          className={cx(
            'w-full rounded-lg border bg-white py-2.5 pl-4 pr-10 text-sm text-slate-900 outline-none transition-colors duration-200 placeholder:text-slate-400 focus:ring-4',
            fieldError
              ? 'border-red-400 focus:border-red-500 focus:ring-red-500/10'
              : 'border-slate-200 hover:border-slate-300 focus:border-brand focus:ring-brand/15',
          )}
        />
        {value && query === null ? (
          <button
            type="button"
            aria-label={`Clear ${entity}`}
            onClick={() => onChange('')}
            className="absolute right-2.5 top-1/2 flex size-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-lg text-slate-400 hover:text-slate-700"
          >
            <i className="ri-close-line" aria-hidden="true" />
          </button>
        ) : (
          <i
            className="ri-arrow-down-s-line pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xl text-slate-500"
            aria-hidden="true"
          />
        )}
      </div>

      {open && (
        <ul
          id={`${id}-list`}
          role="listbox"
          className="absolute left-0 right-0 top-full z-[60] mt-1.5 max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg"
        >
          {matches.map((o) => (
            <li key={o.value} role="option" aria-selected={o.value === value}>
              <button
                type="button"
                onClick={() => pick(o.value)}
                className={cx(
                  'flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100',
                  o.value === value ? 'font-semibold text-brand' : 'text-slate-700',
                )}
              >
                <span className="truncate">{o.label}</span>
                {o.value === value && <i className="ri-check-line" aria-hidden="true" />}
              </button>
            </li>
          ))}

          {canCreate && (
            <li>
              <button
                type="button"
                disabled={creating}
                onClick={() => void create()}
                className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold text-brand hover:bg-brand/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <i className={creating ? 'ri-loader-4-line animate-spin' : 'ri-add-circle-line'} aria-hidden="true" />
                <span className="truncate">
                  Add “{(query ?? '').trim()}” as a new {entity}
                </span>
              </button>
            </li>
          )}

          {!canCreate && matches.length === 0 && (
            <li className="px-3 py-2 text-sm text-slate-500">Type a name to add the first {entity}.</li>
          )}

          {error && <li className="px-3 py-2 text-xs text-red-500">{error}</li>}
        </ul>
      )}

      {fieldError ? (
        <p className="mt-1.5 flex items-start gap-1 text-xs text-red-500">
          <i className="ri-error-warning-line mt-[1px] shrink-0" aria-hidden="true" />
          <span className="min-w-0 flex-1 break-words">{fieldError}</span>
        </p>
      ) : (
        hint && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>
      )}
    </div>
  );
}