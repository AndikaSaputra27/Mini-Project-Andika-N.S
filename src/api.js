export const DEMO_ACCOUNT = { username: "Andika", password: "yuka99" };
const STORE_API_BASE_URL = "/api";

export async function storeRequest(path, options = {}) {
  const token = localStorage.getItem("marketly_token");
  const response = await fetch(`${STORE_API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || `Request gagal (${response.status}).`);
  }
  return result;
}

export const getProducts = () => storeRequest("/products");
export const getProduct = (id) =>
  storeRequest(`/products/${encodeURIComponent(id)}`);
export const getUsers = () => storeRequest("/admin/users");
export const getUser = (id) =>
  storeRequest(`/admin/users/${encodeURIComponent(id)}`);

export function login(credentials) {
  return storeRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
}

export function register(user) {
  return storeRequest("/auth/register", {
    method: "POST",
    body: JSON.stringify(user),
  });
}

export const getReviews = (productId) =>
  storeRequest(`/products/${encodeURIComponent(productId)}/reviews`);
export const createReview = (review) =>
  storeRequest("/reviews", { method: "POST", body: JSON.stringify(review) });
export const getOrders = () => storeRequest("/orders");
export const createOrder = (order) =>
  storeRequest("/orders", { method: "POST", body: JSON.stringify(order) });
export const simulatePayment = (orderId) =>
  storeRequest(`/orders/${encodeURIComponent(orderId)}/pay`, { method: "POST" });
export const getCoupons = () => storeRequest("/coupons");
