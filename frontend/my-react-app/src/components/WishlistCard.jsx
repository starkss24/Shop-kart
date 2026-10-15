import { useState } from "react";
import { Link } from "react-router-dom";
import { getProductImage, handleImageError } from "../utils/imageUtils";
import "../css/WishlistCard.css";

export default function WishlistCard({ item, onRemove }) {
  const [removing, setRemoving] = useState(false);

  if (!item) return null;

  // The item may be a wishlist document containing `product` populated, or the product directly
  const wishlistId = item._id;
  const product = item.product || item;
  const productId = product._id;
  const { name, image, price, category } = product;

  const handleRemove = async () => {
    if (removing) return;
    try {
      setRemoving(true);
      await onRemove(wishlistId || productId);
    } catch (err) {
      // Keep removing false so user can retry
      setRemoving(false);
    }
  };

  return (
    <div className="wishlist-card">
      <div className="wishlist-image-container">
        <img
          src={getProductImage(image, name, category)}
          alt={name}
          className="wishlist-image"
          onError={(e) => handleImageError(e, name, category)}
        />
      </div>

      <div className="wishlist-card-body">
        <h3 className="wishlist-product-name">{name}</h3>
        <span className="wishlist-product-category">{category}</span>
        <p className="wishlist-product-price">
          ₹{Number(price || 0).toLocaleString("en-IN")}
        </p>

        <div className="wishlist-card-actions">
          <Link to={`/products/${productId}`} className="wishlist-view-btn">
            View Details
          </Link>

          <button
            type="button"
            className="wishlist-remove-btn"
            onClick={handleRemove}
            disabled={removing}
          >
            {removing ? "Removing..." : "Remove from Wishlist"}
          </button>
        </div>
      </div>
    </div>
  );
}
