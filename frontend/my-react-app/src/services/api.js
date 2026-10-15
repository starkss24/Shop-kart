import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "/api";

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, 
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
})

export const registerCustomer = data => api.post("/customers/register", data);
export const loginCustomer = data => api.post("/customers/login", data);
export const getProfile = () => api.get("/customers/profile");
export const logoutCustomer = async () => {
  try {
    return await api.post("/customers/logout");
  } finally {
    localStorage.removeItem("token");
  }
};

export const getProducts = (params = {}) => api.get("/products", { params });
export const getProductById = id => api.get(`/products/${id}`);

export const addToWishlist = (productId) => api.post("/wishlist", { productId });
export const getWishlist = () => api.get("/wishlist");
export const removeFromWishlist = (id) => api.delete(`/wishlist/${id}`);

export const getCart = () => api.get("/cart/getCart");
export const addToCart = (productId) => api.post("/cart/addToCart", { product_id: productId });
export const updateCart = (productId, quantity) =>
  api.patch("/cart/updateCart", { product_id: productId, quantity });
export const removeFromCart = (productId) =>
  api.delete("/cart/deleteItem", { data: { product_id: productId } });

// Orders and Payment APIs
export const createPaymentOrder = (shippingAddress) =>
  api.post("/orders/create-payment-order", { shippingAddress });
export const verifyPayment = (paymentData) =>
  api.post("/orders/verify-payment", paymentData);
export const getOrders = () => api.get("/orders");
export const getOrderById = (id) => api.get(`/orders/${id}`);
export const updateOrderStatus = (id, status) =>
  api.patch(`/orders/${id}/status`, { status });

export default api;