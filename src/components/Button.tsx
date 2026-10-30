import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cx } from '../lib/cx';

type Variant =
  | 'primary'
  | 'submit'
  | 'next'
  | 'add'
  | 'secondary'
  | 'cancel'
  | 'outline'
  | 'back'
  | 'delete'
  | 'view'
  | 'edit'
  | 'deleteicon'
  | 'custom';

type Size = 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: string; // Remix Icon class, e.g. 'ri-add-line'
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  loadingText?: string;
  fullWidth?: boolean; // defaults to true, set false for toolbars and headers
  animateOnHover?: boolean;
  iconColorClass?: string;
  children: ReactNode;
}

const solidBrand = 'bg-brand hover:bg-brand-dark text-white shadow-sm active:scale-[0.98]';
const whiteBorder = 'bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 active:scale-[0.98]';

const variantStyles: Record<Variant, string> = {
  primary: solidBrand,
  submit: solidBrand,
  next: solidBrand,
  add: solidBrand,
  secondary: whiteBorder,
  cancel: whiteBorder,
  outline: whiteBorder,
  back: 'bg-slate-100 hover:bg-slate-200 text-slate-700 active:scale-[0.98]',
  delete: 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm shadow-rose-600/20 active:scale-[0.98]',
  view: 'text-slate-600 hover:bg-slate-100',
  edit: 'text-brand hover:bg-brand/10',
  deleteicon: 'text-rose-600 hover:bg-rose-50',
  custom: '',
};

const defaultIcons: Partial<Record<Variant, string>> = {
  cancel: 'ri-close-line',
  back: 'ri-arrow-left-line',
  next: 'ri-arrow-right-line',
  submit: 'ri-check-line',
  view: 'ri-eye-line',
  edit: 'ri-edit-line',
  deleteicon: 'ri-delete-bin-line',
};

const iconOnlyVariants: Variant[] = ['view', 'edit', 'deleteicon'];

const sizeStyles: Record<Size, string> = {
  md: 'py-2.5 px-4.5 rounded-xl text-xs font-semibold tracking-wide',
  lg: 'h-[58px] px-5 rounded-xl text-base font-semibold',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  loadingText,
  fullWidth = true,
  animateOnHover = false,
  iconColorClass = '',
  children,
  type = 'button',
  className = '',
  disabled,
  ...rest
}: ButtonProps) {
  const resolvedIcon = icon ?? defaultIcons[variant];
  const isDisabled = disabled || loading;
  const isIconOnly = iconOnlyVariants.includes(variant);
  const label = typeof children === 'string' ? children : undefined;

  const iconEl = resolvedIcon ? (
    <i className={cx(resolvedIcon, iconColorClass)} aria-hidden="true" />
  ) : null;

  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-busy={loading}
      aria-label={isIconOnly ? label : undefined}
      title={isIconOnly ? label : undefined}
      className={cx(
        'flex items-center justify-center gap-2 transition-all duration-200',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-1',
        'disabled:cursor-not-allowed disabled:opacity-50',
        isIconOnly ? 'size-9 rounded-full p-0' : sizeStyles[size],
        !isIconOnly && fullWidth && 'w-full',
        animateOnHover && 'hover:-translate-y-0.5 hover:shadow-sm',
        !isDisabled && 'cursor-pointer',
        variantStyles[variant],
        className,
      )}
      {...rest}
    >
      {loading ? (
        <>
          <i className="ri-loader-4-line animate-spin" aria-hidden="true" />
          {!isIconOnly && <span>{loadingText ?? children}</span>}
        </>
      ) : (
        <>
          {iconPosition === 'left' && iconEl}
          {!isIconOnly && <span>{children}</span>}
          {iconPosition === 'right' && iconEl}
        </>
      )}
    </button>
  );
}