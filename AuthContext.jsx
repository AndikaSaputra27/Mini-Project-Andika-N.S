import { createContext, useContext, useMemo, useState } from "react";
import { login as loginRequest } from "../api.js";

const AuthContext = createContext(null);
const TOKEN_KEY = "marketly_token";
const USER_KEY = "marketly_user";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem(USER_KEY);
    return storedUser ? JSON.parse(storedUser) : null;
  });

  async function signIn(credentials) {
    const result = await loginRequest(credentials);
    if (!result.token) {
      throw new Error("Login gagal. Periksa kembali username dan password.");
    }

    const account = { username: credentials.username };
    localStorage.setItem(TOKEN_KEY, result.token);
    localStorage.setItem(USER_KEY, JSON.stringify(account));
    setToken(result.token);
    setUser(account);
  }

  function signOut() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }

  const value = useMemo(
    () => ({ token, user, signIn, signOut }),
    [token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth harus digunakan di dalam AuthProvider.");
  }
  return context;
}
