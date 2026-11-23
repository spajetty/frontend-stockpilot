import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Button, Input, Modal, Select } from '../../components';
import { useAuth } from '../../auth/AuthContext';
import { useStores } from '../../stores/StoreContext';
import type { ProductDetail } from '../../api/productsApi';
import {
  useCategories,
  useCreateCategory,
  useCreateProduct,
  useCreateSupplier,
  useProduct,
  useSuppliers,
  useUpdateProduct,
} from '../../hooks/useProducts';
import CreatableSelect from './CreatableSelect';

export type FormTarget = { mode: 'create' } | { mode: 'edit'; id: number };

interface Props {
  target: FormTarget | null;
  onClose: () => void;
  onSaved: (message: string) => void;
}

// Matches the placeholder the demo catalogue uses. Leave it to keep the demo consistent.
const PLACEHOLDER_IMAGE =
  'https://readdy.ai/api/search-image?query=plain%20retail%20product%20placeholder%20on%20pale%20gray%20studio%20background';

const textarea =
  'w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition-colors duration-200 placeholder:text-slate-400 hover:border-slate-300 focus:border-brand focus:ring-4 focus:ring-brand/15';

const labelCls = 'mb-1.5 block text-sm font-medium text-slate-700';

const toNumber = (s: string) => (s.trim() === '' ? NaN : Number(s));

type Errors = Partial<Record<'name' | 'sku' | 'cost' | 'price' | 'opening' | 'reorder' | 'store' | 'image', string>>;

export default function ProductFormModal({ target, onClose, onSaved }: Props) {
  const editId = target?.mode === 'edit' ? target.id : null;
  const { data, isLoading, isError } = useProduct(editId);

  let body: ReactNode = null;
  if (target?.mode === 'create') {
    body = <ProductForm key="new" onClose={onClose} onSaved={onSaved} />;
  } else if (target?.mode === 'edit') {
    body =
      data && data.id === target.id ? (
        <ProductForm key={`edit-${target.id}`} product={data} onClose={onClose} onSaved={onSaved} />
      ) : (
        <div className="px-6 py-10 text-center text-sm">
          <h2 id="product-form-title" className="sr-only">
            Edit product
          </h2>
          {isError ? (
            <p className="text-rose-600">Couldn't load this product.</p>
          ) : (
            <p className="text-slate-500">{isLoading ? 'Loading product…' : ' '}</p>
          )}
          <Button variant="secondary" fullWidth={false} className="mx-auto mt-4" onClick={onClose}>
            Close
          </Button>
        </div>
      );
  }

  // No onClose on the Modal: Esc or a stray click outside shouldn't throw away what was typed
  return (
    <Modal open={target !== null} labelledBy="product-form-title" variant="panel">
      {body}
    </Modal>
  );
}

interface FormProps {
  product?: ProductDetail;
  onClose: () => void;
  onSaved: (message: string) => void;
}

