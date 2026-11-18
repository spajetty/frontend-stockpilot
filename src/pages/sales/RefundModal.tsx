import { useState } from 'react';
import { Button, Modal } from '../../components';
import { apiError } from '../../api/client';
import { formatPeso } from '../../lib/format';
import type { SaleDetail } from '../../api/salesApi';
import { useRefundSale } from '../../hooks/useSales';

interface Props {
  sale: SaleDetail;
  onClose: () => void;
  onDone: () => void;
}

export default function RefundModal({ sale, onClose, onDone }: Props) {
  const refund = useRefundSale(sale.id);
  const [qty, setQty] = useState<Record<number, number>>({});
  const [reason, setReason] = useState('');
  const [returnToStock, setReturnToStock] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const ratio = sale.subtotal > 0 ? sale.total / sale.subtotal : 1;
  const remainingOf = (i: SaleDetail['items'][number]) => i.quantity - (i.refundedQuantity ?? 0); 
  const selected = sale.items.filter((i) => (qty[i.id] ?? 0) > 0);

  const cap = sale.total - sale.refundedTotal;
  const estimate = Math.min(
    selected.reduce((sum, i) => sum + i.unitPrice * (qty[i.id] ?? 0) * ratio, 0),
    cap,
  );

  const setItemQty = (id: number, value: number, max: number) =>
    setQty((q) => ({
      ...q,
      [id]: Number.isFinite(value) ? Math.max(0, Math.min(max, value)) : 0,
    }));

  const refundAll = () =>
    setQty(Object.fromEntries(sale.items.map((i) => [i.id, remainingOf(i)])));

  const canSubmit = selected.length > 0 && reason.trim().length > 0 && !refund.isPending;

  const submit = async () => {
    setError(null);
    try {
      await refund.mutateAsync({
        items: selected.map((i) => ({ saleItemId: i.id, quantity: qty[i.id] })),
        reason: reason.trim(),
        returnToStock,
      });
      onDone();
    } catch (e) {
      setError(apiError(e, "Couldn't process the refund.").message);
    }
  };

  if (sale.items.some((i) => i.id == null)) {
    return (
      <Modal open labelledBy="refund-title" variant="panel" onClose={onClose}>
        <p className="px-6 py-10 text-center text-sm text-rose-600">
          The sale data is out of date. Restart the API and reload the page.
        </p>
      </Modal>
    );
  }

  return (
    <Modal
      open
      labelledBy="refund-title"
      variant="panel"
      onClose={refund.isPending ? undefined : onClose}
    >
      <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
        <div>
          <h2 id="refund-title" className="text-lg font-semibold text-slate-900">
            Refund {sale.saleNumber}
          </h2>
          <p className="text-sm text-slate-500">Choose what the customer is returning.</p>
        </div>
        <Button variant="secondary" fullWidth={false} icon="ri-checkbox-multiple-line" onClick={refundAll}>
          Refund everything left
        </Button>
      </div>

      <div className="space-y-5 px-6 py-5">
        <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
          {sale.items.map((i) => {
            const remaining = remainingOf(i);
            const value = qty[i.id] ?? 0;
            return (
              <li key={i.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm text-slate-900">{i.name}</p>
                  <p className="text-xs text-slate-400">
                    {i.sku} · {formatPeso(i.unitPrice)} each ·{' '}
                    {remaining === 0 ? 'already refunded' : `${remaining} left to refund`}
                  </p>
                </div>

                <div className="inline-flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    aria-label={`Fewer ${i.name}`}
                    disabled={remaining === 0 || value <= 0}
                    onClick={() => setItemQty(i.id, value - 1, remaining)}
                    className="grid size-8 cursor-pointer place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <i className="ri-subtract-line" aria-hidden="true" />
                  </button>
                  <span className="w-6 text-center text-sm font-semibold text-slate-900">{value}</span>
                  <button
                    type="button"
                    aria-label={`More ${i.name}`}
                    disabled={remaining === 0 || value >= remaining}
                    onClick={() => setItemQty(i.id, value + 1, remaining)}
                    className="grid size-8 cursor-pointer place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <i className="ri-add-line" aria-hidden="true" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>

        <div>
          <label htmlFor="refund-reason" className="mb-1.5 block text-sm font-medium text-slate-700">
            Reason <span className="text-red-500">*</span>
          </label>
          <textarea
            id="refund-reason"
            rows={3}
            maxLength={500}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Damaged item, wrong size, customer changed their mind"
            className="w-full resize-none rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 hover:border-slate-300 focus:border-brand focus:ring-4 focus:ring-brand/15"
          />
        </div>

        <label className="flex cursor-pointer items-start gap-3 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={returnToStock}
            onChange={(e) => setReturnToStock(e.target.checked)}
            className="mt-0.5 size-4 cursor-pointer accent-[#5b44d6]"
          />
          <span>
            Return items to stock
            <span className="block text-xs text-slate-500">Untick this if the items are damaged or can't be resold.</span>
          </span>
        </label>

        {error && (
          <p className="flex items-start gap-1 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">
            <i className="ri-error-warning-line mt-0.5 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </p>
        )}
      </div>

      <div className="flex items-center justify-between gap-4 border-t border-slate-100 bg-slate-50/60 px-6 py-4">
        <div>
          <p className="text-xs text-slate-500">Estimated refund</p>
          <p className="text-lg font-bold text-slate-900">{formatPeso(estimate)}</p>
          <p className="text-[11px] text-slate-400">Includes the item's share of the discount and VAT.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="cancel" fullWidth={false} disabled={refund.isPending} onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="delete"
            fullWidth={false}
            icon="ri-refund-2-line"
            loading={refund.isPending}
            loadingText="Refunding…"
            disabled={!canSubmit}
            onClick={submit}
          >
            Refund {formatPeso(estimate)}
          </Button>
        </div>
      </div>
    </Modal>
  );
}