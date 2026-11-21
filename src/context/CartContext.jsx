import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const CartContext = createContext(null);
const CART_KEY = "yuka_store_cart";

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    } catch (error) {
      console.error("Keranjang tersimpan tidak dapat dibaca.", error);
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }, [items]);

  function addItem(product) {
    setItems((current) => {
      const existing = current.find((item) => item.id === product.id);
      const nextQuantity = (existing?.quantity || 0) + 1;
      if (Number.isFinite(product.stock) && nextQuantity > product.stock) {
        return current;
      }
      if (existing) {
        return current.map((item) =>
          item.id === product.id ? { ...item, quantity: nextQuantity } : item,
        );
      }
      return [...current, { ...product, quantity: 1 }];
    });
  }

  function setQuantity(id, quantity) {
    setItems((current) =>
      quantity < 1
        ? current.filter((item) => item.id !== id)
        : current.map((item) =>
            item.id === id
              ? {
                  ...item,
                  quantity: Math.min(
                    quantity,
                    Number.isFinite(item.stock) ? item.stock : quantity,
                  ),
                }
              : item,
          ),
    );
  }

  function clearCart() {
    setItems([]);
  }

  const refreshProducts = useCallback((products) => {
    const productsById = new Map(products.map((product) => [product.id, product]));
    setItems((current) =>
      current.map((item) => {
        const latest = productsById.get(item.id);
        return latest
          ? { ...latest, quantity: item.quantity, unavailable: false }
          : { ...item, unavailable: true };
      }),
    );
  }, []);

  const value = useMemo(
    () => ({
      items,
      count: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      ),
      addItem,
      setQuantity,
      clearCart,
      refreshProducts,
    }),
    [items, refreshProducts],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart harus digunakan di dalam CartProvider.");
  }
  return context;
}
