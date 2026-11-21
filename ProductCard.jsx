import { Link } from "react-router-dom";

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
        <img className="product-image" src={product.image} alt={product.title} />
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
          <span className="product-price">${product.price.toFixed(2)}</span>
          <span className="product-rating">
            <span aria-hidden="true">★</span> {product.rating?.rate ?? "—"}
          </span>
        </div>
      </div>
    </article>
  );
}
