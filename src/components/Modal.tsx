import type { ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  labelledBy?: string; // id of the heading inside, for screen readers
  children: ReactNode;
}

// Not dismissible on purpose: it's used for confirmations that end with a redirect
export default function Modal({ open, labelledBy, children }: ModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl"
      >
        {children}
      </div>
    </div>
  );
}