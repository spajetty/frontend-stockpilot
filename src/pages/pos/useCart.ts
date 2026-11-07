import { useCallback, useMemo, useState } from 'react';
import type { PosProduct } from '../../api/posApi';

export interface CartLine {
  productId: number;
  name: string;
  sku: string;
  price: number;
  imageUrl: string | null;
  qty: number;
}

export function useCart() {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [discount, setDiscount] = useState(0);

  const add = useCallback((p: PosProduct) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.productId === p.id);
      if (existing) {
        if (existing.qty >= p.stock) return prev;   
        return prev.map((l) => (l.productId === p.id ? { ...l, qty: l.qty + 1 } : l));
      }
      if (p.stock <= 0) return prev;
      return [...prev, { productId: p.id, name: p.name, sku: p.sku, price: p.price, imageUrl: p.imageUrl, qty: 1 }];
    });
  }, []);

  const setQty = useCallback((productId: number, qty: number) => {
    setLines((prev) =>
      qty <= 0
        ? prev.filter((l) => l.productId !== productId)
        : prev.map((l) => (l.productId === productId ? { ...l, qty } : l)));
  }, []);

  const remove = useCallback((productId: number) => {
    setLines((prev) => prev.filter((l) => l.productId !== productId));
  }, []);

  const clear = useCallback(() => { setLines([]); setDiscount(0); }, []);

  const qtyById = useMemo(() => new Map(lines.map((l) => [l.productId, l.qty])), [lines]);

  return { lines, discount, setDiscount, add, setQty, remove, clear, qtyById };
}