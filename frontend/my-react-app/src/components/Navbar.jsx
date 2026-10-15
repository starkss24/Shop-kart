import { useNavigate, Link, useLocation } from "react-router-dom";
import { logoutCustomer } from "../services/api";
import { useCart } from "../context/CartContext";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { cartCount, clearCart } = useCart();

  const isAuthPage =
    location.pathname === "/login" || location.pathname === "/register";

  const handleLogout = async () => {
    try {
      // Hits POST /customers/logout, which clears the HttpOnly cookie server-side
      await logoutCustomer();
    } catch (err) {
      // Even if the request fails (e.g. token already expired), we still
      // want to send the user back to Login rather than trap them here.
      console.error("Logout request failed:", err);
    } finally {
      localStorage.removeItem("token");
      clearCart();
      navigate("/login");
    }
  };

  return (
    <nav style={styles.navbar}>
      <Link to="/home" style={styles.brand}>
        ShopKart
      </Link>

      <div style={styles.links}>
        {isAuthPage ? (
          <>
            <Link to="/login" style={styles.link}>
              Login
            </Link>
            <Link to="/register" style={styles.link}>
              Register
            </Link>
          </>
        ) : (
          <>
            <Link to="/home" style={styles.link}>
              Home
            </Link>
            <Link to="/products" style={styles.link}>
              Products
            </Link>
            <Link to="/wishlist" style={styles.link}>
              Wishlist
            </Link>
            <Link to="/cart" style={styles.link}>
              Cart ({cartCount})
            </Link>
            <Link to="/orders" style={styles.link}>
              My Orders
            </Link>
            <button onClick={handleLogout} style={styles.logoutButton}>
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
}

const styles = {
  navbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0.75rem 1.5rem",
    borderBottom: "1px solid #e2e2e2",
  },
  brand: {
    fontSize: "1.2rem",
    fontWeight: 700,
    color: "#1976d2",
    textDecoration: "none",
  },
  links: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
  },
  link: {
    textDecoration: "none",
    color: "#333",
    fontSize: "0.95rem",
  },
  logoutButton: {
    padding: "0.4rem 0.9rem",
    fontSize: "0.9rem",
    fontWeight: 600,
    color: "#fff",
    backgroundColor: "#d32f2f",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
};

export default Navbar;