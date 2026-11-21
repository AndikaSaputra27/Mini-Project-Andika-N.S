import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function SiteHeader() {
  const { token, user, signOut } = useAuth();

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link className="brand" to="/" aria-label="Yuka-Store beranda">
          Yuka<span>-</span>Store
        </Link>
        <nav className="main-nav" aria-label="Navigasi utama">
          <NavLink to="/" end>
            Belanja
          </NavLink>
          {token && <NavLink to="/users">Pelanggan</NavLink>}
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
