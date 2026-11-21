import { useEffect, useMemo, useState } from "react";
import {
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import AdminDashboard from "./AdminDashboard.jsx";
import {
  DEMO_ACCOUNT,
  getProduct,
  getProducts,
  getUser,
  getUsers,
  register as registerRequest,
} from "./api.js";
import {
  DEMO_PRODUCTS,
  FASHION_IMAGES,
  STORE_CATEGORIES,
  formatPrice,
} from "./data/demoProducts.js";
import { useAuth } from "./context/AuthContext.jsx";
import { useCart } from "./context/CartContext.jsx";
import { CartPage, OrdersPage, ProductReviews } from "./CommercePages.jsx";
import { ErrorMessage, Loading } from "./components/Feedback.jsx";
import ProductCard from "./components/ProductCard.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import SiteHeader from "./components/SiteHeader.jsx";

const PAGE_SIZE = 8;
const CATEGORY_TILES = [
  {
    category: "Baju & Kemeja",
    label: "Kemeja",
    description: "Potongan rapi, tetap nyaman.",
    image: FASHION_IMAGES.shirt,
  },
  {
    category: "Hoodie & Jaket",
    label: "Hoodie & Jaket",
    description: "Teman untuk cuaca sejuk.",
    image: FASHION_IMAGES.jacket,
  },
  {
    category: "Celana",
    label: "Celana",
    description: "Pas untuk aktivitas harian.",
    image: FASHION_IMAGES.trousers,
  },
  {
    category: "Tas",
    label: "Tas",
    description: "Bawa yang kamu perlukan.",
    image: FASHION_IMAGES.bag,
  },
];

export default function App() {
  return (
    <>
      <SiteHeader />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/orders"
            element={
              <ProtectedRoute role="customer">
                <OrdersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute role="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute role="admin">
                <UsersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users/:id"
            element={
              <ProtectedRoute role="admin">
                <UserDetailPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <footer className="site-footer">
        <Link className="brand" to="/">
          Yuka<span>-</span>Store
        </Link>
        <span>Belanja harian, dibuat lebih sederhana.</span>
        <span>© 2026 Yuka-Store</span>
      </footer>
    </>
  );
}

function HomePage() {
  const [products, setProducts] = useState(DEMO_PRODUCTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  async function loadProducts() {
    setLoading(true);
    setError("");
    try {
      setProducts(await getProducts());
    } catch (requestError) {
      setError(requestError.message);
      setProducts(DEMO_PRODUCTS);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return products.filter((product) => {
      const matchesCategory = category === "all" || product.category === category;
      const matchesSearch =
        !query ||
        product.title.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [products, category, search]);

  const pageCount = Math.ceil(filteredProducts.length / PAGE_SIZE);
  const bestSellers = useMemo(
    () =>
      [...products]
        .sort(
          (first, second) =>
            (second.rating?.rate ?? 0) - (first.rating?.rate ?? 0),
        )
        .slice(0, 6),
    [products],
  );
  const visibleProducts = filteredProducts.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  function chooseCategory(nextCategory) {
    setCategory(nextCategory);
    setPage(1);
  }

  function searchProducts(event) {
    setSearch(event.target.value);
    setPage(1);
  }

  function browseCategory(nextCategory) {
    chooseCategory(nextCategory);
    document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <>
      <section className="hero">
        <img
          className="hero-image"
          src={FASHION_IMAGES.hero}
          alt=""
          aria-hidden="true"
        />
        <div className="hero-shade" aria-hidden="true" />
        <div className="hero-content">
          <span className="eyebrow">
            <span className="eyebrow-dot" /> KOLEKSI BARU / YUKA-STORE
          </span>
          <h1>Gaya yang<br /><em>bertahan lama.</em></h1>
          <p>
            Potongan santai, warna mudah dipadu, dan pilihan untuk hari-hari biasa.
          </p>
          <a className="button button-dark hero-button" href="#catalog">
            Jelajahi koleksi <span aria-hidden="true">→</span>
          </a>
        </div>
        <div className="hero-index"><span>01</span> / YS-01</div>
      </section>

      <section className="benefit-strip" aria-label="Keunggulan Yuka-Store">
        <div className="benefit-item">
          <span aria-hidden="true">✦</span>
          <p><strong>Fokus fashion</strong><small>Tas hingga celana dalam satu katalog</small></p>
        </div>
        <div className="benefit-item">
          <span aria-hidden="true">◇</span>
          <p><strong>Empat kategori</strong><small>Atasan, outerwear, bawahan, dan tas</small></p>
        </div>
        <div className="benefit-item">
          <span aria-hidden="true">□</span>
          <p><strong>Katalog demo</strong><small>Harga dan produk masih simulasi</small></p>
        </div>
      </section>

      <section className="category-section section-wrap">
        <div className="editorial-heading">
          <div>
            <span className="eyebrow">PILIH BERDASARKAN KATEGORI</span>
            <h2>Elevated essentials<span className="heading-period">.</span></h2>
          </div>
          <p>Temukan potongan yang terasa paling kamu.</p>
        </div>
        <div className="category-grid">
          {CATEGORY_TILES.map((item) => (
            <button
              className="category-tile"
              key={item.category}
              onClick={() => browseCategory(item.category)}
            >
              <img src={item.image} alt="" loading="lazy" />
              <span className="category-tile-shade" />
              <span className="category-tile-copy">
                <strong>{item.label}</strong>
                <small>{item.description}</small>
                <span>JELAJAHI <span aria-hidden="true">→</span></span>
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="catalog section-wrap" id="catalog">
        <div className="section-heading">
          <div>
            <span className="eyebrow">NEW ARRIVALS</span>
            <h2>Potongan pilihan<span className="heading-period">.</span></h2>
          </div>
          <label className="search-box">
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              placeholder="Cari produk..."
              value={search}
              onChange={searchProducts}
              aria-label="Cari produk"
            />
          </label>
        </div>

        <div className="catalog-controls">
          <div className="category-list" aria-label="Filter kategori">
            <button
              className={`category-chip ${category === "all" ? "selected" : ""}`}
              onClick={() => chooseCategory("all")}
            >
              Semua
            </button>
            {STORE_CATEGORIES.map((item) => (
              <button
                className={`category-chip ${category === item ? "selected" : ""}`}
                key={item}
                onClick={() => chooseCategory(item)}
              >
                {item}
              </button>
            ))}
          </div>
          <span className="result-count">
            {loading ? "Memuat..." : `${filteredProducts.length} produk`}
          </span>
        </div>

        <p className="catalog-note">
          Demo pembelian tersedia. Pembayaran dan pengiriman disimulasikan untuk pembelajaran.
        </p>
        {error && (
          <p className="inline-notice" role="status">
            Data API tidak dapat dimuat ({error}). Produk contoh tetap tersedia.{" "}
            <button className="retry-link" onClick={loadProducts}>Coba lagi</button>
          </p>
        )}
        {loading ? (
          <Loading label="Menyiapkan pilihan untukmu..." />
        ) : visibleProducts.length ? (
          <>
            <div className="product-grid">
              {visibleProducts.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  index={index}
                />
              ))}
            </div>
            <Pagination page={page} pageCount={pageCount} onChange={setPage} />
          </>
        ) : (
          <div className="empty-state">
            <span aria-hidden="true">⌕</span>
            <h3>Belum ada produk yang cocok</h3>
            <p>Coba kata kunci atau kategori yang berbeda.</p>
            <button
              className="button button-outline"
              onClick={() => {
                setSearch("");
                chooseCategory("all");
              }}
            >
              Reset filter
            </button>
          </div>
        )}
      </section>

      <section className="collection-feature">
        <div className="feature-copy">
          <span className="eyebrow">KOLEKSI HARIAN</span>
          <h2>Ringkas.<br />Refined.<br /><em>Effortless.</em></h2>
          <p>
            Padukan outerwear dan celana untuk tampilan santai yang tetap rapi.
          </p>
          <button
            className="button button-gold"
            onClick={() => browseCategory("Hoodie & Jaket")}
          >
            Lihat outerwear <span aria-hidden="true">→</span>
          </button>
        </div>
        <div className="feature-art">
          <img src={FASHION_IMAGES.collection} alt="" loading="lazy" />
        </div>
      </section>

      <section className="best-sellers section-wrap">
        <div className="editorial-heading">
          <div>
            <span className="eyebrow">FAVORIT PILIHAN</span>
            <h2>Yang paling disukai<span className="heading-period">.</span></h2>
          </div>
          <a className="subtle-link" href="#catalog">LIHAT KATALOG <span>→</span></a>
        </div>
        <div className="product-grid best-seller-grid">
          {bestSellers.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>
      </section>

      <section className="journal-section section-wrap">
        <div className="editorial-heading journal-heading">
          <div>
            <span className="eyebrow">DARI CATATAN KAMI</span>
            <h2>Style, care, repeat<span className="heading-period">.</span></h2>
          </div>
        </div>
        <div className="journal-grid">
          <article className="journal-card">
            <img src={FASHION_IMAGES.shirtLook} alt="" loading="lazy" />
            <span className="eyebrow">PANDUAN GAYA</span>
            <h3>Satu kemeja, banyak kemungkinan.</h3>
            <p>Mulai dari tampilan santai sampai rapi, tanpa banyak usaha.</p>
          </article>
          <article className="journal-card">
            <img src={FASHION_IMAGES.jacket} alt="" loading="lazy" />
            <span className="eyebrow">RAWAT PAKAIAN</span>
            <h3>Jaga jaket tetap nyaman dipakai.</h3>
            <p>Kebiasaan kecil yang membuat pakaian lebih awet.</p>
          </article>
          <article className="journal-card">
            <img src={FASHION_IMAGES.bag} alt="" loading="lazy" />
            <span className="eyebrow">PILIHAN HARIAN</span>
            <h3>Tas yang pas untuk agenda padat.</h3>
            <p>Pilih bentuk dan ukuran sesuai barang yang kamu bawa.</p>
          </article>
        </div>
      </section>
    </>
  );
}

function Pagination({ page, pageCount, onChange }) {
  if (pageCount <= 1) return null;
  return (
    <nav className="pagination" aria-label="Navigasi halaman produk">
      <button
        className="page-arrow"
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
        aria-label="Halaman sebelumnya"
      >
        ←
      </button>
      {Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => (
        <button
          className={`page-number ${page === number ? "active" : ""}`}
          key={number}
          aria-current={page === number ? "page" : undefined}
          onClick={() => onChange(number)}
        >
          {String(number).padStart(2, "0")}
        </button>
      ))}
      <button
        className="page-arrow"
        disabled={page === pageCount}
        onClick={() => onChange(page + 1)}
        aria-label="Halaman berikutnya"
      >
        →
      </button>
    </nav>
  );
}

function ProductDetailPage() {
  const { id } = useParams();
  const { addItem } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadProduct() {
    setLoading(true);
    setError("");
    try {
      setProduct(await getProduct(id));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProduct();
  }, [id]);

  if (loading) return <Loading label="Memuat detail produk..." />;
  if (error) return <ErrorMessage message={error} onRetry={loadProduct} />;
  if (!product || !product.id) {
    return <ErrorMessage message="Produk tidak ditemukan." />;
  }

  return (
    <section className="detail-page section-wrap">
      <Link className="back-link" to="/">← Kembali ke koleksi</Link>
      <div className="product-detail">
        <div className="detail-image-panel">
          <img src={product.image} alt={product.title} />
          <span className="detail-image-caption">YUKA-STORE / PILIHAN TOKO</span>
        </div>
        <div className="detail-copy">
          <span className="eyebrow">{product.category}</span>
          <h1>{product.title}</h1>
          <div className="detail-rating">
            <span aria-hidden="true">★</span> {product.rating?.rate ?? "—"}
            <span>({product.rating?.count ?? 0} ulasan)</span>
          </div>
          <p className="detail-price">{formatPrice(product.price)}</p>
          <div className="detail-rule" />
          <h2>Tentang produk</h2>
          <p className="detail-description">{product.description}</p>
          <div className="detail-actions">
            <button
              className="button button-dark detail-cta"
              onClick={() => addItem(product)}
              disabled={product.stock < 1}
            >
              {product.stock < 1 ? "Stok habis" : "Tambah ke keranjang"}
            </button>
            <span className="detail-stock">Stok tersedia: {product.stock}</span>
          </div>
          <p className="detail-footnote">
            Produk dan transaksi ini hanya untuk simulasi pembelajaran.
          </p>
        </div>
      </div>
      <ProductReviews productId={id} />
    </section>
  );
}

function LoginPage() {
  const { token, user, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (token) return <Navigate to={user?.role === "admin" ? "/admin" : "/orders"} replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const account = await signIn(form);
      navigate(
        location.state?.from?.pathname ||
          (account.role === "admin" ? "/admin" : "/orders"),
        { replace: true },
      );
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout eyebrow="WELCOME BACK" title="Senang melihatmu lagi.">
      <form className="auth-form" onSubmit={handleSubmit}>
        {location.state?.notice && (
          <p className="form-success" role="status">{location.state.notice}</p>
        )}
        {error && <p className="form-error" role="alert">{error}</p>}
        <FormField
          label="Username"
          name="username"
          value={form.username}
          onChange={(value) => setForm({ ...form, username: value })}
          autoComplete="username"
        />
        <FormField
          label="Password"
          name="password"
          type="password"
          value={form.password}
          onChange={(value) => setForm({ ...form, password: value })}
          autoComplete="current-password"
        />
        <button className="button button-dark auth-submit" disabled={submitting}>
          {submitting ? "Memproses..." : "Masuk ke akun"}
          {!submitting && <span aria-hidden="true">↗</span>}
        </button>
        <p className="auth-switch">
          Belum punya akun? <Link to="/register">Daftar di sini</Link>
        </p>
        <p className="auth-hint">
          Pembeli: <strong>{DEMO_ACCOUNT.username}</strong> /{" "}
          <strong>{DEMO_ACCOUNT.password}</strong>. Admin: <strong>admin</strong> /{" "}
          <strong>admin123</strong>.
        </p>
      </form>
    </AuthLayout>
  );
}

function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    username: "",
    password: "",
    firstname: "",
    lastname: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await registerRequest({
        email: form.email,
        username: form.username,
        password: form.password,
        name: `${form.firstname} ${form.lastname}`.trim(),
      });
      navigate("/login", {
        state: { notice: "Pendaftaran berhasil dikirim. Silakan masuk." },
      });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout eyebrow="MULAI DARI SINI" title="Buat akun Yuka-Store.">
      <form className="auth-form" onSubmit={handleSubmit}>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="form-row">
          <FormField
            label="Nama depan"
            name="firstname"
            value={form.firstname}
            onChange={(value) => setForm({ ...form, firstname: value })}
            autoComplete="given-name"
          />
          <FormField
            label="Nama belakang"
            name="lastname"
            value={form.lastname}
            onChange={(value) => setForm({ ...form, lastname: value })}
            autoComplete="family-name"
          />
        </div>
        <FormField
          label="Email"
          name="email"
          type="email"
          value={form.email}
          onChange={(value) => setForm({ ...form, email: value })}
          autoComplete="email"
        />
        <FormField
          label="Username"
          name="username"
          value={form.username}
          onChange={(value) => setForm({ ...form, username: value })}
          autoComplete="username"
        />
        <FormField
          label="Password"
          name="password"
          type="password"
          value={form.password}
          onChange={(value) => setForm({ ...form, password: value })}
          autoComplete="new-password"
        />
        <button className="button button-dark auth-submit" disabled={submitting}>
          {submitting ? "Memproses..." : "Buat akun"}
          {!submitting && <span aria-hidden="true">↗</span>}
        </button>
        <p className="auth-switch">
          Sudah punya akun? <Link to="/login">Masuk di sini</Link>
        </p>
        <p className="auth-hint">
          Akun demo disimpan di database lokal proyek ini.
        </p>
      </form>
    </AuthLayout>
  );
}

function AuthLayout({ eyebrow, title, children }) {
  return (
    <section className="auth-page">
      <div className="auth-decoration" aria-hidden="true">
        <span>✳</span>
        <p>PILIHAN YANG PAS.<br />HARI YANG LEBIH BAIK.</p>
        <span>ys.</span>
      </div>
      <div className="auth-panel">
        <Link className="back-link" to="/">← Kembali ke beranda</Link>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        {children}
      </div>
    </section>
  );
}

function FormField({ label, name, value, onChange, type = "text", autoComplete }) {
  return (
    <label className="form-field" htmlFor={name}>
      <span>{label}</span>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        required
      />
    </label>
  );
}

function UsersPage() {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadUsers() {
    setLoading(true);
    setError("");
    try {
      setUsers(await getUsers(token));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, [token]);

  return (
    <section className="section-wrap users-page">
      <span className="eyebrow">ADMIN / PELANGGAN YUKA-STORE</span>
      <div className="section-heading users-heading">
        <div>
          <h1>Kenali komunitas<span className="heading-period">.</span></h1>
          <p>Daftar akun pelanggan yang terdaftar di toko.</p>
        </div>
        <span className="private-badge"><span /> AREA MEMBER</span>
      </div>
      {loading ? (
        <Loading label="Memuat daftar pelanggan..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={loadUsers} />
      ) : (
        <div className="user-grid">
          {users.map((customer) => (
            <Link className="user-card" to={`/users/${customer.id}`} key={customer.id}>
              <span className="user-avatar">
                {customer.name?.[0]?.toUpperCase() || customer.username[0].toUpperCase()}
              </span>
              <span className="user-card-copy">
                <strong>{customer.name}</strong>
                <span>@{customer.username}</span>
              </span>
              <span className="user-card-arrow" aria-hidden="true">↗</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

function UserDetailPage() {
  const { id } = useParams();
  const { token } = useAuth();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadUser() {
    setLoading(true);
    setError("");
    try {
      setCustomer(await getUser(id, token));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUser();
  }, [id, token]);

  if (loading) return <Loading label="Memuat profil pelanggan..." />;
  if (error) return <ErrorMessage message={error} onRetry={loadUser} />;
  if (!customer || !customer.id) {
    return <ErrorMessage message="Pelanggan tidak ditemukan." />;
  }

  return (
    <section className="section-wrap user-detail-page">
      <Link className="back-link" to="/users">← Kembali ke daftar pelanggan</Link>
      <div className="profile-card">
        <span className="profile-avatar">
          {customer.name?.[0]?.toUpperCase() || customer.username[0].toUpperCase()}
        </span>
        <span className="eyebrow">ADMIN / PELANGGAN #{customer.id}</span>
        <h1>{customer.name}</h1>
        <p className="profile-username">@{customer.username}</p>
        <div className="profile-details">
          <ProfileItem label="Email" value={customer.email} />
          <ProfileItem label="Telepon" value={customer.phone} />
          <ProfileItem
            label="Alamat"
            value={[
              customer.address?.number,
              customer.address?.street,
              customer.address?.city,
              customer.address?.zipcode,
            ].filter(Boolean).join(", ")}
          />
        </div>
      </div>
    </section>
  );
}

function ProfileItem({ label, value }) {
  return (
    <div className="profile-item">
      <span>{label}</span>
      <strong>{value || "Belum tersedia"}</strong>
    </div>
  );
}

function NotFoundPage() {
  return (
    <section className="empty-state not-found">
      <span className="eyebrow">404 / PAGE NOT FOUND</span>
      <h1>Sepertinya kamu tersesat.</h1>
      <p>Halaman yang dicari tidak tersedia.</p>
      <Link className="button button-dark" to="/">Kembali belanja</Link>
    </section>
  );
}
