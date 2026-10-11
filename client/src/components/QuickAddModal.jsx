import { useState } from 'react';

export default function QuickAddModal({ product, onClose, onAdd }) {
  const [size, setSize] = useState(null);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        <h3>QUICK ADD</h3>
        <div className="quickadd-product">
          <img src={product.image} alt={product.name} />
          <div>
            <div className="product-title">{product.title}</div>
            <div className="product-silhouette">{product.silhouette} · {product.color}</div>
            <div className="product-price">₹ {product.price.toLocaleString('en-IN')}</div>
          </div>
        </div>
        <div className="product-silhouette">Size (UK)</div>
        <div className="size-grid">
          {product.sizes.map((s) => (
            <button
              key={s}
              className={`size-btn ${size === s ? 'selected' : ''}`}
              onClick={() => setSize(s)}
            >
              {s}
            </button>
          ))}
        </div>
        <button className="btn-dark" disabled={!size} onClick={() => onAdd(product, size)}>
          {size ? 'ADD TO CART' : 'SELECT A SIZE'}
        </button>
      </div>
    </div>
  );
}
