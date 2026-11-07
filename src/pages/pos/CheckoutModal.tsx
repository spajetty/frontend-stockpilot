import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiError } from '../../api/client';
import {
  applyStockChanges, checkout, posKeys,
  type CheckoutResponse, type PaymentMethodName,
} from '../../api/posApi';
import { formatPeso } from '../../lib/format';
import type { Totals } from './totals';
import type { CartLine } from './useCart';

interface Props {
  open: boolean;
  storeId: number;
  lines: CartLine[];
  totals: Totals;
  taxRate: number;
  onClose: () => void;
  onSaleDone: () => void;      // called when the cashier dismisses the success view
}

const METHODS: PaymentMethodName[] = ['Cash', 'Card', 'PayPal'];

function errorMessage(e: unknown): string {
  const r: unknown = apiError(e, "Couldn't complete the sale. Please try again.");
  return r instanceof Error ? r.message : String(r);
}

export function CheckoutModal({ open, storeId, lines, totals, taxRate, onClose, onSaleDone }: Props) {
  const qc = useQueryClient();
  const [method, setMethod] = useState<PaymentMethodName>('Cash');
  const [tendered, setTendered] = useState('');
  const [result, setResult] = useState<CheckoutResponse | null>(null);

  const tenderedNum = Number(tendered);
  const change = tenderedNum - totals.total;
  const canSubmit = method !== 'Cash' || (tendered !== '' && change >= -0.0001);

  const mutation = useMutation({
    mutationFn: () =>
      checkout({
        storeId,
        items: lines.map((l) => ({ productId: l.productId, quantity: l.qty })),
        discount: totals.discount,
        paymentMethod: method,
        cashTendered: method === 'Cash' ? tenderedNum : null,
      }),
    onSuccess: (res) => {
      applyStockChanges(qc, storeId, res.stockChanges);   // correct even if the socket is down
      setResult(res);
    },
    onError: () => {
      // e.g. stock changed under us: refresh so the grid and cart warnings are accurate
      qc.invalidateQueries({ queryKey: posKeys.catalog(storeId) });
    },
  });
  const { reset } = mutation;

  useEffect(() => {
    if (open) { setMethod('Cash'); setTendered(''); setResult(null); reset(); }
  }, [open, reset]);

  const dismiss = () => (result ? onSaleDone() : onClose());

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !mutation.isPending) dismiss();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!open) return null;

  const submit = () => { if (canSubmit && !mutation.isPending) mutation.mutate(); };
  const r = result?.receipt;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget && !mutation.isPending) dismiss(); }}
    >
      <div role="dialog" aria-modal="true" className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        {r ? (
          /* ---------- success ---------- */
          <div className="p-8 text-center">
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-emerald-50 text-3xl text-emerald-600">
              <i className="ri-check-line" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Sale completed</h2>
            <p className="mt-1 text-sm text-slate-500">{r.saleNumber}</p>

            <div className="mt-6 space-y-2 rounded-xl bg-slate-50 p-4 text-sm">
              <div className="flex justify-between"><span className="text-slate-600">Total paid</span><span className="font-bold">{formatPeso(r.total)}</span></div>
              <div className="flex justify-between"><span className="text-slate-600">Payment</span><span>{r.paymentMethod}</span></div>
              {r.changeDue != null && (
                <div className="flex justify-between"><span className="text-slate-600">Change due</span><span className="font-bold text-emerald-700">{formatPeso(r.changeDue)}</span></div>
              )}
            </div>

            <button onClick={onSaleDone} className="mt-6 w-full rounded-xl bg-[#5b44d6] py-3 font-semibold text-white hover:bg-[#4d38c0]">
              New sale
            </button>
          </div>
        ) : (
          /* ---------- confirm ---------- */
          <>
            <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Confirm checkout</h2>
                <p className="text-sm text-slate-500">{lines.length} line item(s) · {totals.units} unit(s)</p>
              </div>
              <button onClick={dismiss} disabled={mutation.isPending} aria-label="Close" className="text-slate-400 hover:text-slate-600 disabled:opacity-40">
                <i className="ri-close-line text-2xl" />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-6">
              <div className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                {lines.map((l) => (
                  <div key={l.productId} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{l.name}</p>
                      <p className="text-xs text-slate-500">{l.qty} × {formatPeso(l.price)}</p>
                    </div>
                    <span className="text-sm font-bold">{formatPeso(l.price * l.qty)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-1.5 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                <div className="flex justify-between"><span>Subtotal</span><span>{formatPeso(totals.subtotal)}</span></div>
                <div className="flex justify-between"><span>Discount</span><span>-{formatPeso(totals.discount)}</span></div>
                <div className="flex justify-between"><span>VAT ({taxRate}%)</span><span>{formatPeso(totals.tax)}</span></div>
                <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold text-slate-900">
                  <span>Total due</span><span>{formatPeso(totals.total)}</span>
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold text-slate-900">Payment method</p>
                <div className="inline-flex rounded-xl bg-slate-100 p-1">
                  {METHODS.map((m) => (
                    <button
                      key={m} type="button" onClick={() => setMethod(m)}
                      className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${method === m ? 'bg-white text-[#5b44d6] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {method === 'Cash' ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label htmlFor="tendered" className="text-sm font-semibold text-slate-900">Cash tendered (₱)</label>
                      <button type="button" onClick={() => setTendered(String(totals.total))} className="text-xs font-medium text-[#5b44d6] hover:underline">
                        Exact
                      </button>
                    </div>
                    <input
                      id="tendered" type="number" min={0} inputMode="decimal" autoFocus
                      value={tendered}
                      onChange={(e) => setTendered(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && submit()}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#5b44d6]"
                    />
                  </div>
                  <div className={`rounded-xl p-4 ${tendered !== '' && change < 0 ? 'bg-red-50' : 'bg-emerald-50'}`}>
                    <p className={`text-xs ${tendered !== '' && change < 0 ? 'text-red-700' : 'text-emerald-700'}`}>
                      {tendered !== '' && change < 0 ? 'Short by' : 'Change due'}
                    </p>
                    <p className={`text-2xl font-bold ${tendered !== '' && change < 0 ? 'text-red-700' : 'text-emerald-800'}`}>
                      {formatPeso(tendered === '' ? 0 : Math.abs(change))}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
                  Demo terminal: {method} payments are simulated and recorded as paid. No real charge is made.
                </p>
              )}

              {mutation.isError && (
                <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">
                  {errorMessage(mutation.error)}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-6 py-4">
              <span className="text-sm text-slate-600">Charging <b className="text-slate-900">{formatPeso(totals.total)}</b></span>
              <div className="flex items-center gap-3">
                <button onClick={dismiss} disabled={mutation.isPending} className="px-3 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 disabled:opacity-40">
                  Back
                </button>
                <button
                  onClick={submit}
                  disabled={!canSubmit || mutation.isPending}
                  className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {mutation.isPending ? 'Processing…' : 'Complete sale'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}