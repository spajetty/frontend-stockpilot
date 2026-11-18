import { useState } from 'react';
import { Button, Modal } from '../../components';
import { useAuth } from '../../auth/AuthContext';
import { formatDate, formatPeso, formatTime, spaceCamel } from '../../lib/format';
import { useSaleDetail } from '../../hooks/useSales';
import RefundModal from './RefundModal';

interface Props {
  saleId: number | null;
  onClose: () => void;
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

export default function SaleDetailsModal({ saleId, onClose }: Props) {
  const { user } = useAuth();
  const { data: sale, isLoading, isError } = useSaleDetail(saleId);
  const [refundOpen, setRefundOpen] = useState(false);

  const canRefundRole = user?.role === 'Owner' || user?.role === 'Manager';
  const refundable = sale ? sale.total - sale.refundedTotal : 0;
  const showRefundButton = canRefundRole && !!sale && sale.status !== 'Voided' && refundable > 0.004;

  const close = () => {
    setRefundOpen(false);
    onClose();
  };

  return (
    <>
      <Modal
        open={saleId != null}
        labelledBy="sale-details-title"
        variant="panel"
        onClose={refundOpen ? undefined : close}
      >
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h2 id="sale-details-title" className="text-lg font-semibold text-slate-900">
              {sale ? `Sale ${sale.saleNumber}` : 'Sale details'}
            </h2>
            {sale && (
              <p className="text-sm text-slate-500">
                {formatDate(sale.createdAt)}, {formatTime(sale.createdAt)} · {sale.cashierName}
              </p>
            )}
          </div>
          <Button variant="view" icon="ri-close-line" onClick={close}>
            Close
          </Button>
        </div>

        {isLoading && <p className="px-6 py-10 text-center text-sm text-slate-500">Loading sale…</p>}
        {isError && <p className="px-6 py-10 text-center text-sm text-rose-600">Couldn't load this sale.</p>}

        {sale && (
          <div className="space-y-6 px-6 py-5">
            <div className="grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-4">
              <Info label="Payment" value={sale.paymentMethod} />
              <Info label="Payment status" value={spaceCamel(sale.paymentStatus)} />
              <Info label="Sale status" value={spaceCamel(sale.status)} />
              <Info label="Cashier" value={sale.cashierName} />
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Item</th>
                    <th className="px-4 py-3 text-right font-semibold">Qty</th>
                    <th className="px-4 py-3 text-right font-semibold">Unit price</th>
                    <th className="px-4 py-3 text-right font-semibold">Line total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sale.items.map((i) => (
                    <tr key={i.id}>
                      <td className="px-4 py-3">
                        <p className="text-slate-900">{i.name}</p>
                        <p className="text-xs text-slate-400">{i.sku}</p>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-700">
                        {i.quantity}
                        {i.refundedQuantity > 0 && (
                          <p className="text-xs text-amber-600">{i.refundedQuantity} refunded</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-700">{formatPeso(i.unitPrice)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900">{formatPeso(i.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <dl className="ml-auto w-full max-w-xs space-y-1.5 text-sm">
              <div className="flex justify-between text-slate-600">
                <dt>Subtotal</dt>
                <dd>{formatPeso(sale.subtotal)}</dd>
              </div>
              <div className="flex justify-between text-slate-600">
                <dt>Discount</dt>
                <dd>-{formatPeso(sale.discount)}</dd>
              </div>
              <div className="flex justify-between text-slate-600">
                <dt>VAT</dt>
                <dd>{formatPeso(sale.tax)}</dd>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold text-slate-900">
                <dt>Total</dt>
                <dd>{formatPeso(sale.total)}</dd>
              </div>
            </dl>

            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Refund history</h3>
              {sale.refunds.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 py-6 text-center text-sm text-slate-500">
                  No refunds recorded for this sale.
                </div>
              ) : (
                <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                  {sale.refunds.map((r) => (
                    <li key={r.id} className="flex items-center justify-between px-4 py-3 text-sm">
                      <div>
                        <p className="text-slate-900">{r.reason}</p>
                        <p className="text-xs text-slate-500">
                          {formatDate(r.createdAt)} · {r.processedBy}
                        </p>
                      </div>
                      <p className="font-semibold text-slate-900">{formatPeso(r.amount)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-4 border-t border-slate-100 bg-slate-50/60 px-6 py-4">
          <div>
            <p className="text-xs text-slate-500">
              Refunded to date:{' '}
              <span className="font-semibold text-slate-900">{formatPeso(sale?.refundedTotal ?? 0)}</span>
            </p>
            {user?.role === 'Cashier' && (
              <p className="mt-0.5 text-xs text-slate-400">Refunds are processed by a manager or owner.</p>
            )}
          </div>
          <div className="flex gap-3">
            {showRefundButton && (
              <Button variant="delete" fullWidth={false} icon="ri-refund-2-line" onClick={() => setRefundOpen(true)}>
                Process refund
              </Button>
            )}
            <Button variant="secondary" fullWidth={false} onClick={close}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {sale && refundOpen && (
        <RefundModal sale={sale} onClose={() => setRefundOpen(false)} onDone={() => setRefundOpen(false)} />
      )}
    </>
  );
}