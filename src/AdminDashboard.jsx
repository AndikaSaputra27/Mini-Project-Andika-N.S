import { useCallback, useEffect, useState } from "react";
import { formatPrice, STORE_CATEGORIES } from "./data/demoProducts.js";
import { storeRequest } from "./api.js";
import { Loading } from "./components/Feedback.jsx";

const PANELS = ["Ringkasan", "Produk", "Pesanan", "Kupon", "Ulasan", "Pelanggan"];
const ORDER_STATUSES = [
  "Dikemas",
  "Dikirim",
  "Selesai",
  "Dibatalkan",
];
const EMPTY_PRODUCT = {
  title: "",
  description: "",
  category: STORE_CATEGORIES[0],
  price: "",
  stock: "",
  image: "",
};

export default function AdminDashboard() {
  const [panel, setPanel] = useState("Ringkasan");
  const [data, setData] = useState({
    summary: null,
    products: [],
    orders: [],
    coupons: [],
    reviews: [],
    users: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState(EMPTY_PRODUCT);
  const [couponForm, setCouponForm] = useState({
    code: "",
    discountType: "percent",
    discountValue: "",
    maxUses: "50",
  });
  const [shippingNumbers, setShippingNumbers] = useState({});

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [summary, products, orders, coupons, reviews, users] =
        await Promise.all([
          storeRequest("/admin/summary"),
          storeRequest("/products"),
          storeRequest("/orders"),
          storeRequest("/coupons"),
          storeRequest("/admin/reviews"),
          storeRequest("/admin/users"),
        ]);
      setData({ summary, products, orders, coupons, reviews, users });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function perform(action, successMessage) {
    setError("");
    setNotice("");
    try {
      await action();
      setNotice(successMessage);
      await loadData();
      return true;
    } catch (requestError) {
      setError(requestError.message);
      return false;
    }
  }

  async function saveProduct(event) {
    event.preventDefault();
    const body = {
      ...productForm,
      price: Number(productForm.price),
      stock: Number(productForm.stock),
    };
    const saved = await perform(
      () =>
        storeRequest(
          editingProduct ? `/products/${editingProduct.id}` : "/products",
          {
            method: editingProduct ? "PUT" : "POST",
            body: JSON.stringify(body),
          },
        ),
      editingProduct ? "Produk berhasil diperbarui." : "Produk berhasil ditambahkan.",
    );
    if (saved) {
      setEditingProduct(null);
      setProductForm(EMPTY_PRODUCT);
    }
  }

  function editProduct(product) {
    setEditingProduct(product);
    setProductForm({
      title: product.title,
      description: product.description,
      category: product.category,
      price: String(product.price),
      stock: String(product.stock),
      image: product.image,
    });
    setPanel("Produk");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function updateOrder(order, status) {
    await perform(
      () =>
        storeRequest(`/orders/${order.id}/status`, {
          method: "PATCH",
          body: JSON.stringify({
            status,
            shippingNumber: shippingNumbers[order.id] || order.shippingNumber,
          }),
        }),
      `Status ${order.id} diperbarui.`,
    );
  }

  async function addCoupon(event) {
    event.preventDefault();
    await perform(
      () =>
        storeRequest("/admin/coupons", {
          method: "POST",
          body: JSON.stringify({
            ...couponForm,
            discountValue: Number(couponForm.discountValue),
            maxUses: Number(couponForm.maxUses),
          }),
        }),
      "Kupon berhasil dibuat.",
    );
    setCouponForm({
      code: "",
      discountType: "percent",
      discountValue: "",
      maxUses: "50",
    });
  }

  if (loading && !data.summary) return <Loading label="Memuat dashboard admin..." />;

  return (
    <section className="admin-page section-wrap">
      <div className="admin-heading">
        <div>
          <span className="eyebrow">YUKA-STORE / WORKSPACE</span>
          <h1>Dashboard admin<span className="heading-period">.</span></h1>
          <p>Kelola produk, pembayaran simulasi, promo, dan ulasan pelanggan.</p>
        </div>
        <button className="button button-outline" onClick={loadData} disabled={loading}>
          {loading ? "Memuat..." : "↻ Segarkan"}
        </button>
      </div>

      <nav className="admin-tabs" aria-label="Menu dashboard admin">
        {PANELS.map((item) => (
          <button
            key={item}
            className={panel === item ? "active" : ""}
            onClick={() => setPanel(item)}
          >
            {item}
            {item === "Ulasan" && data.summary?.reviewCount > 0 && (
              <span className="admin-tab-count">{data.summary.reviewCount}</span>
            )}
          </button>
        ))}
      </nav>

      {error && <p className="form-error" role="alert">{error}</p>}
      {notice && <p className="form-success" role="status">{notice}</p>}

      {panel === "Ringkasan" && (
        <section className="admin-panel">
          <div className="admin-stat-grid">
            <StatCard label="Produk aktif" value={data.summary?.productCount ?? 0} />
            <StatCard label="Stok menipis" value={data.summary?.lowStockCount ?? 0} />
            <StatCard label="Total pesanan" value={data.summary?.orderCount ?? 0} />
            <StatCard label="Perlu verifikasi" value={data.summary?.pendingPayments ?? 0} />
            <StatCard label="Pelanggan" value={data.summary?.customerCount ?? 0} />
            <StatCard label="Ulasan menunggu" value={data.summary?.reviewCount ?? 0} />
          </div>
          <div className="admin-revenue">
            <span>Penjualan terverifikasi</span>
            <strong>{formatPrice(data.summary?.revenue || 0)}</strong>
          </div>
          <p className="admin-disclaimer">
            Pembayaran hanya simulasi lokal. Tidak ada uang yang ditagihkan.
          </p>
        </section>
      )}

      {panel === "Produk" && (
        <section className="admin-panel admin-columns">
          <form className="admin-form" onSubmit={saveProduct}>
            <div className="admin-section-heading">
              <div>
                <span className="eyebrow">{editingProduct ? "EDIT PRODUK" : "KATALOG"}</span>
                <h2>{editingProduct ? "Perbarui produk" : "Tambah produk"}</h2>
              </div>
              {editingProduct && (
                <button
                  type="button"
                  className="text-button"
                  onClick={() => {
                    setEditingProduct(null);
                    setProductForm(EMPTY_PRODUCT);
                  }}
                >
                  Batal
                </button>
              )}
            </div>
            <label>Nama produk<input required maxLength="180" value={productForm.title} onChange={(event) => setProductForm({ ...productForm, title: event.target.value })} /></label>
            <label>Kategori
              <input required list="store-categories" value={productForm.category} onChange={(event) => setProductForm({ ...productForm, category: event.target.value })} />
              <datalist id="store-categories">{STORE_CATEGORIES.map((category) => <option key={category} value={category} />)}</datalist>
            </label>
            <div className="admin-form-row">
              <label>Harga (IDR)<input required type="number" min="1" value={productForm.price} onChange={(event) => setProductForm({ ...productForm, price: event.target.value })} /></label>
              <label>Stok<input required type="number" min="0" value={productForm.stock} onChange={(event) => setProductForm({ ...productForm, stock: event.target.value })} /></label>
            </div>
            <label>URL gambar<input required type="url" value={productForm.image} onChange={(event) => setProductForm({ ...productForm, image: event.target.value })} /></label>
            <label>Deskripsi<textarea required rows="4" maxLength="2000" value={productForm.description} onChange={(event) => setProductForm({ ...productForm, description: event.target.value })} /></label>
            <button className="button button-dark" disabled={loading}>
              {editingProduct ? "Simpan perubahan" : "Tambah ke katalog"}
            </button>
          </form>
          <div className="admin-table-wrap">
            <div className="admin-section-heading">
              <div><span className="eyebrow">INVENTARIS</span><h2>{data.products.length} produk</h2></div>
            </div>
            <div className="admin-product-list">
              {data.products.map((product) => (
                <article className="admin-product-row" key={product.id}>
                  <img src={product.image} alt="" />
                  <div className="admin-product-copy">
                    <strong>{product.title}</strong>
                    <small>{product.category} · {formatPrice(product.price)}</small>
                  </div>
                  <span className={product.stock < 5 ? "stock-low" : "stock-good"}>{product.stock} stok</span>
                  <button className="admin-icon-button" aria-label={`Edit ${product.title}`} onClick={() => editProduct(product)}>Edit</button>
                  <button className="admin-icon-button danger" aria-label={`Hapus ${product.title}`} onClick={() => window.confirm(`Hapus ${product.title}?`) && perform(() => storeRequest(`/products/${product.id}`, { method: "DELETE" }), "Produk dihapus.")}>Hapus</button>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {panel === "Pesanan" && (
        <section className="admin-panel">
          <div className="admin-section-heading">
            <div><span className="eyebrow">PEMBAYARAN & PENGIRIMAN</span><h2>Kelola pesanan</h2></div>
          </div>
          {data.orders.length === 0 ? <EmptyPanel text="Belum ada pesanan." /> : (
            <div className="admin-order-list">
              {data.orders.map((order) => (
                <article className="admin-order-card" key={order.id}>
                  <div className="admin-order-top">
                    <div><strong>{order.id}</strong><small>{order.customerName} · {new Date(order.createdAt).toLocaleString("id-ID")}</small></div>
                    <span className="status-pill">{order.status}</span>
                  </div>
                  <p>{order.items.map((item) => `${item.title} × ${item.quantity}`).join(" · ")}</p>
                  <div className="admin-order-actions">
                    <strong>{formatPrice(order.total)}</strong>
                    {order.paymentStatus === "Menunggu verifikasi" ? (
                      <button className="button button-dark" onClick={() => perform(() => storeRequest(`/orders/${order.id}/verify`, { method: "POST" }), "Pembayaran terverifikasi.")}>Verifikasi pembayaran</button>
                    ) : (
                      <span className="payment-label">Pembayaran: {order.paymentStatus}</span>
                    )}
                    <input
                      aria-label={`Nomor resi ${order.id}`}
                      placeholder="Nomor resi"
                      value={shippingNumbers[order.id] ?? order.shippingNumber}
                      onChange={(event) => setShippingNumbers({ ...shippingNumbers, [order.id]: event.target.value })}
                    />
                    <select aria-label={`Status ${order.id}`} value={ORDER_STATUSES.includes(order.status) ? order.status : ""} onChange={(event) => updateOrder(order, event.target.value)} disabled={order.paymentStatus !== "Terverifikasi"}>
                      <option value="" disabled>Ubah status pengiriman</option>
                      {ORDER_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                    {order.shippingNumber && <span className="payment-label">Resi: {order.shippingNumber}</span>}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {panel === "Kupon" && (
        <section className="admin-panel admin-columns">
          <form className="admin-form" onSubmit={addCoupon}>
            <div className="admin-section-heading"><div><span className="eyebrow">PROMO TOKO</span><h2>Buat kupon</h2></div></div>
            <label>Kode kupon<input required maxLength="30" value={couponForm.code} onChange={(event) => setCouponForm({ ...couponForm, code: event.target.value.toUpperCase() })} /></label>
            <div className="admin-form-row">
              <label>Jenis diskon<select value={couponForm.discountType} onChange={(event) => setCouponForm({ ...couponForm, discountType: event.target.value })}><option value="percent">Persentase (%)</option><option value="fixed">Potongan harga (IDR)</option></select></label>
              <label>Nilai diskon<input required type="number" min="1" max={couponForm.discountType === "percent" ? "100" : undefined} value={couponForm.discountValue} onChange={(event) => setCouponForm({ ...couponForm, discountValue: event.target.value })} /></label>
            </div>
            <label>Batas penggunaan<input required type="number" min="1" value={couponForm.maxUses} onChange={(event) => setCouponForm({ ...couponForm, maxUses: event.target.value })} /></label>
            <button className="button button-dark">Simpan kupon</button>
          </form>
          <div className="admin-table-wrap">
            <div className="admin-section-heading"><div><span className="eyebrow">KODE PROMO</span><h2>{data.coupons.length} kupon</h2></div></div>
            {data.coupons.map((coupon) => (
              <article className="coupon-row" key={coupon.id}>
                <div><strong>{coupon.code}</strong><small>{coupon.discountType === "percent" ? `${coupon.discountValue}%` : formatPrice(coupon.discountValue)} · digunakan {coupon.usedCount}/{coupon.maxUses} kali</small></div>
                <button className="admin-icon-button" onClick={() => perform(() => storeRequest(`/admin/coupons/${coupon.id}`, { method: "PATCH", body: JSON.stringify({ active: !coupon.active }) }), coupon.active ? "Kupon dinonaktifkan." : "Kupon diaktifkan.")}>{coupon.active ? "Aktif" : "Nonaktif"}</button>
                <button className="admin-icon-button danger" onClick={() => window.confirm(`Hapus kupon ${coupon.code}?`) && perform(() => storeRequest(`/admin/coupons/${coupon.id}`, { method: "DELETE" }), "Kupon dihapus.")}>Hapus</button>
              </article>
            ))}
          </div>
        </section>
      )}

      {panel === "Ulasan" && (
        <section className="admin-panel">
          <div className="admin-section-heading"><div><span className="eyebrow">MODERASI</span><h2>Ulasan pelanggan</h2></div></div>
          {data.reviews.length === 0 ? <EmptyPanel text="Belum ada ulasan." /> : (
            <div className="admin-review-list">
              {data.reviews.map((review) => (
                <article className="admin-review-card" key={review.id}>
                  <div><strong>{review.productTitle}</strong><small>{review.username} · {"★".repeat(review.rating)} · {new Date(review.createdAt).toLocaleDateString("id-ID")}</small></div>
                  <p>{review.comment}</p>
                  <div className="admin-inline-actions">
                    <span className={`status-pill ${review.approved ? "status-approved" : ""}`}>{review.approved ? "Tayang" : "Menunggu moderasi"}</span>
                    {!review.approved && <button className="admin-icon-button" onClick={() => perform(() => storeRequest(`/admin/reviews/${review.id}`, { method: "PATCH", body: JSON.stringify({ approved: true }) }), "Ulasan disetujui.")}>Setujui</button>}
                    {review.approved && <button className="admin-icon-button" onClick={() => perform(() => storeRequest(`/admin/reviews/${review.id}`, { method: "PATCH", body: JSON.stringify({ approved: false }) }), "Ulasan disembunyikan.")}>Sembunyikan</button>}
                    <button className="admin-icon-button danger" onClick={() => perform(() => storeRequest(`/admin/reviews/${review.id}`, { method: "DELETE" }), "Ulasan dihapus.")}>Hapus</button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {panel === "Pelanggan" && (
        <section className="admin-panel">
          <div className="admin-section-heading"><div><span className="eyebrow">AKUN TERDAFTAR</span><h2>{data.users.length} pelanggan</h2></div></div>
          <div className="admin-customer-list">
            {data.users.map((user) => (
              <article className="admin-customer-row" key={user.id}>
                <span className="customer-avatar">{user.name?.slice(0, 1).toUpperCase()}</span>
                <div><strong>{user.name}</strong><small>@{user.username} · {user.email}</small></div>
                <small>Bergabung {new Date(user.createdAt).toLocaleDateString("id-ID")}</small>
              </article>
            ))}
          </div>
        </section>
      )}
    </section>
  );
}

function StatCard({ label, value }) {
  return <article className="admin-stat-card"><span>{label}</span><strong>{value}</strong></article>;
}

function EmptyPanel({ text }) {
  return <div className="admin-empty">{text}</div>;
}
