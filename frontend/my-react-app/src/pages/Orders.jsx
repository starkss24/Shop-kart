import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getOrders, updateOrderStatus } from "../services/api";
import { getProductImage, handleImageError } from "../utils/imageUtils";
import "../css/Orders.css";

const STATUS_STEPS = ["PLACED", "CONFIRMED", "SHIPPED", "DELIVERED"];

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUserOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getOrders();
      if (res.data?.success) {
        setOrders(res.data.orders || []);
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError(
        err.response?.data?.message ||
          (err.response?.status === 401
            ? "Please log in to view your orders."
            : "Failed to load orders.")
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserOrders();
  }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const res = await updateOrderStatus(orderId, newStatus);
      if (res.data?.success) {
        setOrders((prev) =>
          prev.map((ord) => (ord._id === orderId ? res.data.order : ord))
        );
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update status.");
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "PLACED":
        return "status-placed";
      case "CONFIRMED":
        return "status-confirmed";
      case "SHIPPED":
        return "status-shipped";
      case "DELIVERED":
        return "status-delivered";
      default:
        return "status-pending";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="orders-container">
      <div className="orders-header">
        <h1 className="orders-title">My Orders</h1>
      </div>

      {loading && (
        <div className="orders-loading-box">
          <p>Loading your orders...</p>
        </div>
      )}

      {!loading && error && (
        <div className="orders-error-box">
          <p style={{ color: "#ef4444" }}>{error}</p>
          <button type="button" className="retry-btn" onClick={fetchUserOrders}>
            Try Again
          </button>
        </div>
      )}

      {!loading && !error && orders.length === 0 && (
        <div className="orders-empty-box">
          <h2>You have not placed any orders yet.</h2>
          <p>Start shopping now to place your first order!</p>
          <Link to="/products" className="start-shopping-btn">
            Start Shopping
          </Link>
        </div>
      )}

      {!loading && !error && orders.length > 0 && (
        <div className="orders-list">
          {orders.map((order) => {
            const currentStepIdx = STATUS_STEPS.indexOf(order.status);

            return (
              <div key={order._id} className="order-card">
                <div className="order-card-header">
                  <div>
                    <div className="order-num">Order #{order._id}</div>
                    <div className="order-date">
                      Placed on {formatDate(order.createdAt)}
                    </div>
                  </div>

                  <div className="order-badges">
                    <span
                      className={`payment-badge-${
                        order.paymentStatus === "PAID" ? "paid" : "pending"
                      }`}
                    >
                      {order.paymentStatus}
                    </span>
                    <span
                      className={`status-badge ${getStatusClass(order.status)}`}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>

                {/* Status Progression Tracker (Bonus Challenge) */}
                {STATUS_STEPS.includes(order.status) && (
                  <div className="status-tracker">
                    {STATUS_STEPS.map((step, idx) => {
                      const isCompleted = idx < currentStepIdx;
                      const isCurrent = idx === currentStepIdx;

                      return (
                        <div
                          key={step}
                          className={`status-step ${
                            isCompleted ? "completed" : ""
                          } ${isCurrent ? "current" : ""}`}
                        >
                          <div className="step-circle">
                            {isCompleted ? "✓" : idx + 1}
                          </div>
                          <span>{step}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Items snapshot breakdown */}
                <div className="order-items-preview">
                  {order.items?.map((item, idx) => (
                    <div
                      key={item.product || idx}
                      className="order-item-row"
                    >
                      <div className="order-item-left">
                        <img
                          src={getProductImage(item.image, item.name)}
                          alt={item.name}
                          className="order-item-thumb"
                          onError={(e) => handleImageError(e, item.name)}
                        />
                        <span>
                          <strong>{item.name}</strong> × {item.quantity}
                        </span>
                      </div>
                      <div>
                        ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="order-card-footer">
                  <div className="order-total-amount">
                    Total: ₹{order.totalAmount?.toLocaleString("en-IN")}
                  </div>

                  <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                    <Link
                      to={`/orders/${order._id}`}
                      className="view-details-btn"
                    >
                      View Details
                    </Link>

                    {/* Bonus: Dev status changer */}
                    <select
                      className="status-select"
                      value={order.status}
                      onChange={(e) =>
                        handleStatusChange(order._id, e.target.value)
                      }
                      title="Update progression status"
                    >
                      <option value="PLACED">Set PLACED</option>
                      <option value="CONFIRMED">Set CONFIRMED</option>
                      <option value="SHIPPED">Set SHIPPED</option>
                      <option value="DELIVERED">Set DELIVERED</option>
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
