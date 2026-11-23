import { Button, Modal } from '../../components';
import { useAuth } from '../../auth/AuthContext';
import { useStores } from '../../stores/StoreContext';
import { cx } from '../../lib/cx';
import { formatDate, formatPeso, formatTime, spaceCamel } from '../../lib/format';
import type { ProductMovement } from '../../api/productsApi';
import { useProduct } from '../../hooks/useProducts';
import { ProductThumb, StatusBadge } from './ProductBadges';

interface Props {
  productId: number | null;
  onClose: () => void;
  onEdit: (id: number) => void;
}

function Info({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className={cx('text-sm font-semibold text-slate-900', valueClass)}>{value}</p>
    </div>
  );
}

function movementTitle(m: ProductMovement): string {
  const type = spaceCamel(m.type);
  if (m.reference) return `${type} ${m.reference}`;
  return m.reason ?? type;
}

const sectionTitle = 'mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500';

export default function ProductDetailsModal({ productId, onClose, onEdit }: Props) {
  const { user } = useAuth();
  const { activeStore } = useStores();
  const { data: p, isLoading, isError } = useProduct(productId);

  const canEdit = user?.role === 'Owner' || user?.role === 'Manager';
  const allStores = activeStore === null;

  return (
    <Modal open={productId != null} labelledBy="product-details-title" variant="panel" onClose={onClose}>
      <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
        <div className="min-w-0">
          <h2 id="product-details-title" className="truncate text-lg font-semibold text-slate-900">
            {p?.name ?? 'Product details'}
          </h2>
          {p && (
            <p className="text-sm text-slate-500">
              {p.sku}
              {p.barcode ? ` · ${p.barcode}` : ''}
            </p>
          )}
        </div>
        <Button variant="view" icon="ri-close-line" onClick={onClose}>
          Close
        </Button>
      </div>

      {isLoading && <p className="px-6 py-10 text-center text-sm text-slate-500">Loading product…</p>}
      {isError && <p className="px-6 py-10 text-center text-sm text-rose-600">Couldn't load this product.</p>}

      {p && (
        <div className="space-y-6 px-6 py-5">
          {p.status === 'Pending' && (
            <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Waiting for the owner's approval
              {p.requestedByStoreName ? ` (requested by ${p.requestedByStoreName})` : ''}. It stays out of the POS until
              then.
            </p>
          )}
          {p.status === 'Rejected' && (
            <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800">
              Rejected by the owner{p.rejectionReason ? `: ${p.rejectionReason}` : '.'}
            </p>
          )}

          <div className="flex gap-5">
            <ProductThumb url={p.imageUrl} name={p.name} size="lg" />
            <div className="grid flex-1 grid-cols-2 content-start gap-x-6 gap-y-4">
              <Info label="Category" value={p.categoryName ?? 'None'} />
              <Info label="Supplier" value={p.supplierName ?? 'None'} />
              <Info label="Cost / Price" value={`${formatPeso(p.costPrice)} / ${formatPeso(p.sellingPrice)}`} />
              <Info
                label="Margin"
                value={`${p.margin.toFixed(1)}%`}
                valueClass={p.margin >= 30 ? 'text-emerald-600' : undefined}
              />
              <Info
                label={allStores ? 'Stock on hand (all stores)' : 'Stock on hand'}
                value={`${p.status === 'Pending' || p.status === 'Rejected' ? p.pendingOpeningStock : p.stock} units`}
              />
              <Info label="Inventory value" value={formatPeso(p.inventoryValue)} />
              <div>
                <p className="text-xs text-slate-500">Status</p>
                <div className="mt-0.5">
                  <StatusBadge status={p.status} availableInPos={p.availableInPos} />
                </div>
              </div>
            </div>
          </div>

          {p.description && <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">{p.description}</p>}

          <div>
            <h3 className={sectionTitle}>Recent stock movements</h3>
            {p.recentMovements.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 py-6 text-center text-sm text-slate-500">
                No stock movements yet.
              </div>
            ) : (
              <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                {p.recentMovements.map((m) => (
                  <li key={m.id} className="flex items-center justify-between px-4 py-3 text-sm">
                    <div className="min-w-0">
                      <p className="truncate text-slate-900">{movementTitle(m)}</p>
                      <p className="text-xs text-slate-500">
                        {formatDate(m.createdAt)}, {formatTime(m.createdAt)}
                        {allStores ? ` · ${m.storeCode}` : ''}
                      </p>
                    </div>
                    <p className={cx('font-semibold', m.quantityChange > 0 ? 'text-emerald-600' : 'text-rose-600')}>
                      {m.quantityChange > 0 ? `+${m.quantityChange}` : m.quantityChange}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {canEdit && (
            <div>
              <h3 className={sectionTitle}>Recent sales containing this product</h3>
              {p.recentSales.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 py-6 text-center text-sm text-slate-500">
                  No sales yet.
                </div>
              ) : (
                <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                  {p.recentSales.map((s) => (
                    <li key={s.saleId} className="flex items-center justify-between px-4 py-3 text-sm">
                      <div>
                        <p className="text-slate-900">{s.saleNumber}</p>
                        <p className="text-xs text-slate-500">
                          {formatDate(s.createdAt)} · {s.cashierName}
                        </p>
                      </div>
                      <p className="font-semibold text-slate-900">{formatPeso(s.total)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50/60 px-6 py-4">
        <Button variant="secondary" fullWidth={false} onClick={onClose}>
          Close
        </Button>
        {canEdit && p && (
          <Button variant="primary" fullWidth={false} icon="ri-edit-line" onClick={() => onEdit(p.id)}>
            Edit product
          </Button>
        )}
      </div>
    </Modal>
  );
}
