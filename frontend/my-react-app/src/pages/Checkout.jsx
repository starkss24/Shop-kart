import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { createPaymentOrder, verifyPayment } from "../services/api";
import { getProductImage, handleImageError } from "../utils/imageUtils";
import "../css/Checkout.css";

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function Checkout() {
  const navigate = useNavigate();
  const { cartItems, refreshCart, clearCart, cartLoading } = useCart();

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    addressLine1: "",
    city: "",
    state: "",
    pincode: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [createdOrderData, setCreatedOrderData] = useState(null);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear field-level error upon typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required.";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required.";
    } else if (!/^[0-9]{10}$/.test(formData.phone.trim())) {
      newErrors.phone = "Phone number must be a valid 10-digit number.";
    }

    if (!formData.addressLine1.trim()) {
      newErrors.addressLine1 = "Address line is required.";
    }

    if (!formData.city.trim()) {
      newErrors.city = "City is required.";
    }

    if (!formData.state.trim()) {
      newErrors.state = "State is required.";
    }

    if (!formData.pincode.trim()) {
      newErrors.pincode = "Pincode is required.";
    } else if (!/^[0-9]{6}$/.test(formData.pincode.trim())) {
      newErrors.pincode = "Pincode must contain 6 digits.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const totalAmount = cartItems.reduce((sum, item) => {
    const price = Number(item.product_id?.price || 0);
    return sum + price * (item.quantity || 0);
  }, 0);

  const totalItemsCount = cartItems.reduce(
    (sum, item) => sum + (item.quantity || 0),
    0
  );

  const handlePlaceOrder = async (e) => {
    if (e) e.preventDefault();
    setErrorMessage("");

    // Basic client validation — do not call backend if invalid
    if (!validate()) {
      return;
    }

    try {
      setLoading(true);

      // 1. Create order on backend (server calculates true total and verifies stock)
      const res = await createPaymentOrder(formData);
      const data = res.data;

      if (!data.success) {
        throw new Error(data.message || "Failed to initiate payment.");
      }

      setCreatedOrderData(data);

      // 2. Load Razorpay Checkout Script
      const scriptLoaded = await loadRazorpayScript();

      if (!scriptLoaded) {
        setErrorMessage(
          "Could not load Razorpay SDK. Please check your internet connection or use simulation mode."
        );
        setLoading(false);
        return;
      }

      // 3. Configure Razorpay Options
      const options = {
        key: data.key,
        amount: data.amount,
        currency: data.currency,
        name: "ShopKart",
        description: "Order Checkout Payment",
        order_id: data.razorpayOrderId,
        handler: async function (response) {
          try {
            setLoading(true);
            // Verify payment signature on backend
            const verifyRes = await verifyPayment({
              shopKartOrderId: data.shopKartOrderId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verifyRes.data?.success) {
              // Clear global cart state and navigate to confirmation
              clearCart();
              navigate(`/order-success/${data.shopKartOrderId}`);
            } else {
              setErrorMessage(
                verifyRes.data?.message || "Payment verification failed."
              );
            }
          } catch (err) {
            console.error("Payment verification error:", err);
            setErrorMessage(
              err.response?.data?.message ||
                "Payment verification failed. Please try again."
            );
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: formData.fullName,
          contact: formData.phone,
        },
        theme: {
          color: "#1976d2",
        },
      };

      try {
        const paymentObject = new window.Razorpay(options);

        paymentObject.on("payment.failed", function (response) {
          console.error("Payment failed:", response.error);
          setErrorMessage(
            "Payment failed. Your cart has not been cleared. Please try again."
          );
          setLoading(false);
        });

        paymentObject.open();
      } catch (rzpOpenErr) {
        console.warn("Razorpay window open warning:", rzpOpenErr);
        // If razorpay cannot open due to test credentials, error is shown and simulation option is made available
        setErrorMessage(
          "Razorpay modal could not open (likely using placeholder test keys). You may use the Test Mode Simulation below."
        );
      }
    } catch (err) {
      console.error("Place order error:", err);
      setErrorMessage(
        err.response?.data?.message ||
          err.message ||
          "Failed to process order. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Helper for test mode / mock evaluation
  const handleSimulatePaymentSuccess = async () => {
    if (!createdOrderData) {
      alert("Please click 'Place Order' first to initiate the order.");
      return;
    }

    try {
      setLoading(true);
      const mockPaymentId = "pay_test_" + Math.random().toString(36).substring(2, 10);
      const simulatedSignature = "test_simulated_signature_" + createdOrderData.razorpayOrderId;

      const verifyRes = await verifyPayment({
        shopKartOrderId: createdOrderData.shopKartOrderId,
        razorpay_order_id: createdOrderData.razorpayOrderId,
        razorpay_payment_id: mockPaymentId,
        razorpay_signature: simulatedSignature,
      });

      if (verifyRes.data?.success) {
        clearCart();
        navigate(`/order-success/${createdOrderData.shopKartOrderId}`);
      }
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || "Simulated payment verification failed."
      );
    } finally {
      setLoading(false);
    }
  };

  if (cartLoading) {
    return (
      <div className="checkout-container">
        <div style={{ textAlign: "center", padding: "3rem" }}>
          <p>Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="checkout-container">
        <div className="empty-checkout-box">
          <h2>Your Cart is Empty 🛒</h2>
          <p>You cannot proceed to checkout without any items in your cart.</p>
          <Link to="/products" className="browse-btn">
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-container">
      <div className="checkout-header">
        <h1 className="checkout-title">Checkout</h1>
      </div>

      {errorMessage && (
        <div className="error-banner" role="alert">
          {errorMessage}
        </div>
      )}

      <div className="checkout-grid">
        {/* Left column: Shipping Details Form */}
        <div className="checkout-card">
          <h2 className="checkout-card-title">Shipping Details</h2>

          <form onSubmit={handlePlaceOrder} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="fullName">
                Full Name
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                className={`form-input ${errors.fullName ? "input-error" : ""}`}
                placeholder="Aarav Sharma"
                value={formData.fullName}
                onChange={handleChange}
              />
              {errors.fullName && (
                <span className="field-error">{errors.fullName}</span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="phone">
                Phone Number
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                className={`form-input ${errors.phone ? "input-error" : ""}`}
                placeholder="9876543210"
                value={formData.phone}
                onChange={handleChange}
              />
              {errors.phone && (
                <span className="field-error">{errors.phone}</span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="addressLine1">
                Address Line 1
              </label>
              <input
                id="addressLine1"
                name="addressLine1"
                type="text"
                className={`form-input ${
                  errors.addressLine1 ? "input-error" : ""
                }`}
                placeholder="22 MG Road, Koramangala"
                value={formData.addressLine1}
                onChange={handleChange}
              />
              {errors.addressLine1 && (
                <span className="field-error">{errors.addressLine1}</span>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="city">
                  City
                </label>
                <input
                  id="city"
                  name="city"
                  type="text"
                  className={`form-input ${errors.city ? "input-error" : ""}`}
                  placeholder="Bengaluru"
                  value={formData.city}
                  onChange={handleChange}
                />
                {errors.city && (
                  <span className="field-error">{errors.city}</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="state">
                  State
                </label>
                <input
                  id="state"
                  name="state"
                  type="text"
                  className={`form-input ${errors.state ? "input-error" : ""}`}
                  placeholder="Karnataka"
                  value={formData.state}
                  onChange={handleChange}
                />
                {errors.state && (
                  <span className="field-error">{errors.state}</span>
                )}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="pincode">
                Pincode
              </label>
              <input
                id="pincode"
                name="pincode"
                type="text"
                className={`form-input ${errors.pincode ? "input-error" : ""}`}
                placeholder="560001"
                value={formData.pincode}
                onChange={handleChange}
              />
              {errors.pincode && (
                <span className="field-error">{errors.pincode}</span>
              )}
            </div>
          </form>
        </div>

        {/* Right column: Order Summary */}
        <div className="checkout-card">
          <h2 className="checkout-card-title">Order Summary</h2>

          <div className="summary-items">
            {cartItems.map((item) => {
              const product = item.product_id || {};
              const price = Number(product.price || 0);
              const qty = Number(item.quantity || 1);
              const itemTotal = price * qty;

              return (
                <div key={product._id || item._id} className="summary-item">
                  <div className="summary-item-left">
                    <img
                      src={getProductImage(product.image, product.name, product.category)}
                      alt={product.name}
                      className="summary-item-img"
                      onError={(e) => handleImageError(e, product.name, product.category)}
                    />
                    <div>
                      <div className="summary-item-name">{product.name}</div>
                      <div className="summary-item-qty">Qty: {qty}</div>
                    </div>
                  </div>
                  <div className="summary-item-price">
                    ₹{itemTotal.toLocaleString("en-IN")}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="summary-calc">
            <div className="summary-row">
              <span>Total Items</span>
              <span>{totalItemsCount}</span>
            </div>
            <div className="summary-row">
              <span>Delivery</span>
              <span style={{ color: "#16a34a", fontWeight: 600 }}>FREE</span>
            </div>
            <div className="summary-row total-row">
              <span>Total</span>
              <span>₹{totalAmount.toLocaleString("en-IN")}</span>
            </div>
          </div>

          <button
            type="button"
            className="place-order-btn"
            onClick={handlePlaceOrder}
            disabled={loading}
          >
            {loading ? "Processing..." : "Place Order (Pay with Razorpay)"}
          </button>

          {createdOrderData && (
            <div className="test-payment-helper">
              <strong>Testing Assistant:</strong>
              <div>Order #{createdOrderData.shopKartOrderId.slice(-6)} initiated.</div>
              <button
                type="button"
                className="test-sim-btn"
                onClick={handleSimulatePaymentSuccess}
              >
                Simulate Successful Test Payment
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
