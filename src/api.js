const API_BASE_URL = "https://fakestoreapi.com";
export const DEMO_ACCOUNT = { username: "Andika", password: "yuka99" };
const API_DEMO_ACCOUNT = { username: "johnd", password: "m38rmF$" };

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
  const apiCredentials =
    credentials.username === DEMO_ACCOUNT.username &&
    credentials.password === DEMO_ACCOUNT.password
      ? API_DEMO_ACCOUNT
      : credentials;

  return apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify(apiCredentials),
  });
}

export function register(user) {
  return apiRequest("/users", {
    method: "POST",
    body: JSON.stringify(user),
  });
}
