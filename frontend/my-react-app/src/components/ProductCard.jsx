import { useState } from "react";
import { Link } from "react-router-dom";
import { addToWishlist, addToCart } from "../services/api";
import { getProductImage, handleImageError } from "../utils/imageUtils";
import "../css/ProductCard.css";

export default function ProductCard({ product }) {
  if (!product) return null;

  const { _id, name, image, price, category, stock } = product;
  const inStock = stock > 0;

  // States: 'idle' | 'saving' | 'saved' | 'error'
  const [wishlistStatus, setWishlistStatus] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");

  // Cart States: 'idle' | 'adding' | 'added' | 'error'
  const [cartStatus, setCartStatus] = useState("idle");
  const [cartError, setCartError] = useState("");

  const handleAddToWishlist = async () => {
    if (wishlistStatus === "saving" || wishlistStatus === "saved") return;

    try {
      setWishlistStatus("saving");
      setErrorMessage("");

      await addToWishlist(_id);
      setWishlistStatus("saved");
    } catch (err) {
      setWishlistStatus("error");
      const msg =
        err.response?.data?.message ||
        (err.response?.status === 401
          ? "Please login to add to wishlist."
          : "Failed to save to wishlist.");
      setErrorMessage(msg);
    }
  };

  const handleAddToCart = async () => {
    if (cartStatus === "adding" || !inStock) return;

    try {
      setCartStatus("adding");
      setCartError("");

      await addToCart(_id);
      setCartStatus("added");
      setTimeout(() => setCartStatus("idle"), 2500);
    } catch (err) {
      setCartStatus("error");
      const msg =
        err.response?.data?.message ||
        (err.response?.status === 401
          ? "Please login to add to cart."
          : "Failed to add to cart.");
      setCartError(msg);
      setTimeout(() => setCartStatus("idle"), 3000);
    }
  };

  return (
    <div className="product-card">
      <div className="product-image-container">
        <img
          src={getProductImage(image, name, category)}
          alt={name}
          className="product-image"
          onError={(e) => handleImageError(e, name, category)}
        />
      </div>

      <div className="product-card-body">
        <h3 className="product-name">{name}</h3>
        <span className="product-category">{category}</span>
        <p className="product-price">₹{Number(price).toLocaleString("en-IN")}</p>

        <p className={`stock-status ${inStock ? "in-stock" : "out-of-stock"}`}>
          {inStock ? `${stock} units left` : "Out of stock"}
        </p>

        <div className="card-actions">
          <button
            type="button"
            className={`card-add-cart-btn ${!inStock ? "disabled" : ""}`}
            onClick={handleAddToCart}
            disabled={!inStock || cartStatus === "adding"}
          >
            {cartStatus === "adding" && "Adding..."}
            {cartStatus === "added" && "Added to Cart ✓"}
            {cartStatus === "error" && "Failed to Add"}
            {cartStatus === "idle" && (inStock ? "Add to Cart" : "Out of Stock")}
          </button>

          <Link to={`/products/${_id}`} className="view-details-btn">
            View Details
          </Link>

          {/* Wishlist Button with states */}
          <button
            type="button"
            className={`wishlist-btn wishlist-${wishlistStatus}`}
            onClick={handleAddToWishlist}
            disabled={wishlistStatus === "saving" || wishlistStatus === "saved"}
          >
            {wishlistStatus === "idle" && "♡ Add to Wishlist"}
            {wishlistStatus === "saving" && "⏳ Saving..."}
            {wishlistStatus === "saved" && "♥ Wishlisted"}
            {wishlistStatus === "error" && "♡ Add to Wishlist"}
          </button>
        </div>

        {cartError && (
          <p className="cart-error-text" role="alert">
            {cartError}
          </p>
        )}

        {wishlistStatus === "error" && errorMessage && (
          <p className="wishlist-error-text" role="alert">
            {errorMessage}
          </p>
        )}
      </div>
    </div>
  );
}
