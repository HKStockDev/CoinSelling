'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Platform, Product } from './site';

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartState {
  platform: Platform;
  items: CartItem[];
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  setPlatform: (platform: Platform) => void;
  addItem: (product: Product, quantity?: number) => void;
  setItemQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
  totalPence: number;
  totalCoins: number;
  count: number;
}

const CartContext = createContext<CartState | null>(null);
const STORAGE_KEY = 'coinempire-cart-v1';

export function CartProvider({ children }: { children: ReactNode }) {
  const [platform, setPlatformState] = useState<Platform>('ps4_ps5');
  const [items, setItems] = useState<CartItem[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as {
          platform: Platform;
          items: CartItem[];
        };
        setPlatformState(parsed.platform ?? 'ps4_ps5');
        setItems(parsed.items ?? []);
      }
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ platform, items }));
  }, [platform, items, ready]);

  const setPlatform = useCallback((next: Platform) => {
    setPlatformState(next);
    setItems([]);
  }, []);

  const addItem = useCallback((product: Product, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id
            ? { ...i, quantity: i.quantity + quantity }
            : i,
        );
      }
      return [...prev, { product, quantity }];
    });
    setDrawerOpen(true);
  }, []);

  const setItemQuantity = useCallback((productId: string, quantity: number) => {
    setItems((prev) => {
      if (quantity <= 0) return prev.filter((i) => i.product.id !== productId);
      return prev.map((i) =>
        i.product.id === productId ? { ...i, quantity } : i,
      );
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.product.id !== productId));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const totalPence = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + item.product.price_gbp_pence * item.quantity,
        0,
      ),
    [items],
  );

  const totalCoins = useMemo(
    () =>
      items.reduce(
        (sum, item) =>
          sum +
          (item.product.coin_amount + item.product.bonus_coins) * item.quantity,
        0,
      ),
    [items],
  );

  const count = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  );

  const value = useMemo(
    () => ({
      platform,
      items,
      drawerOpen,
      setDrawerOpen,
      setPlatform,
      addItem,
      setItemQuantity,
      removeItem,
      clear,
      totalPence,
      totalCoins,
      count,
    }),
    [
      platform,
      items,
      drawerOpen,
      setPlatform,
      addItem,
      setItemQuantity,
      removeItem,
      clear,
      totalPence,
      totalCoins,
      count,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
