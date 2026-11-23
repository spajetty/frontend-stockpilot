import { useState } from 'react';
import { Button, Modal } from '../../components';
import { formatPeso } from '../../lib/format';
import { useApproveProduct, usePendingProducts, useRejectProduct } from '../../hooks/useProducts';
import { ProductThumb } from './ProductBadges';

interface Props {
  open: boolean;
  onClose: () => void;
  onDone: (message: string) => void;
}

const textarea =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors duration-200 placeholder:text-slate-400 hover:border-slate-300 focus:border-brand focus:ring-4 focus:ring-brand/15';

// Owner only. Lists the products managers submitted and lets the owner approve or reject each one.
export default function ApprovalsModal({ open, onClose, onDone }: Props) {
  const { data, isLoading, isError } = usePendingProducts(open);
  const approve = useApproveProduct();
  const reject = useRejectProduct();

  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const items = data?.items ?? [];
  const busy = approve.isPending || reject.isPending;

  const close = () => {
    if (busy) return;
    setRejectingId(null);
    setReason('');
    setError('');
    onClose();
  };

  const onApprove = async (id: number, name: string) => {
    setError('');
    try {
      await approve.mutateAsync(id);
      onDone(`${name} was approved and is now in the catalogue.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't approve the product.");
    }
  };

  const onReject = async (id: number, name: string) => {
    if (!reason.trim()) {
      setError('Tell the manager why, so they can fix it.');
      return;
    }
    setError('');
    try {
      await reject.mutateAsync({ id, reason: reason.trim() });
      setRejectingId(null);
      setReason('');
      onDone(`${name} was rejected.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't reject the product.");
    }
  };

  return (
    <Modal open={open} labelledBy="approvals-title" variant="panel" onClose={close}>
      <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
        <div>
          <h2 id="approvals-title" className="text-lg font-semibold text-slate-900">
            Products awaiting approval
          </h2>
          <p className="text-sm text-slate-500">Approved products go live in the catalogue and the POS.</p>
        </div>
        <Button variant="view" icon="ri-close-line" disabled={busy} onClick={close}>
          Close
        </Button>
      </div>

      <div className="px-6 py-5">
        {error && (
          <p role="alert" className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </p>
        )}

        {isLoading && <p className="py-8 text-center text-sm text-slate-500">Loading…</p>}
        {isError && <p className="py-8 text-center text-sm text-rose-600">Couldn't load the approvals list.</p>}

        {!isLoading && !isError && items.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-200 py-10 text-center text-sm text-slate-500">
            Nothing is waiting for approval.
          </div>
        )}

        <ul className="space-y-3">
          {items.map((p) => (
            <li key={p.id} className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-start gap-3">
                <ProductThumb url={p.imageUrl} name={p.name} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-900">{p.name}</p>
                  <p className="text-xs text-slate-500">
                    {p.sku} · {p.categoryName ?? 'No category'} · {p.supplierName ?? 'No supplier'}
                  </p>
                  <p className="mt-1 text-sm text-slate-700">
                    {formatPeso(p.costPrice)} cost, {formatPeso(p.sellingPrice)} price ({p.margin.toFixed(1)}% margin)
                  </p>
                  <p className="text-xs text-slate-500">
                    Requested by {p.requestedByStoreName ?? 'a store'} · opening stock {p.pendingOpeningStock}
                  </p>
                </div>
              </div>

              {rejectingId === p.id ? (
                <div className="mt-3 space-y-3">
                  <label htmlFor={`reject-${p.id}`} className="block text-sm font-medium text-slate-700">
                    Reason for rejecting
                  </label>
                  <textarea
                    id={`reject-${p.id}`}
                    rows={2}
                    maxLength={500}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="For example: price is below cost, or this SKU already exists under another name"
                    className={textarea}
                  />
                  <div className="flex justify-end gap-3">
                    <Button
                      variant="cancel"
                      fullWidth={false}
                      disabled={busy}
                      onClick={() => {
                        setRejectingId(null);
                        setReason('');
                        setError('');
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="delete"
                      fullWidth={false}
                      loading={reject.isPending}
                      loadingText="Rejecting…"
                      onClick={() => void onReject(p.id, p.name)}
                    >
                      Reject product
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mt-3 flex justify-end gap-3">
                  <Button
                    variant="secondary"
                    fullWidth={false}
                    disabled={busy}
                    onClick={() => {
                      setRejectingId(p.id);
                      setReason('');
                      setError('');
                    }}
                  >
                    Reject
                  </Button>
                  <Button
                    variant="primary"
                    fullWidth={false}
                    icon="ri-check-line"
                    loading={approve.isPending && approve.variables === p.id}
                    loadingText="Approving…"
                    disabled={busy}
                    onClick={() => void onApprove(p.id, p.name)}
                  >
                    Approve
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </Modal>
  );
}
