const API_BASE_URL = "https://fakestoreapi.com";

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`Request gagal (${response.status}). Silakan coba lagi.`);
  }

  return response.json();
}

export const getProducts = () => apiRequest("/products");
export const getProduct = (id) => apiRequest(`/products/${id}`);
export const getCategories = () => apiRequest("/products/categories");

function customizeCustomer(user) {
  if (user.id !== 1) return user;

  return {
    ...user,
    email: "andika@gmail.com",
    phone: "+62 812-3456-7890",
    username: "Andika",
    name: { ...user.name, firstname: "Andika", lastname: "" },
    address: {
      ...user.address,
      number: "12",
      street: "Jl. Malioboro",
      city: "Yogyakarta",
      zipcode: "55271",
    },
  };
}

export async function getUsers(token) {
  const users = await apiRequest("/users", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return users.map(customizeCustomer);
}

export async function getUser(id, token) {
  const user = await apiRequest(`/users/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return customizeCustomer(user);
}

export function login(credentials) {
  return apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
}

export function register(user) {
  return apiRequest("/users", {
    method: "POST",
    body: JSON.stringify(user),
  });
}
