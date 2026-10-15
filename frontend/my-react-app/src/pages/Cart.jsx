import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import CartItem from "../components/CartItem";
import { getCart, updateCart, removeFromCart } from "../services/api";
import { useCart } from "../context/CartContext";
import "../css/Cart.css";

export default function Cart() {
  const navigate = useNavigate();
  const { updateCartState } = useCart();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCart = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getCart();
      const items = res.data?.userCart?.cart || [];
      setCartItems(items);
      updateCartState(items);
    } catch (err) {
      console.error("Error fetching cart:", err);
      setError(
        err.response?.data?.message ||
          (err.response?.status === 401
            ? "Please log in to view your cart."
            : "Failed to load your cart.")
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const handleUpdateQty = async (productId, newQuantity) => {
    try {
      const res = await updateCart(productId, newQuantity);
      if (res.data?.userCart?.cart) {
        setCartItems(res.data.userCart.cart);
        updateCartState(res.data.userCart.cart);
      } else {
        setCartItems((prev) => {
          const updated = prev.map((item) => {
            const id = item.product_id?._id || item.product_id;
            return id === productId ? { ...item, quantity: newQuantity } : item;
          });
          updateCartState(updated);
          return updated;
        });
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update item quantity.");
      throw err;
    }
  };

  const handleRemove = async (productId) => {
    try {
      const res = await removeFromCart(productId);
      if (res.data?.userCart?.cart) {
        setCartItems(res.data.userCart.cart);
        updateCartState(res.data.userCart.cart);
      } else {
        setCartItems((prev) => {
          const updated = prev.filter((item) => {
            const id = item.product_id?._id || item.product_id;
            return id !== productId;
          });
          updateCartState(updated);
          return updated;
        });
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to remove item from cart.");
      throw err;
    }
  };

  const totalItems = cartItems.reduce(
    (sum, item) => sum + (item.quantity || 0),
    0
  );

  const subtotal = cartItems.reduce((sum, item) => {
    const price = Number(item.product_id?.price || 0);
    return sum + price * (item.quantity || 0);
  }, 0);

  return (
    <div className="cart-page-container">
      <div className="cart-header">
        <h1 className="cart-page-title">My Cart</h1>
      </div>

      {loading && (
        <div className="cart-status-box cart-loading" role="status">
          <div className="cart-spinner"></div>
          <p>Loading your cart...</p>
        </div>
      )}

      {!loading && error && (
        <div className="cart-status-box cart-error" role="alert">
          <p className="cart-error-message">{error}</p>
          <button type="button" className="cart-retry-btn" onClick={fetchCart}>
            Try Again
          </button>
        </div>
      )}

      {!loading && !error && cartItems.length === 0 && (
        <div className="cart-status-box cart-empty">
          <h2 className="cart-empty-heading">Your Cart is Empty 🛒</h2>
          <p className="cart-empty-text">
            Looks like you haven&apos;t added any items yet.
          </p>
          <Link to="/products" className="cart-browse-btn">
            Browse Products
          </Link>
        </div>
      )}

      {!loading && !error && cartItems.length > 0 && (
        <div className="cart-content-layout">
          <div className="cart-items-section">
            <div className="cart-items-list">
              {cartItems.map((item) => {
                const pId = item.product_id?._id || item.product_id || item._id;
                return (
                  <CartItem
                    key={pId}
                    item={item}
                    onUpdateQty={handleUpdateQty}
                    onRemove={handleRemove}
                  />
                );
              })}
            </div>
          </div>

          <div className="cart-divider" />

          <div className="cart-summary-section">
            <div className="cart-summary-card">
              <h2 className="cart-summary-title">Order Summary</h2>

              <div className="cart-summary-row">
                <span>Items:</span>
                <span className="cart-summary-val">{totalItems}</span>
              </div>

              <div className="cart-summary-row subtotal-row">
                <span>Subtotal:</span>
                <span className="cart-summary-val subtotal-val">
                  ₹{subtotal.toLocaleString("en-IN")}
                </span>
              </div>

              <button
                type="button"
                className="cart-checkout-btn"
                onClick={() => navigate("/checkout")}
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
