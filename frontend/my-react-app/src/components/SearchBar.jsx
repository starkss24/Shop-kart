export default function SearchBar({ search, category, onSearchChange, onCategoryChange }) {
  const categories = [
    "All Categories",
    "Electronics",
    "Fashion",
    "Books",
    "Home",
  ];

  return (
    <div className="search-filter-container">
      <div className="search-input-wrapper">
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search products..."
          className="search-input"
          aria-label="Search products"
        />
      </div>

      <div className="category-select-wrapper">
        <select
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="category-select"
          aria-label="Filter by category"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
