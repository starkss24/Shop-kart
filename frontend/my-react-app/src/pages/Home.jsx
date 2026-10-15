import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getProfile } from "../services/api";
import '../css/Home.css'
function Home() {
  const navigate = useNavigate();

  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // NOTE: hits GET /customers/profile (task spec says /customers/me —
        // rename the backend route if you want the exact path to match).
        const res = await getProfile();
        setCustomer(res.data.customer);
      } catch (err) {
        // Not logged in / invalid or expired token -> redirect to /login
        if (err.response?.status === 401) {
          navigate("/login");
        } else {
          setError("Something went wrong while loading your profile.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  if (loading) {
    return (
      <div style={styles.container}>
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <p style={styles.error}>{error}</p>
      </div>
    );
  }

  // Guard: if somehow no customer and no redirect happened yet
  if (!customer) return null;

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.heading}>Welcome, {customer.fullName}!</h2>
        <div style={styles.detailRow}>
          <span style={styles.label}>Name:</span>
          <span>{customer.fullName}</span>
        </div>
        <div style={styles.detailRow}>
          <span style={styles.label}>Email:</span>
          <span>{customer.email}</span>
        </div>
        <div style={styles.detailRow}>
          <span style={styles.label}>Phone:</span>
          <span>{customer.phone}</span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "80vh",
    padding: "1rem",
  },
  card: {
    width: "100%",
    maxWidth: "400px",
    padding: "2rem",
    border: "1px solid #e2e2e2",
    borderRadius: "8px",
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  },
  heading: {
    marginBottom: "0.5rem",
    fontSize: "1.4rem",
  },
  detailRow: {
    display: "flex",
    justifyContent: "space-between",
    borderBottom: "1px solid #f0f0f0",
    paddingBottom: "0.5rem",
  },
  label: {
    fontWeight: 600,
    color: "#555",
  },
  error: {
    color: "#d32f2f",
  },
};

export default Home;