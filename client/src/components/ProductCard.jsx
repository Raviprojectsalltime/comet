export default function ProductCard({ product: p, onQuickAdd }) {
  return (
    <div className="product-card" onClick={() => onQuickAdd(p)}>
      <div className="product-media">
        {p.badge && (
          <span className={`badge ${p.badge === 'EXCLUSIVE PRICE' ? 'red' : 'black'}`}>
            {p.badge}
          </span>
        )}
        <img src={p.image} alt={`${p.silhouette} ${p.title}`} />
        {p.hoverImage && <img className="img-hover" src={p.hoverImage} alt="" aria-hidden="true" />}
        <button
          className="quick-add"
          onClick={(e) => {
            e.stopPropagation();
            onQuickAdd(p);
          }}
        >
          QUICK ADD
        </button>
      </div>
      <div className="product-info">
        <div>
          <div className="product-title">{p.title}</div>
          <div className="product-silhouette">{p.silhouette}</div>
        </div>
        <div className="product-price">₹ {p.price.toLocaleString('en-IN')}</div>
      </div>
    </div>
  );
}
