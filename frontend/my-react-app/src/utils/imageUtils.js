/**
 * Image helper that provides reliable product images and a high-resolution SVG fallback
 * ensuring images never break even when offline or behind proxies/firewalls.
 */

const FALLBACK_PRODUCT_IMAGES = {
  "wireless headphones": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80",
  "mechanical keyboard": "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80",
  "running shoes": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80",
  "laptop backpack": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80",
  "smart watch": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80",
  "cotton hoodie": "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&auto=format&fit=crop&q=80",
  "stainless steel water bottle": "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&auto=format&fit=crop&q=80",
  "gaming mouse": "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=600&auto=format&fit=crop&q=80",
  "denim jeans": "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&auto=format&fit=crop&q=80",
  "desk lamp": "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&auto=format&fit=crop&q=80",
  "lab6 mechanical keyboard": "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80",
  "lab6 wireless mouse": "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=600&auto=format&fit=crop&q=80",
};

/**
 * Creates an offline-safe inline SVG Data URI for any product name and category.
 */
export function getSvgFallback(name = "Product", category = "Item") {
  const safeName = (name || "ShopKart").replace(/[^a-zA-Z0-9 ]/g, "").substring(0, 22);
  const safeCat = (category || "Product").replace(/[^a-zA-Z0-9 ]/g, "").substring(0, 18);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1e293b"/>
        <stop offset="100%" stop-color="#0f172a"/>
      </linearGradient>
    </defs>
    <rect width="400" height="300" fill="url(#bg)"/>
    <circle cx="200" cy="115" r="48" fill="#3b82f6" opacity="0.15"/>
    <path d="M175 125 L195 95 L215 120 L225 110 L235 125 Z" fill="#60a5fa"/>
    <circle cx="185" cy="100" r="5" fill="#fbbf24"/>
    <text x="200" y="190" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="600" fill="#f8fafc" text-anchor="middle">${safeName}</text>
    <text x="200" y="215" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="500" fill="#94a3b8" text-anchor="middle">${safeCat.toUpperCase()}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Resolves a reliable product image URL.
 */
export function getProductImage(image, name = "", category = "") {
  // If invalid or known fake placeholder, replace with high-res Unsplash image or SVG
  if (!image || image.includes("example.com") || image.includes("placehold.co")) {
    const key = (name || "").toLowerCase().trim();
    for (const [k, url] of Object.entries(FALLBACK_PRODUCT_IMAGES)) {
      if (key.includes(k) || k.includes(key)) {
        return url;
      }
    }
    return getSvgFallback(name, category);
  }

  return image;
}

/**
 * Image onError handler that falls back to self-contained SVG to prevent broken image icons.
 */
export function handleImageError(e, name = "Product", category = "") {
  e.currentTarget.onerror = null; // Prevent infinite error loops
  e.currentTarget.src = getSvgFallback(name, category);
}
