import { useId, useState } from 'react';
import type { InputHTMLAttributes } from 'react';
import { cx } from '../lib/cx';

interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'size' | 'value'> {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  size?: 'md' | 'lg';
  required?: boolean;
  type?: string;
}

export default function Input({
  label,
  value,
  onChange,
  error,
  hint,
  size = 'md',
  required = false,
  type = 'text',
  id,
  className,
  onBlur,
  ...rest
}: InputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const messageId = `${inputId}-message`;

  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;

  const displayError = error || (required && touched && !value ? 'Field is required' : '');

  return (
    <div className={className}>
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-slate-700">
          {label}
          {required && <span className="text-red-500"> *</span>}
        </label>
      )}

      <div className="relative">
        <input
          {...rest}
          id={inputId}
          type={inputType}
          value={value}
          required={required}
          aria-invalid={!!displayError}
          aria-describedby={displayError || hint ? messageId : undefined}
          onChange={(e) => onChange(e.target.value)}
          onBlur={(e) => {
            setTouched(true);
            onBlur?.(e);
          }}
          className={cx(
            'w-full rounded-lg border bg-white text-slate-900 outline-none transition-colors duration-200 placeholder:text-slate-400 focus:ring-4',
            size === 'lg' ? 'h-[52px] px-4 text-[15px]' : 'px-4 py-2.5 text-sm',
            isPassword && 'pr-12',
            displayError
              ? 'border-red-400 focus:border-red-500 focus:ring-red-500/10'
              : 'border-slate-200 hover:border-slate-300 focus:border-brand focus:ring-brand/15',
          )}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute right-3 top-1/2 flex size-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-lg text-slate-500 transition-colors duration-200 hover:text-slate-800 focus-visible:outline-2 focus-visible:outline-brand"
          >
            <i className={showPassword ? 'ri-eye-off-line' : 'ri-eye-line'} aria-hidden="true" />
          </button>
        )}
      </div>

      {displayError ? (
        <p id={messageId} className="mt-1.5 flex items-start gap-1 text-xs text-red-500">
          <i className="ri-error-warning-line mt-[1px] shrink-0" aria-hidden="true" />
          <span className="min-w-0 flex-1 break-words">{displayError}</span>
        </p>
      ) : (
        hint && (
          <p id={messageId} className="mt-1.5 text-xs text-slate-500">
            {hint}
          </p>
        )
      )}
    </div>
  );
}