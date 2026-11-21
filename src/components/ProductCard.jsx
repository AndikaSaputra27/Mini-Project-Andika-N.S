import { Link } from "react-router-dom";
import { formatPrice } from "../data/demoProducts.js";

export default function ProductCard({ product, index }) {
  return (
    <article
      className="product-card"
      style={{ "--card-order": index }}
    >
      <Link
        className="product-image-wrap"
        to={`/products/${product.id}`}
        aria-label={`Lihat ${product.title}`}
      >
        <img
          className={`product-image ${product.isDemo ? "product-image-demo" : ""}`}
          src={product.image}
          alt={product.title}
          loading="lazy"
          decoding="async"
        />
        {product.isDemo && <span className="product-badge">Produk contoh</span>}
        <span className="image-action" aria-hidden="true">
          →
        </span>
      </Link>
      <div className="product-info">
        <span className="product-category">{product.category}</span>
        <Link className="product-title" to={`/products/${product.id}`}>
          {product.title}
        </Link>
        <div className="product-meta">
          <span className="product-price">{formatPrice(product.price)}</span>
          <span className="product-rating">
            <span aria-hidden="true">★</span> {product.rating?.rate ?? "—"}
          </span>
        </div>
      </div>
    </article>
  );
}
