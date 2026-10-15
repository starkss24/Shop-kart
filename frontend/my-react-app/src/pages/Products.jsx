import { useEffect, useState } from "react";
import ProductCard from "../components/ProductCard";
import SearchBar from "../components/SearchBar";
import { getProducts } from "../services/api";
import "../css/Products.css";
import "../css/SearchBar.css";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Categories");

  useEffect(() => {
    let isMounted = true;

    // Debounce search input to avoid hitting API on every keystroke
    const debounceTimer = setTimeout(async () => {
      try {
        setLoading(true);
        setError(null);

        const params = {};
        if (search.trim()) {
          params.search = search.trim();
        }
        if (category && category !== "All Categories") {
          params.category = category;
        }

        const response = await getProducts(params);
        if (isMounted) {
          setProducts(response.data?.products || []);
        }
      } catch (err) {
        if (isMounted) {
          setError("Something went wrong while loading products.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }, 300);

    return () => {
      isMounted = false;
      clearTimeout(debounceTimer);
    };
  }, [search, category]);

  return (
    <div className="products-container">
      <h1 className="products-title">Discover Products</h1>

      {/* Task 7: Search and Category Filter UI */}
      <SearchBar
        search={search}
        category={category}
        onSearchChange={setSearch}
        onCategoryChange={setCategory}
      />

      {/* Task 6 & State Handling */}
      {loading && (
        <div className="status-message loading" role="status">
          Loading products...
        </div>
      )}

      {!loading && error && (
        <div className="status-message error" role="alert">
          {error}
        </div>
      )}

      {!loading && !error && products.length === 0 && (
        <div className="status-message empty">
          No products found.
        </div>
      )}

      {!loading && !error && products.length > 0 && (
        <div className="products-grid">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
