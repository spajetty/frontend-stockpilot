import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useStores } from '../stores/StoreContext';
import {
  approveProduct,
  createCategory,
  createProduct,
  createSupplier,
  fetchCategories,
  fetchProduct,
  fetchProducts,
  fetchSuppliers,
  productsKeys,
  rejectProduct,
  setProductActive,
  updateProduct,
} from '../api/productsApi';
import type { CreateProductRequest, ProductsQueryParams, UpdateProductRequest } from '../api/productsApi';

const STALE = 30_000;

function useScope(): number | null {
  const { activeStore } = useStores();
  return activeStore?.id ?? null;
}

export function useProducts(params: ProductsQueryParams) {
  const scope = useScope();
  return useQuery({
    queryKey: productsKeys.list(scope, params),
    queryFn: () => fetchProducts(params),
    placeholderData: keepPreviousData,
    staleTime: STALE,
  });
}

export function useProduct(id: number | null) {
  const scope = useScope();
  return useQuery({
    queryKey: productsKeys.detail(scope, id ?? 0),
    queryFn: () => fetchProduct(id as number),
    enabled: id != null,
    staleTime: STALE,
  });
}

export function usePendingProducts(enabled: boolean) {
  const scope = useScope();
  return useQuery({
    queryKey: productsKeys.pending(scope),
    queryFn: () =>
      fetchProducts({
        page: 1,
        pageSize: 50,
        search: '',
        categoryId: null,
        status: 'pending',
        sortBy: 'name',
        sortDir: 'asc',
      }),
    enabled,
    staleTime: STALE,
  });
}

export function useCategories() {
  return useQuery({ queryKey: productsKeys.categories, queryFn: fetchCategories });
}

export function useSuppliers() {
  return useQuery({ queryKey: productsKeys.suppliers, queryFn: fetchSuppliers });
}

function useRefreshProducts() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: productsKeys.all });
}

export function useCreateProduct() {
  const refresh = useRefreshProducts();
  return useMutation({ mutationFn: (req: CreateProductRequest) => createProduct(req), onSuccess: refresh });
}

export function useUpdateProduct() {
  const refresh = useRefreshProducts();
  return useMutation({
    mutationFn: ({ id, req }: { id: number; req: UpdateProductRequest }) => updateProduct(id, req),
    onSuccess: refresh,
  });
}

export function useSetProductActive() {
  const refresh = useRefreshProducts();
  return useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) => setProductActive(id, active),
    onSuccess: refresh,
  });
}

export function useApproveProduct() {
  const refresh = useRefreshProducts();
  return useMutation({ mutationFn: (id: number) => approveProduct(id), onSuccess: refresh });
}

export function useRejectProduct() {
  const refresh = useRefreshProducts();
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => rejectProduct(id, reason),
    onSuccess: refresh,
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => createCategory(name),
    onSuccess: () => qc.invalidateQueries({ queryKey: productsKeys.categories }),
  });
}

export function useCreateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => createSupplier(name),
    onSuccess: () => qc.invalidateQueries({ queryKey: productsKeys.suppliers }),
  });
}