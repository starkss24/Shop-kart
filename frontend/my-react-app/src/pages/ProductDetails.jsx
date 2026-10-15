import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getProductById, addToCart } from "../services/api";
import { getProductImage, handleImageError } from "../utils/imageUtils";
import "../css/ProductDetails.css";

export default function ProductDetails() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cartStatus, setCartStatus] = useState("idle");
  const [cartMsg, setCartMsg] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function fetchProduct() {
      try {
        setLoading(true);
        setError(null);
        const response = await getProductById(id);
        if (isMounted) {
          setProduct(response.data?.product || null);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err.response?.data?.message || "Something went wrong while loading product details."
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    if (id) {
      fetchProduct();
    }

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="product-details-page">
        <div className="status-message loading">Loading product details...</div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="product-details-page">
        <div className="status-message error">
          {error || "Product not found."}
        </div>
        <div className="back-navigation">
          <Link to="/products" className="back-link">
            &larr; Back to Products
          </Link>
        </div>
      </div>
    );
  }

  const inStock = product.stock > 0;

  return (
    <div className="product-details-page">
      <div className="back-navigation">
        <Link to="/products" className="back-link">
          &larr; Back to Products
        </Link>
      </div>

      <div className="product-details-container">
        {/* Large Product Image */}
        <div className="product-details-image-wrapper">
          <img
            src={getProductImage(product.image, product.name, product.category)}
            alt={product.name}
            className="product-details-image"
            onError={(e) => handleImageError(e, product.name, product.category)}
          />
        </div>

        {/* Product Information */}
        <div className="product-details-info">
          <span className="product-details-category">{product.category}</span>
          <h1 className="product-details-title">{product.name}</h1>

          <p className="product-details-price">
            ₹{Number(product.price).toLocaleString("en-IN")}
          </p>

          <p className={`details-stock-status ${inStock ? "in-stock" : "out-of-stock"}`}>
            {inStock ? `In Stock (${product.stock} units available)` : "Currently Out of Stock"}
          </p>

          <div className="product-details-description">
            <h3>Description</h3>
            <p>{product.description}</p>
          </div>

          <button
            type="button"
            className="add-to-cart-btn"
            disabled={!inStock || cartStatus === "adding"}
            onClick={async () => {
              if (!inStock || cartStatus === "adding") return;
              try {
                setCartStatus("adding");
                setCartMsg("");
                await addToCart(product._id);
                setCartStatus("added");
                setCartMsg("Item added to cart!");
                setTimeout(() => setCartStatus("idle"), 2500);
              } catch (err) {
                setCartStatus("error");
                setCartMsg(
                  err.response?.data?.message ||
                    (err.response?.status === 401
                      ? "Please login to add to cart."
                      : "Failed to add to cart.")
                );
                setTimeout(() => setCartStatus("idle"), 3000);
              }
            }}
          >
            {cartStatus === "adding"
              ? "Adding..."
              : cartStatus === "added"
              ? "Added to Cart ✓"
              : inStock
              ? "Add to Cart"
              : "Out of Stock"}
          </button>

          {cartMsg && (
            <p
              style={{
                marginTop: "0.5rem",
                fontSize: "0.9rem",
                color: cartStatus === "error" ? "#dc2626" : "#16a34a",
                fontWeight: 500,
              }}
            >
              {cartMsg}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
