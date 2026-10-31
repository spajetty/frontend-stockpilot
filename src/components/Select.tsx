import { useId, useState } from 'react';
import type { SelectHTMLAttributes } from 'react';
import { cx } from '../lib/cx';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange' | 'size' | 'value'> {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
  size?: 'md' | 'lg';
  required?: boolean;
}

export default function Select({
  label,
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  error,
  size = 'md',
  required = false,
  id,
  className,
  onBlur,
  ...rest
}: SelectProps) {
  const autoId = useId();
  const selectId = id ?? autoId;
  const messageId = `${selectId}-message`;
  const [touched, setTouched] = useState(false);

  const displayError = error || (required && touched && !value ? 'Field is required' : '');

  return (
    <div className={className}>
      {label && (
        <label htmlFor={selectId} className="mb-1.5 block text-sm font-medium text-slate-700">
          {label}
          {required && <span className="text-red-500"> *</span>}
        </label>
      )}

      <div className="relative">
        <select
          {...rest}
          id={selectId}
          value={value}
          required={required}
          aria-invalid={!!displayError}
          aria-describedby={displayError ? messageId : undefined}
          onChange={(e) => onChange(e.target.value)}
          onBlur={(e) => {
            setTouched(true);
            onBlur?.(e);
          }}
          className={cx(
            'w-full appearance-none rounded-lg border bg-white pr-10 outline-none transition-colors duration-200 focus:ring-4',
            size === 'lg' ? 'h-[52px] px-4 text-[15px]' : 'px-4 py-2.5 text-sm',
            value ? 'text-slate-900' : 'text-slate-400',
            displayError
              ? 'border-red-400 focus:border-red-500 focus:ring-red-500/10'
              : 'border-slate-200 hover:border-slate-300 focus:border-brand focus:ring-brand/15',
          )}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((o) => (
            <option key={o.value} value={o.value} className="text-slate-900">
              {o.label}
            </option>
          ))}
        </select>
        <i
          className="ri-arrow-down-s-line pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xl text-slate-500"
          aria-hidden="true"
        />
      </div>

      {displayError && (
        <p id={messageId} className="mt-1.5 flex items-start gap-1 text-xs text-red-500">
          <i className="ri-error-warning-line mt-[1px] shrink-0" aria-hidden="true" />
          <span className="min-w-0 flex-1 break-words">{displayError}</span>
        </p>
      )}
    </div>
  );
}