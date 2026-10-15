import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getOrderById } from "../services/api";
import { getProductImage, handleImageError } from "../utils/imageUtils";
import "../css/Orders.css";

const STATUS_STEPS = ["PLACED", "CONFIRMED", "SHIPPED", "DELIVERED"];

export default function OrderDetails() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchOrder() {
      try {
        setLoading(true);
        setError(null);
        const res = await getOrderById(id);
        if (res.data?.success) {
          setOrder(res.data.order);
        }
      } catch (err) {
        console.error("Error loading order:", err);
        setError(
          err.response?.data?.message ||
            (err.response?.status === 403
              ? "You do not have access to view this order."
              : "Failed to load order details.")
        );
      } finally {
        setLoading(false);
      }
    }
    if (id) {
      fetchOrder();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="orders-container">
        <div className="orders-loading-box">
          <p>Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="orders-container">
        <div className="orders-error-box">
          <p style={{ color: "#ef4444" }}>{error || "Order not found."}</p>
          <Link to="/orders" className="view-details-btn" style={{ marginTop: "1rem", display: "inline-block" }}>
            ← Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  const currentStepIdx = STATUS_STEPS.indexOf(order.status);

  return (
    <div className="orders-container">
      <div style={{ marginBottom: "1.5rem" }}>
        <Link to="/orders" style={{ textDecoration: "none", color: "#1976d2", fontWeight: 600 }}>
          ← Back to All Orders
        </Link>
      </div>

      <div className="order-card" style={{ marginBottom: "2rem" }}>
        <div className="order-card-header">
          <div>
            <h1 className="order-num" style={{ fontSize: "1.4rem" }}>Order #{order._id}</h1>
            <div className="order-date">
              Placed on {new Date(order.createdAt).toLocaleString("en-IN")}
            </div>
          </div>
          <div className="order-badges">
            <span className={`payment-badge-${order.paymentStatus === "PAID" ? "paid" : "pending"}`}>
              {order.paymentStatus}
            </span>
            <span className="badge-status">{order.status}</span>
          </div>
        </div>

        {/* Progression Tracker */}
        {STATUS_STEPS.includes(order.status) && (
          <div className="status-tracker" style={{ margin: "2rem 0" }}>
            {STATUS_STEPS.map((step, idx) => {
              const isCompleted = idx < currentStepIdx;
              const isCurrent = idx === currentStepIdx;
              return (
                <div
                  key={step}
                  className={`status-step ${isCompleted ? "completed" : ""} ${isCurrent ? "current" : ""}`}
                >
                  <div className="step-circle">{isCompleted ? "✓" : idx + 1}</div>
                  <span>{step}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Shipping Address Details */}
        {order.shippingAddress && (
          <div style={{ background: "#f8fafc", padding: "1.25rem", borderRadius: "8px", margin: "1.5rem 0" }}>
            <h3 style={{ margin: "0 0 0.75rem 0", fontSize: "1.1rem", color: "#0f172a" }}>
              Shipping Address
            </h3>
            <p style={{ margin: "0.25rem 0", color: "#334155" }}>
              <strong>Name:</strong> {order.shippingAddress.fullName}
            </p>
            <p style={{ margin: "0.25rem 0", color: "#334155" }}>
              <strong>Phone:</strong> {order.shippingAddress.phone}
            </p>
            <p style={{ margin: "0.25rem 0", color: "#334155" }}>
              <strong>Address:</strong> {order.shippingAddress.addressLine1}, {order.shippingAddress.city},{" "}
              {order.shippingAddress.state} - {order.shippingAddress.pincode}
            </p>
          </div>
        )}

        {/* Payment IDs snapshot */}
        <div style={{ background: "#f8fafc", padding: "1rem", borderRadius: "8px", margin: "1rem 0", fontSize: "0.85rem", color: "#64748b" }}>
          <div><strong>Razorpay Order ID:</strong> {order.razorpayOrderId || "N/A"}</div>
          {order.razorpayPaymentId && (
            <div style={{ marginTop: "0.3rem" }}><strong>Razorpay Payment ID:</strong> {order.razorpayPaymentId}</div>
          )}
        </div>

        {/* Items Table */}
        <h3 style={{ margin: "1.5rem 0 1rem 0", fontSize: "1.1rem", color: "#0f172a" }}>
          Ordered Items Snapshot
        </h3>
        <div className="order-items-preview">
          {order.items?.map((item, idx) => (
            <div key={item.product || idx} className="order-item-row" style={{ padding: "0.5rem 0", borderBottom: "1px solid #f1f5f9" }}>
              <div className="order-item-left">
                <img
                  src={getProductImage(item.image, item.name)}
                  alt={item.name}
                  className="order-item-thumb"
                  onError={(e) => handleImageError(e, item.name)}
                />
                <div>
                  <div style={{ fontWeight: 600, color: "#1e293b" }}>{item.name}</div>
                  <div style={{ fontSize: "0.85rem", color: "#64748b" }}>
                    Price at purchase: ₹{item.price?.toLocaleString("en-IN")} × {item.quantity}
                  </div>
                </div>
              </div>
              <div style={{ fontWeight: 700, color: "#0f172a" }}>
                ₹{(item.price * item.quantity).toLocaleString("en-IN")}
              </div>
            </div>
          ))}
        </div>

        <div className="order-card-footer" style={{ marginTop: "1.5rem" }}>
          <div style={{ color: "#64748b" }}>Payment Method: Razorpay Standard Checkout</div>
          <div className="order-total-amount" style={{ fontSize: "1.3rem" }}>
            Total Paid: ₹{order.totalAmount?.toLocaleString("en-IN")}
          </div>
        </div>
      </div>
    </div>
  );
}
