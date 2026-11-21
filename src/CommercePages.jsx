import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  createOrder,
  createReview,
  getProducts,
  getOrders,
  getReviews,
  simulatePayment,
  storeRequest,
} from "./api.js";
import { formatPrice } from "./data/demoProducts.js";
import { useAuth } from "./context/AuthContext.jsx";
import { useCart } from "./context/CartContext.jsx";
import { Loading } from "./components/Feedback.jsx";

export function CartPage() {
  const { items, subtotal, setQuantity, clearCart, refreshProducts } = useCart();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [coupons, setCoupons] = useState([]);
  const [couponCode, setCouponCode] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([storeRequest("/coupons"), getProducts()])
      .then(([availableCoupons, products]) => {
        setCoupons(availableCoupons);
        refreshProducts(products);
      })
      .catch((requestError) => setError(requestError.message));
  }, [refreshProducts]);

  const coupon = useMemo(
    () =>
      coupons.find(
        (item) => item.code.toLowerCase() === couponCode.trim().toLowerCase(),
      ),
    [coupons, couponCode],
  );
  const discount = coupon
    ? coupon.discountType === "percent"
      ? Math.floor((subtotal * coupon.discountValue) / 100)
      : Math.min(subtotal, coupon.discountValue)
    : 0;

  async function checkout(event) {
    event.preventDefault();
    setError("");
    if (couponCode.trim() && !coupon) {
      setError("Kode kupon tidak tersedia. Periksa kode atau hapus sebelum checkout.");
      return;
    }
    if (items.some((item) => item.unavailable || item.quantity > item.stock)) {
      setError("Ada produk yang stoknya berubah. Periksa keranjang sebelum checkout.");
      return;
    }
    if (!token) {
      navigate("/login", { state: { from: { pathname: "/cart" } } });
      return;
    }
    setSubmitting(true);
    try {
      await createOrder({
        items: items.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
        })),
        couponCode: coupon ? coupon.code : "",
        address,
      });
      clearCart();
      navigate("/orders", { state: { notice: "Pesanan dibuat. Lanjutkan pembayaran simulasi." } });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="commerce-page section-wrap">
      <div className="commerce-heading">
        <div><span className="eyebrow">YUKA-STORE / CHECKOUT</span><h1>Keranjang belanja<span className="heading-period">.</span></h1></div>
        <Link className="back-link" to="/">← Lanjut belanja</Link>
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      {items.length === 0 ? (
        <div className="empty-state commerce-empty">
          <span aria-hidden="true">□</span><h3>Keranjangmu masih kosong</h3>
          <p>Pilih produk untuk memulai pesanan.</p>
          <Link className="button button-dark" to="/">Jelajahi produk</Link>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-items">
            {items.map((item) => (
              <article className="cart-item" key={item.id}>
                <Link to={`/products/${item.id}`}><img src={item.image} alt={item.title} /></Link>
                <div className="cart-item-copy">
                  <span className="product-category">{item.category}</span>
                  <Link className="product-title" to={`/products/${item.id}`}>{item.title}</Link>
                  <strong>{formatPrice(item.price)}</strong>
                  <span className="cart-stock">
                    {item.unavailable ? "Produk tidak tersedia" : `Stok: ${item.stock ?? "—"}`}
                  </span>
                </div>
                <div className="cart-quantity">
                  <label htmlFor={`quantity-${item.id}`}>Jumlah</label>
                  <input
                    id={`quantity-${item.id}`}
                    type="number"
                    min="0"
                    max={item.stock}
                    value={item.quantity}
                    onChange={(event) => setQuantity(item.id, Number(event.target.value))}
                  />
                </div>
              </article>
            ))}
          </div>
          <form className="checkout-card" onSubmit={checkout}>
            <span className="eyebrow">RINGKASAN PESANAN</span>
            <h2>Checkout</h2>
            <label>Kode kupon
              <input value={couponCode} onChange={(event) => setCouponCode(event.target.value.toUpperCase())} placeholder="Contoh: YUKA10" />
            </label>
            {couponCode && <small className={coupon ? "coupon-valid" : "coupon-invalid"}>{coupon ? `Kupon ${coupon.code} diterapkan` : "Kode kupon tidak tersedia"}</small>}
            <label>Alamat pengiriman
              <textarea required minLength="8" maxLength="300" rows="3" value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Nama jalan, kota, kode pos" />
            </label>
            <div className="checkout-totals">
              <span>Subtotal <strong>{formatPrice(subtotal)}</strong></span>
              <span>Diskon <strong>− {formatPrice(discount)}</strong></span>
              <span className="checkout-grand-total">Total <strong>{formatPrice(subtotal - discount)}</strong></span>
            </div>
            <button className="button button-dark checkout-submit" disabled={submitting}>
              {submitting ? "Membuat pesanan..." : "Buat pesanan"}
            </button>
            <p className="admin-disclaimer">Pembayaran demo. Tidak ada transaksi uang sungguhan.</p>
          </form>
        </div>
      )}
    </section>
  );
}

