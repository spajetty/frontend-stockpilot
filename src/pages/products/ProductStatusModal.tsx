import { useState } from 'react';
import { Button, Modal } from '../../components';
import { cx } from '../../lib/cx';
import type { ProductListItem } from '../../api/productsApi';
import { useSetProductActive } from '../../hooks/useProducts';

export interface StatusTarget {
  product: ProductListItem;
  action: 'deactivate' | 'reactivate';
}

interface Props {
  target: StatusTarget | null;
  onClose: () => void;
  onDone: (message: string) => void;
}

export default function ProductStatusModal({ target, onClose, onDone }: Props) {
  const mutation = useSetProductActive();
  const [error, setError] = useState('');

  const deactivating = target?.action === 'deactivate';
  const name = target?.product.name ?? '';

  const close = () => {
    if (mutation.isPending) return;
    setError('');
    onClose();
  };

  const confirm = async () => {
    if (!target) return;
    setError('');
    try {
      await mutation.mutateAsync({ id: target.product.id, active: !deactivating });
      onDone(deactivating ? `${name} was deactivated.` : `${name} is active again.`);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Try again.');
    }
  };

  return (
    <Modal open={target !== null} labelledBy="product-status-title" onClose={close}>
      <div
        className={cx(
          'mx-auto grid size-14 place-items-center rounded-full text-2xl',
          deactivating ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600',
        )}
      >
        <i className={deactivating ? 'ri-eye-off-line' : 'ri-eye-line'} aria-hidden="true" />
      </div>

      <h2 id="product-status-title" className="mt-4 text-lg font-semibold text-slate-900">
        {deactivating ? 'Deactivate this product?' : 'Reactivate this product?'}
      </h2>
      <p className="mt-2 text-sm text-slate-500">
        {deactivating ? (
          <>
            <span className="font-semibold text-slate-700">{name}</span> will be hidden from the point of sale in all
            stores. Its stock and sales history are kept, and you can reactivate it anytime.
          </>
        ) : (
          <>
            <span className="font-semibold text-slate-700">{name}</span> will show up in the catalogue again and can be
            sold in every store.
          </>
        )}
      </p>

      {error && (
        <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="mt-6 flex gap-3">
        <Button variant="cancel" disabled={mutation.isPending} onClick={close}>
          Cancel
        </Button>
        <Button
          variant={deactivating ? 'delete' : 'primary'}
          icon={deactivating ? 'ri-eye-off-line' : 'ri-eye-line'}
          loading={mutation.isPending}
          loadingText={deactivating ? 'Deactivating…' : 'Reactivating…'}
          onClick={confirm}
        >
          {deactivating ? 'Deactivate' : 'Reactivate'}
        </Button>
      </div>
    </Modal>
  );
}
