import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getCart as fetchCartApi } from "../services/api";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [cartLoading, setCartLoading] = useState(false);

  const calculateCount = (items) => {
    if (!Array.isArray(items)) return 0;
    return items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  };

  const updateCartState = useCallback((items) => {
    const list = Array.isArray(items) ? items : [];
    setCartItems(list);
    setCartCount(calculateCount(list));
  }, []);

  const refreshCart = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      updateCartState([]);
      return [];
    }

    try {
      setCartLoading(true);
      const res = await fetchCartApi();
      const items = res.data?.userCart?.cart || [];
      updateCartState(items);
      return items;
    } catch (err) {
      console.error("CartContext fetch error:", err);
      return [];
    } finally {
      setCartLoading(false);
    }
  }, [updateCartState]);

  const clearCart = useCallback(() => {
    setCartItems([]);
    setCartCount(0);
  }, []);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartCount,
        cartLoading,
        refreshCart,
        updateCartState,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
