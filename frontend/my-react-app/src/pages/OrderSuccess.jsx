import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getOrderById } from "../services/api";
import "../css/OrderSuccess.css";

export default function OrderSuccess() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrder() {
      try {
        setLoading(true);
        const res = await getOrderById(id);
        if (res.data?.success) {
          setOrder(res.data.order);
        }
      } catch (err) {
        console.error("Error loading order confirmation:", err);
      } finally {
        setLoading(false);
      }
    }
    if (id) {
      fetchOrder();
    }
  }, [id]);

  return (
    <div className="order-success-container">
      <div className="success-icon-badge">✓</div>
      <h1 className="order-success-title">Order Placed Successfully!</h1>
      <p className="order-success-subtitle">
        Your order has been saved successfully.
      </p>

      {loading ? (
        <p>Loading order details...</p>
      ) : order ? (
        <div className="order-details-card">
          <div className="order-detail-row">
            <span className="order-detail-label">Order ID:</span>
            <span className="order-detail-value">{order._id}</span>
          </div>
          <div className="order-detail-row">
            <span className="order-detail-label">Total Amount:</span>
            <span className="order-detail-value" style={{ fontSize: "1.1rem", color: "#0f172a" }}>
              ₹{order.totalAmount?.toLocaleString("en-IN")}
            </span>
          </div>
          <div className="order-detail-row">
            <span className="order-detail-label">Status:</span>
            <span className="badge-status">{order.status}</span>
          </div>
          <div className="order-detail-row">
            <span className="order-detail-label">Payment Status:</span>
            <span style={{ color: "#16a34a", fontWeight: 700 }}>{order.paymentStatus}</span>
          </div>
          {order.shippingAddress && (
            <div className="order-detail-row">
              <span className="order-detail-label">Delivery To:</span>
              <span className="order-detail-value">
                {order.shippingAddress.fullName}, {order.shippingAddress.city},{" "}
                {order.shippingAddress.pincode}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="order-details-card">
          <div className="order-detail-row">
            <span className="order-detail-label">Order ID:</span>
            <span className="order-detail-value">{id}</span>
          </div>
          <div className="order-detail-row">
            <span className="order-detail-label">Status:</span>
            <span className="badge-status">PLACED</span>
          </div>
        </div>
      )}

      <div className="order-success-actions">
        <Link to="/orders" className="btn-primary">
          View My Orders
        </Link>
        <Link to="/products" className="btn-secondary">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
