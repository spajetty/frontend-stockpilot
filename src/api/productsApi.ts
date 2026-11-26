import axios from 'axios';
import { api, apiError } from './client';

export const PRODUCTS_PAGE_SIZE = 8;

export type ProductStatusName = 'Active' | 'Inactive' | 'Pending' | 'Rejected';
export type ProductStatusFilter = 'all' | 'active' | 'inactive' | 'pending' | 'rejected';
export type ProductSortBy = 'name' | 'sku' | 'cost' | 'price' | 'margin' | 'stock';
export type SortDir = 'asc' | 'desc';

export interface ProductsQueryParams {
  page: number;
  pageSize?: number;
  search: string;
  categoryId: number | null;
  status: ProductStatusFilter;
  sortBy: ProductSortBy;
  sortDir: SortDir;
}

export interface ProductListItem {
  id: number;
  name: string;
  sku: string;
  barcode: string | null;
  categoryId: number | null;
  categoryName: string | null;
  supplierId: number | null;
  supplierName: string | null;
  costPrice: number;
  sellingPrice: number;
  margin: number;
  stock: number;
  reorderLevel: number;
  imageUrl: string | null;
  status: ProductStatusName;
  availableInPos: boolean;
  requestedByStoreName: string | null;
  pendingOpeningStock: number;
}

export interface ProductsPage {
  items: ProductListItem[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface ProductMovement {
  id: number;
  type: string;
  reference: string | null;
  reason: string | null;
  quantityChange: number;
  storeCode: string;
  createdAt: string;
}

export interface ProductSaleRef {
  saleId: number;
  saleNumber: string;
  createdAt: string;
  cashierName: string;
  total: number;
}

export interface ProductDetail extends ProductListItem {
  description: string | null;
  inventoryValue: number;
  rejectionReason: string | null;
  recentMovements: ProductMovement[];
  recentSales: ProductSaleRef[];
}

export interface ProductFormValues {
  name: string;
  barcode: string | null;
  categoryId: number | null;
  supplierId: number | null;
  costPrice: number;
  sellingPrice: number;
  reorderLevel: number;
  imageUrl: string | null;
  description: string | null;
  availableInPos: boolean;
}

export interface StoreStock {
  storeId: number;
  quantity: number;
}

// The SKU isn't sent: the server generates it from the category
export interface CreateProductRequest extends ProductFormValues {
  openingStock: number; // manager: opening stock for their own store
  storeStocks: StoreStock[]; // owner: each selected store with its own opening stock
}

export interface UpdateProductRequest extends ProductFormValues {
  pendingOpeningStock?: number; // only while the product is pending or rejected
}

export interface LookupOption {
  id: number;
  name: string;
}

export const productsKeys = {
  all: ['products'] as const,
  list: (storeId: number | null, p: ProductsQueryParams) => ['products', 'list', storeId, p] as const,
  detail: (storeId: number | null, id: number) => ['products', 'detail', storeId, id] as const,
  pending: (storeId: number | null) => ['products', 'pending', storeId] as const,
  categories: ['categories'] as const,
  suppliers: ['suppliers'] as const,
};

// Which form field a duplicate was found in, with the message to show under it
export type ProductFieldErrors = Partial<Record<'name' | 'barcode' | 'imageUrl', string>>;

// Thrown when the server finds the product already exists (HTTP 409 with per-field messages)
export class ProductConflictError extends Error {
  fields: ProductFieldErrors;

  constructor(message: string, fields: ProductFieldErrors) {
    super(message);
    this.name = 'ProductConflictError';
    this.fields = fields;
  }
}

// Turns any axios failure into an Error with a message that's safe to show
async function call<T>(run: () => Promise<{ data: T }>, fallback: string): Promise<T> {
  try {
    return (await run()).data;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const data = err.response?.data as { message?: string; fields?: ProductFieldErrors } | undefined;
      if (data?.fields && Object.keys(data.fields).length > 0) {
        throw new ProductConflictError(data.message ?? fallback, data.fields);
      }
    }
    throw apiError(err, fallback);
  }
}

function listParams(p: Omit<ProductsQueryParams, 'page' | 'pageSize'>) {
  return {
    search: p.search || undefined,
    categoryId: p.categoryId ?? undefined,
    status: p.status === 'all' ? undefined : p.status,
    sortBy: p.sortBy,
    sortDir: p.sortDir,
  };
}

export const fetchProducts = (p: ProductsQueryParams) =>
  call(
    () =>
      api.get<ProductsPage>('/products', {
        params: { page: p.page, pageSize: p.pageSize ?? PRODUCTS_PAGE_SIZE, ...listParams(p) },
      }),
    "Couldn't load products.",
  );

export const fetchProduct = (id: number) =>
  call(() => api.get<ProductDetail>(`/products/${id}`), "Couldn't load this product.");

export const createProduct = (req: CreateProductRequest) =>
  call(() => api.post<ProductDetail>('/products', req), "Couldn't create the product.");

export const updateProduct = (id: number, req: UpdateProductRequest) =>
  call(() => api.put<ProductDetail>(`/products/${id}`, req), "Couldn't save the changes.");

export const setProductActive = (id: number, active: boolean) =>
  call(
    () => api.post<ProductDetail>(`/products/${id}/${active ? 'reactivate' : 'deactivate'}`),
    active ? "Couldn't reactivate the product." : "Couldn't deactivate the product.",
  );

export const approveProduct = (id: number) =>
  call(() => api.post<ProductDetail>(`/products/${id}/approve`), "Couldn't approve the product.");

export const rejectProduct = (id: number, reason: string) =>
  call(() => api.post<ProductDetail>(`/products/${id}/reject`, { reason }), "Couldn't reject the product.");

// Checks name, barcode and image URL against the rest of the catalogue while the user types
export const fetchProductDuplicates = (q: {
  name: string;
  barcode: string;
  imageUrl: string;
  excludeId?: number;
}) =>
  call(
    () =>
      api.get<{ fields: ProductFieldErrors }>('/products/check-duplicates', {
        params: {
          name: q.name || undefined,
          barcode: q.barcode || undefined,
          imageUrl: q.imageUrl || undefined,
          excludeId: q.excludeId,
        },
      }),
    "Couldn't check for duplicates.",
  ).then((r) => r.fields);

export const fetchCategories = () =>
  call(() => api.get<LookupOption[]>('/categories'), "Couldn't load categories.");

export const createCategory = (name: string) =>
  call(() => api.post<LookupOption>('/categories', { name }), "Couldn't add the category.");

export const fetchSuppliers = () =>
  call(() => api.get<LookupOption[]>('/suppliers'), "Couldn't load suppliers.");

export const createSupplier = (name: string) =>
  call(() => api.post<LookupOption>('/suppliers', { name }), "Couldn't add the supplier.");

// Downloads every product that matches the current filters
export async function downloadProductsCsv(p: Omit<ProductsQueryParams, 'page' | 'pageSize'>): Promise<void> {
  const blob = await call(
    () => api.get<Blob>('/products/export', { params: listParams(p), responseType: 'blob' }),
    "Couldn't export products.",
  );
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `stockpilot-products-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}