export function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function loadOrders() {
    setLoading(true);
    setError("");
    try {
      setOrders(await getOrders());
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  async function pay(orderId) {
    setError("");
    setNotice("");
    try {
      await simulatePayment(orderId);
      setNotice("Pembayaran simulasi dikirim untuk diverifikasi admin.");
      await loadOrders();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <section className="commerce-page section-wrap">
      <div className="commerce-heading">
        <div><span className="eyebrow">AKUN / PESANAN</span><h1>Pesanan {user?.name ? `· ${user.name}` : ""}<span className="heading-period">.</span></h1></div>
        <Link className="back-link" to="/">← Kembali ke toko</Link>
      </div>
      {notice && <p className="form-success" role="status">{notice}</p>}
      {error && <p className="form-error" role="alert">{error}</p>}
      {loading ? <Loading label="Memuat pesanan..." /> : orders.length === 0 ? (
        <div className="empty-state commerce-empty">
          <span aria-hidden="true">□</span><h3>Belum ada pesanan</h3>
          <p>Pesanan yang dibuat akan muncul di halaman ini.</p>
          <Link className="button button-dark" to="/">Belanja sekarang</Link>
        </div>
      ) : (
        <div className="customer-order-list">
          {orders.map((order) => (
            <article className="customer-order-card" key={order.id}>
              <div className="customer-order-heading">
                <div><span className="eyebrow">{order.id}</span><small>{new Date(order.createdAt).toLocaleString("id-ID")}</small></div>
                <span className="status-pill">{order.status}</span>
              </div>
              <div className="customer-order-items">
                {order.items.map((item) => (
                  <div key={item.productId}>
                    <img src={item.image} alt="" />
                    <span>{item.title} <small>× {item.quantity}</small></span>
                    <strong>{formatPrice(item.price * item.quantity)}</strong>
                  </div>
                ))}
              </div>
              <div className="customer-order-footer">
                <span>Pembayaran: <strong>{order.paymentStatus}</strong></span>
                {order.shippingNumber && <span>Resi: <strong>{order.shippingNumber}</strong></span>}
                <strong className="order-total">{formatPrice(order.total)}</strong>
                {order.paymentStatus === "Belum dibayar" && (
                  <button className="button button-dark" onClick={() => pay(order.id)}>Bayar simulasi</button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export function ProductReviews({ productId }) {
  const { token } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState("5");
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function loadReviews() {
    try {
      setReviews(await getReviews(productId));
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  useEffect(() => {
    loadReviews();
  }, [productId]);

  async function submitReview(event) {
    event.preventDefault();
    setError("");
    setNotice("");
    try {
      await createReview({
        productId,
        rating: Number(rating),
        comment,
      });
      setComment("");
      setNotice("Ulasan dikirim dan menunggu persetujuan admin.");
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <section className="product-reviews">
      <div className="admin-section-heading">
        <div><span className="eyebrow">PENDAPAT PEMBELI</span><h2>Ulasan produk</h2></div>
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      {notice && <p className="form-success" role="status">{notice}</p>}
      {token ? (
        <form className="review-form" onSubmit={submitReview}>
          <label>Rating
            <select value={rating} onChange={(event) => setRating(event.target.value)}>
              {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} bintang</option>)}
            </select>
          </label>
          <label>Ulasan
            <textarea required minLength="3" maxLength="1000" rows="3" value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Bagikan pengalamanmu dengan produk ini." />
          </label>
          <button className="button button-dark">Kirim ulasan</button>
        </form>
      ) : (
        <p className="review-signin"><Link to="/login">Masuk</Link> untuk menulis ulasan produk.</p>
      )}
      {reviews.length ? (
        <div className="review-list">
          {reviews.map((review) => (
            <article className="review-item" key={review.id}>
              <div><strong>{review.username}</strong><span className="review-stars">{"★".repeat(review.rating)}</span></div>
              <p>{review.comment}</p>
              <small>{new Date(review.createdAt).toLocaleDateString("id-ID")}</small>
            </article>
          ))}
        </div>
      ) : (
        <p className="review-signin">Belum ada ulasan yang ditampilkan.</p>
      )}
    </section>
  );
}
