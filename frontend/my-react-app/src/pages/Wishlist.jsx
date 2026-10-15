import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import WishlistCard from "../components/WishlistCard";
import { getWishlist, removeFromWishlist } from "../services/api";
import "../css/Wishlist.css";

export default function Wishlist() {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchWishlist = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getWishlist();
      setWishlistItems(res.data?.wishlist || []);
    } catch (err) {
      setError("Unable to load wishlist.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const handleRemove = async (id) => {
    try {
      await removeFromWishlist(id);
      // Immediately remove from local state without page refresh
      setWishlistItems((prev) =>
        prev.filter((item) => item._id !== id && item.product?._id !== id)
      );
    } catch (err) {
      alert("Failed to remove product from wishlist. Please try again.");
      throw err;
    }
  };

  return (
    <div className="wishlist-container">
      <div className="wishlist-header">
        <h1 className="wishlist-title">My Wishlist</h1>
        <p className="wishlist-subtitle">Manage items you have saved for later</p>
      </div>

      {/* Task 7: Loading State */}
      {loading && (
        <div className="wishlist-status-box wishlist-loading" role="status">
          <div className="wishlist-spinner"></div>
          <p>Loading your wishlist...</p>
        </div>
      )}

      {/* Task 7: Error State */}
      {!loading && error && (
        <div className="wishlist-status-box wishlist-error" role="alert">
          <p className="wishlist-error-message">{error}</p>
          <button
            type="button"
            className="wishlist-retry-btn"
            onClick={fetchWishlist}
          >
            Try Again
          </button>
        </div>
      )}

      {/* Task 7: Empty State */}
      {!loading && !error && wishlistItems.length === 0 && (
        <div className="wishlist-status-box wishlist-empty">
          <h2 className="wishlist-empty-heading">Your wishlist is empty ❤️</h2>
          <p className="wishlist-empty-text">Start saving products you love.</p>
          <Link to="/products" className="wishlist-browse-btn">
            Browse Products
          </Link>
        </div>
      )}

      {/* Task 6: Dynamically rendered wishlist cards */}
      {!loading && !error && wishlistItems.length > 0 && (
        <div className="wishlist-grid">
          {wishlistItems.map((item) => (
            <WishlistCard
              key={item._id}
              item={item}
              onRemove={handleRemove}
            />
          ))}
        </div>
      )}
    </div>
  );
}
