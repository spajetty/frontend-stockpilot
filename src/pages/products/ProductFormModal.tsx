import { useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Button, Input, Modal } from '../../components';
import { useAuth } from '../../auth/AuthContext';
import { useStores } from '../../stores/StoreContext';
import { ProductConflictError, fetchProductDuplicates } from '../../api/productsApi';
import type { ProductDetail, ProductFieldErrors } from '../../api/productsApi';
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
import StoreMultiSelect from './StoreMultiSelect';

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

// Barcode is 13 digits (EAN-13). The SKU isn't typed: the server creates it from the category.
const BARCODE_LENGTH = 13;

type Errors = Partial<
  Record<'name' | 'category' | 'barcode' | 'cost' | 'price' | 'opening' | 'reorder' | 'store' | 'image', string>
>;

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
  const formRef = useRef<HTMLFormElement>(null);

  const isEdit = product !== undefined;
  const isOwner = user?.role === 'Owner';
  const awaitingReview = product?.status === 'Pending' || product?.status === 'Rejected';
  // A manager can send a rejected product back to the owner even if nothing else changed
  const resubmitting = product?.status === 'Rejected' && !isOwner;
  // The owner sets opening stock per store; a manager has one store, so one field
  const perStoreStock = !isEdit && isOwner;
  const saving = createMutation.isPending || updateMutation.isPending;

  const [name, setName] = useState(product?.name ?? '');
  const [barcode, setBarcode] = useState(product?.barcode ?? '');
  const [categoryId, setCategoryId] = useState(product?.categoryId ? String(product.categoryId) : '');
  const [supplierId, setSupplierId] = useState(product?.supplierId ? String(product.supplierId) : '');
  const [cost, setCost] = useState(product ? String(product.costPrice) : '0');
  const [price, setPrice] = useState(product ? String(product.sellingPrice) : '0');
  const [opening, setOpening] = useState(product ? String(product.pendingOpeningStock) : '0');
  const [reorder, setReorder] = useState(product ? String(product.reorderLevel) : '10');
  const [imageUrl, setImageUrl] = useState(product ? (product.imageUrl ?? '') : PLACEHOLDER_IMAGE);
  const [description, setDescription] = useState(product?.description ?? '');
  const [availableInPos, setAvailableInPos] = useState(product?.availableInPos ?? true);
  const [storeIds, setStoreIds] = useState<number[]>(activeStore ? [activeStore.id] : []);
  const [storeQty, setStoreQty] = useState<Record<number, string>>({});

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [dupErrors, setDupErrors] = useState<ProductFieldErrors>({});
  const [serverError, setServerError] = useState('');
  const checkSeq = useRef(0);

  const touch = (key: string) => setTouched((t) => (t[key] ? t : { ...t, [key]: true }));

  // Any edit clears the last save error, so the footer never shows a message about old input
  const on =
    <T,>(setter: (v: T) => void) =>
    (v: T) => {
      setter(v);
      setServerError('');
    };

  const clearDup = (field: keyof ProductFieldErrors) =>
    setDupErrors((d) => {
      if (!d[field]) return d;
      const next = { ...d };
      delete next[field];
      return next;
    });

  // Asks the server whether the name, barcode or image is already taken. Runs when a field loses focus.
  // Saving checks again, so a failed lookup here is safe to ignore.
  const checkDuplicates = async () => {
    const q = { name: name.trim(), barcode: barcode.trim(), imageUrl: imageUrl.trim() };
    if (!q.name && !q.barcode && !q.imageUrl) {
      setDupErrors({});
      return;
    }
    const seq = ++checkSeq.current;
    try {
      const fields = await fetchProductDuplicates({ ...q, excludeId: product?.id });
      if (seq === checkSeq.current) setDupErrors(fields);
    } catch {
      /* the check on save will catch it */
    }
  };

  const costN = toNumber(cost);
  const priceN = toNumber(price);
  const margin = Number.isFinite(costN) && Number.isFinite(priceN) && priceN > 0 ? ((priceN - costN) / priceN) * 100 : 0;

  const categoryChoices = categories.map((c) => ({ value: String(c.id), label: c.name }));
  const supplierChoices = suppliers.map((s) => ({ value: String(s.id), label: s.name }));

  const addCategory = async (n: string) => {
    const made = await createCategory.mutateAsync(n);
    return { value: String(made.id), label: made.name };
  };
  const addSupplier = async (n: string) => {
    const made = await createSupplier.mutateAsync(n);
    return { value: String(made.id), label: made.name };
  };

  const barcodeChanged = !isEdit || barcode.trim() !== (product.barcode ?? '');
  const qtyOf = (id: number) => storeQty[id] ?? '0';

  // Recomputed on every render, so an error disappears the moment the input is fixed
  const validate = (): Errors => {
    const e: Errors = {};
    if (!name.trim()) e.name = 'Enter a product name.';
    if (!isEdit && !categoryId) e.category = "Pick a category. It sets the product's SKU.";

    // An old barcode that doesn't fit the format is fine as long as it isn't changed
    const barcodeText = barcode.trim();
    if (barcodeText && barcodeChanged && !/^[0-9]+$/.test(barcodeText)) e.barcode = 'Barcode can only have numbers.';
    else if (barcodeText && barcodeChanged && barcodeText.length !== BARCODE_LENGTH)
      e.barcode = `Barcode must be exactly ${BARCODE_LENGTH} digits. You've entered ${barcodeText.length}.`;

    if (!Number.isFinite(costN) || costN < 0) e.cost = 'Enter a cost of 0 or more.';
    if (!Number.isFinite(priceN) || priceN < 0) e.price = 'Enter a price of 0 or more.';
    const reorderN = toNumber(reorder);
    if (!Number.isInteger(reorderN) || reorderN < 0) e.reorder = 'Enter a whole number, 0 or more.';

    const openingN = toNumber(opening);
    if (((!isEdit && !isOwner) || awaitingReview) && (!Number.isInteger(openingN) || openingN < 0))
      e.opening = 'Enter a whole number, 0 or more.';

    if (perStoreStock && storeIds.some((id) => !/^[0-9]+$/.test(qtyOf(id).trim())))
      e.store = 'Enter a whole number, 0 or more, for every selected store.';

    const url = imageUrl.trim();
    if (url && !/^https?:\/\//i.test(url)) e.image = 'Use a link that starts with http:// or https://.';
    return e;
  };

  const validation = validate();
  const shown = (key: keyof Errors) => (touched[key] ? validation[key] : undefined);
  const hasValidationErrors = Object.keys(validation).length > 0;
  const hasDupErrors = Object.values(dupErrors).some(Boolean);
  const hasVisibleErrors = hasDupErrors || Object.keys(validation).some((k) => touched[k] || k === 'store');

  // In edit mode there's nothing to save until something actually changed
  const dirty =
    !isEdit ||
    name.trim() !== product.name ||
    barcode.trim() !== (product.barcode ?? '') ||
    categoryId !== (product.categoryId ? String(product.categoryId) : '') ||
    supplierId !== (product.supplierId ? String(product.supplierId) : '') ||
    costN !== product.costPrice ||
    priceN !== product.sellingPrice ||
    Number(reorder) !== product.reorderLevel ||
    imageUrl.trim() !== (product.imageUrl ?? '') ||
    description.trim() !== (product.description ?? '') ||
    availableInPos !== product.availableInPos ||
    (awaitingReview && Number(opening) !== product.pendingOpeningStock);

  const canSubmit = !saving && !hasValidationErrors && !hasDupErrors && (dirty || resubmitting);

  // Moves to the first field with an error, so a failed save is never silent on a long form
  const showFirstError = () => {
    window.setTimeout(() => {
      const el = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
      el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      el?.focus({ preventScroll: true });
    }, 50);
  };

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    if (!canSubmit) return;
    setServerError('');

    const values = {
      name: name.trim(),
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
        onSaved(
          resubmitting
            ? `${values.name} was sent back to the owner for approval.`
            : `Changes to ${values.name} were saved.`,
        );
      } else {
        const created = await createMutation.mutateAsync({
          ...values,
          openingStock: isOwner ? 0 : Number(opening),
          storeStocks: isOwner ? storeIds.map((id) => ({ storeId: id, quantity: Number(qtyOf(id)) })) : [],
        });
        onSaved(
          isOwner
            ? `${values.name} was added with SKU ${created.sku}.`
            : `${values.name} was sent to the owner for approval with SKU ${created.sku}.`,
        );
      }
      onClose();
    } catch (e) {
      if (e instanceof ProductConflictError) setDupErrors(e.fields);
      setServerError(e instanceof Error ? e.message : 'Something went wrong. Try again.');
      showFirstError();
    }
  };

  const title = isEdit ? `Edit ${product.name}` : 'New product';
  const subtitle = isEdit ? 'Changes are logged to the audit trail.' : 'Opening stock also records a stock movement.';
  const submitLabel = isEdit
    ? resubmitting
      ? 'Resubmit for approval'
      : 'Save changes'
    : isOwner
      ? 'Create product'
      : 'Submit for approval';

  return (
    <form ref={formRef} onSubmit={submit} noValidate>
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

        <Input
          label="Product name"
          value={name}
          onChange={on((v: string) => {
            setName(v);
            clearDup('name');
          })}
          onBlur={() => {
            touch('name');
            void checkDuplicates();
          }}
          placeholder="Kopiko Black 3-in-1 Coffee 30g"
          error={shown('name') ?? dupErrors.name}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <CreatableSelect
            label="Category"
            entity="category"
            required={!isEdit}
            value={categoryId}
            onChange={on(setCategoryId)}
            onTouched={() => touch('category')}
            options={categoryChoices}
            onCreate={addCategory}
            hint={
              isEdit
                ? "The SKU stays the same if you change the category."
                : 'The SKU is created automatically from the category, for example BEV-0010.'
            }
            error={shown('category')}
          />
          <CreatableSelect
            label="Supplier"
            entity="supplier"
            value={supplierId}
            onChange={on(setSupplierId)}
            options={supplierChoices}
            onCreate={addSupplier}
          />
        </div>

        <Input
          label="Barcode"
          value={barcode}
          onChange={on((v: string) => {
            setBarcode(v.replace(/[^0-9]/g, '').slice(0, BARCODE_LENGTH));
            clearDup('barcode');
          })}
          onBlur={() => {
            touch('barcode');
            void checkDuplicates();
          }}
          // A barcode scanner types the digits and then presses Enter. That shouldn't submit the form.
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.preventDefault();
          }}
          inputMode="numeric"
          maxLength={BARCODE_LENGTH}
          placeholder="4805000000002"
          hint={`Optional. ${BARCODE_LENGTH} digits, numbers only: type it or scan it. ${barcode.length}/${BARCODE_LENGTH}`}
          error={shown('barcode') ?? dupErrors.barcode}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Cost price (₱)"
            type="number"
            min={0}
            step="0.01"
            inputMode="decimal"
            value={cost}
            onChange={on(setCost)}
            onBlur={() => touch('cost')}
            error={shown('cost')}
          />
          <Input
            label="Selling price (₱)"
            type="number"
            min={0}
            step="0.01"
            inputMode="decimal"
            value={price}
            onChange={on(setPrice)}
            onBlur={() => touch('price')}
            error={shown('price')}
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
          ) : perStoreStock ? null : (
            <Input
              label="Opening stock"
              type="number"
              min={0}
              step="1"
              inputMode="numeric"
              value={opening}
              onChange={on(setOpening)}
              onBlur={() => touch('opening')}
              error={shown('opening')}
            />
          )}
          <Input
            label="Reorder level"
            type="number"
            min={0}
            step="1"
            inputMode="numeric"
            value={reorder}
            onChange={on(setReorder)}
            onBlur={() => touch('reorder')}
            error={shown('reorder')}
          />
        </div>

        {perStoreStock && (
          <StoreMultiSelect
            stores={stores}
            selected={storeIds}
            onChange={on(setStoreIds)}
            quantities={storeQty}
            onQuantityChange={(id, v) => {
              setStoreQty((q) => ({ ...q, [id]: v }));
              setServerError('');
            }}
            error={validation.store}
          />
        )}

        <Input
          label="Image URL"
          value={imageUrl}
          onChange={on((v: string) => {
            setImageUrl(v);
            clearDup('imageUrl');
          })}
          onBlur={() => {
            touch('image');
            void checkDuplicates();
          }}
          hint="Leave the placeholder to keep the demo catalogue consistent"
          error={shown('image') ?? dupErrors.imageUrl}
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
            onChange={(e) => {
              setDescription(e.target.value);
              setServerError('');
            }}
            className={textarea}
          />
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={availableInPos}
            onChange={(e) => {
              setAvailableInPos(e.target.checked);
              setServerError('');
            }}
            className="size-4 cursor-pointer accent-brand"
          />
          Available in the point of sale
        </label>
      </div>

      <div className="sticky bottom-0 flex items-center justify-between gap-4 border-t border-slate-100 bg-white px-6 py-4">
        {/* The footer stays on screen, so errors show here even when the field is scrolled out of view */}
        <div className="min-w-0 text-xs">
          {serverError ? (
            <p role="alert" className="text-red-600">
              {serverError}
            </p>
          ) : hasVisibleErrors ? (
            <p role="alert" className="text-red-600">
              Fix the highlighted fields to continue.
            </p>
          ) : isEdit && !dirty && !resubmitting ? (
            <p className="text-slate-500">No changes to save yet.</p>
          ) : (
            <p className="text-slate-500">
              Margin: <span className="font-semibold text-slate-900">{margin.toFixed(1)}%</span>
            </p>
          )}
        </div>
        <div className="flex shrink-0 gap-3">
          <Button variant="cancel" fullWidth={false} disabled={saving} onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            fullWidth={false}
            disabled={!canSubmit}
            loading={saving}
            loadingText={isEdit ? 'Saving…' : 'Creating…'}
          >
            {submitLabel}
          </Button>
        </div>
      </div>
    </form>
  );
}