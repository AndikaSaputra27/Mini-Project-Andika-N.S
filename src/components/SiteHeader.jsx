import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";

export default function SiteHeader() {
  const { token, user, signOut } = useAuth();
  const { count } = useCart();

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link className="brand" to="/" aria-label="Yuka Store beranda">
          <img src="/yuka-store-mark.svg" alt="" />
          Yuka<span> Store</span>
        </Link>
        <nav className="main-nav" aria-label="Navigasi utama">
          <NavLink to="/" end>
            Belanja
          </NavLink>
          <NavLink to="/cart">Keranjang{count > 0 ? ` (${count})` : ""}</NavLink>
          {token && user?.role === "customer" && <NavLink to="/orders">Pesanan</NavLink>}
          {token && user?.role === "admin" && <NavLink to="/admin">Admin</NavLink>}
        </nav>
        <div className="header-account">
          {token ? (
            <>
              <span className="account-name">
                Hai, {user?.username === "johnd" ? "Andika" : user?.username}
              </span>
              <button className="text-button" onClick={signOut}>
                Keluar
              </button>
            </>
          ) : (
            <>
              <Link className="login-link" to="/login">
                Masuk
              </Link>
              <Link className="button button-dark header-join" to="/register">
                Buat akun
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