function ProductForm({ product, onClose, onSaved }: FormProps) {
  const { user } = useAuth();
  const { stores, activeStore } = useStores();
  const { data: categories = [] } = useCategories();
  const { data: suppliers = [] } = useSuppliers();
  const createCategory = useCreateCategory();
  const createSupplier = useCreateSupplier();
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();

  const isEdit = product !== undefined;
  const isOwner = user?.role === 'Owner';
  const awaitingReview = product?.status === 'Pending' || product?.status === 'Rejected';
  const saving = createMutation.isPending || updateMutation.isPending;

  const [name, setName] = useState(product?.name ?? '');
  const [sku, setSku] = useState(product?.sku ?? '');
  const [barcode, setBarcode] = useState(product?.barcode ?? '');
  const [categoryId, setCategoryId] = useState(product?.categoryId ? String(product.categoryId) : '');
  const [supplierId, setSupplierId] = useState(product?.supplierId ? String(product.supplierId) : '');
  const [cost, setCost] = useState(product ? String(product.costPrice) : '0');
  const [price, setPrice] = useState(product ? String(product.sellingPrice) : '0');
  const [opening, setOpening] = useState(
    product ? String(product.pendingOpeningStock) : '0',
  );
  const [reorder, setReorder] = useState(product ? String(product.reorderLevel) : '10');
  const [imageUrl, setImageUrl] = useState(product ? (product.imageUrl ?? '') : PLACEHOLDER_IMAGE);
  const [description, setDescription] = useState(product?.description ?? '');
  const [availableInPos, setAvailableInPos] = useState(product?.availableInPos ?? true);
  const [storeId, setStoreId] = useState(activeStore ? String(activeStore.id) : '');
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState('');

  const costN = toNumber(cost);
  const priceN = toNumber(price);
  const margin = Number.isFinite(costN) && Number.isFinite(priceN) && priceN > 0 ? ((priceN - costN) / priceN) * 100 : 0;

  const categoryChoices = categories.map((c) => ({ value: String(c.id), label: c.name }));
  const supplierChoices = suppliers.map((s) => ({ value: String(s.id), label: s.name }));
  const storeOptions = stores.map((s) => ({ value: String(s.id), label: s.name }));

  const addCategory = async (n: string) => {
    const made = await createCategory.mutateAsync(n);
    return { value: String(made.id), label: made.name };
  };
  const addSupplier = async (n: string) => {
    const made = await createSupplier.mutateAsync(n);
    return { value: String(made.id), label: made.name };
  };

  const validate = (): Errors => {
    const e: Errors = {};
    if (!name.trim()) e.name = 'Enter a product name.';
    if (!sku.trim()) e.sku = 'Enter a SKU.';
    else if (/\s/.test(sku.trim())) e.sku = "SKU can't contain spaces.";
    if (!Number.isFinite(costN) || costN < 0) e.cost = 'Enter a cost of 0 or more.';
    if (!Number.isFinite(priceN) || priceN < 0) e.price = 'Enter a price of 0 or more.';
    const reorderN = toNumber(reorder);
    if (!Number.isInteger(reorderN) || reorderN < 0) e.reorder = 'Enter a whole number, 0 or more.';
    const openingN = toNumber(opening);
    if ((!isEdit || awaitingReview) && (!Number.isInteger(openingN) || openingN < 0))
      e.opening = 'Enter a whole number, 0 or more.';
    if (!isEdit && isOwner && openingN > 0 && !storeId) e.store = 'Pick the store that receives this stock.';
    const url = imageUrl.trim();
    if (url && !/^https?:\/\//i.test(url)) e.image = 'Use a link that starts with http:// or https://.';
    return e;
  };

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    setServerError('');

    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const values = {
      name: name.trim(),
      sku: sku.trim(),
      barcode: barcode.trim() || null,
      categoryId: categoryId ? Number(categoryId) : null,
      supplierId: supplierId ? Number(supplierId) : null,
      costPrice: costN,
      sellingPrice: priceN,
      reorderLevel: Number(reorder),
      imageUrl: imageUrl.trim() || null,
      description: description.trim() || null,
      availableInPos,
    };

    try {
      if (isEdit) {
        await updateMutation.mutateAsync({
          id: product.id,
          req: { ...values, pendingOpeningStock: awaitingReview ? Number(opening) : undefined },
        });
        onSaved(`Changes to ${values.name} were saved.`);
      } else {
        await createMutation.mutateAsync({
          ...values,
          openingStock: Number(opening),
          storeId: isOwner && storeId ? Number(storeId) : null,
        });
        onSaved(
          isOwner
            ? `${values.name} was added to the catalogue.`
            : `${values.name} was sent to the owner for approval.`,
        );
      }
      onClose();
    } catch (e) {
      setServerError(e instanceof Error ? e.message : 'Something went wrong. Try again.');
    }
  };

  const showStoreSelect = !isEdit && isOwner;
  const title = isEdit ? `Edit ${product.name}` : 'New product';
  const subtitle = isEdit ? 'Changes are logged to the audit trail.' : 'Opening stock also records a stock movement.';

  return (
    <form onSubmit={submit} noValidate>
      <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-100 bg-white px-6 py-4">
        <div className="min-w-0">
          <h2 id="product-form-title" className="truncate text-base font-semibold text-slate-900">
            {title}
          </h2>
          <p className="text-xs text-slate-500">{subtitle}</p>
        </div>
        <Button variant="view" icon="ri-close-line" disabled={saving} onClick={onClose}>
          Close
        </Button>
      </div>

      <div className="space-y-4 px-6 py-5">
        {!isEdit && !isOwner && (
          <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
            New products from managers are reviewed by the owner. This one stays out of the POS until it's approved, and
            its opening stock is added to your store then.
          </p>
        )}
        {isEdit && product.status === 'Rejected' && !isOwner && (
          <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800">
            Rejected{product.rejectionReason ? `: ${product.rejectionReason}` : '.'} Saving your changes sends it back to
            the owner for approval.
          </p>
        )}
        {serverError && (
          <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
            {serverError}
          </p>
        )}

        <Input
          label="Product name"
          value={name}
          onChange={setName}
          placeholder="Kopiko Black 3-in-1 Coffee 30g"
          error={errors.name}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="SKU"
            value={sku}
            onChange={(v) => setSku(v.toUpperCase())}
            placeholder="KOP-3IN1-30"
            hint="Must be unique across the catalogue"
            error={errors.sku}
          />
          <Input label="Barcode" value={barcode} onChange={setBarcode} placeholder="4800361412110" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <CreatableSelect
            label="Category"
            entity="category"
            value={categoryId}
            onChange={setCategoryId}
            options={categoryChoices}
            onCreate={addCategory}
          />
          <CreatableSelect
            label="Supplier"
            entity="supplier"
            value={supplierId}
            onChange={setSupplierId}
            options={supplierChoices}
            onCreate={addSupplier}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Cost price (₱)"
            type="number"
            min={0}
            step="0.01"
            inputMode="decimal"
            value={cost}
            onChange={setCost}
            error={errors.cost}
          />
          <Input
            label="Selling price (₱)"
            type="number"
            min={0}
            step="0.01"
            inputMode="decimal"
            value={price}
            onChange={setPrice}
            error={errors.price}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {isEdit && !awaitingReview ? (
            <div>
              <p className={labelCls}>Stock on hand</p>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700">
                {product.stock}
              </div>
              <p className="mt-1.5 text-xs text-slate-500">Stock changes are recorded from Inventory.</p>
            </div>
          ) : (
            <Input
              label="Opening stock"
              type="number"
              min={0}
              step="1"
              inputMode="numeric"
              value={opening}
              onChange={setOpening}
              error={errors.opening}
            />
          )}
          <Input
            label="Reorder level"
            type="number"
            min={0}
            step="1"
            inputMode="numeric"
            value={reorder}
            onChange={setReorder}
            error={errors.reorder}
          />
        </div>

        {showStoreSelect && (
          <Select
            label="Store for opening stock"
            value={storeId}
            options={storeOptions}
            placeholder="Pick a store"
            onChange={setStoreId}
            error={errors.store}
          />
        )}

        <Input
          label="Image URL"
          value={imageUrl}
          onChange={setImageUrl}
          hint="Leave the placeholder to keep the demo catalogue consistent"
          error={errors.image}
        />

        <div>
          <label htmlFor="product-description" className={labelCls}>
            Description
          </label>
          <textarea
            id="product-description"
            rows={3}
            maxLength={1000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={textarea}
          />
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={availableInPos}
            onChange={(e) => setAvailableInPos(e.target.checked)}
            className="size-4 cursor-pointer accent-brand"
          />
          Available in the point of sale
        </label>
      </div>

      <div className="sticky bottom-0 flex items-center justify-between gap-4 border-t border-slate-100 bg-white px-6 py-4">
        <p className="text-xs text-slate-500">
          Margin: <span className="font-semibold text-slate-900">{margin.toFixed(1)}%</span>
        </p>
        <div className="flex gap-3">
          <Button variant="cancel" fullWidth={false} disabled={saving} onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            fullWidth={false}
            loading={saving}
            loadingText={isEdit ? 'Saving…' : 'Creating…'}
          >
            {isEdit ? 'Save changes' : isOwner ? 'Create product' : 'Submit for approval'}
          </Button>
        </div>
      </div>
    </form>
  );
}
