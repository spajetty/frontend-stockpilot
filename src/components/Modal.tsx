import { useEffect, type ReactNode } from 'react';
import { cx } from '../lib/cx';

interface ModalProps {
  open: boolean;
  labelledBy?: string; 
  children: ReactNode;
  onClose?: () => void;
  variant?: 'confirm' | 'panel';
}

export default function Modal({ open, labelledBy, children, onClose, variant = 'confirm' }: ModalProps) {
  useEffect(() => {
    if (!open || !onClose) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className={cx(
          'w-full rounded-2xl bg-white shadow-xl',
          variant === 'confirm' ? 'max-w-md p-8 text-center' : 'max-h-[90vh] max-w-2xl overflow-y-auto',
        )}
      >
        {children}
      </div>
    </div>
  );
}