import { useRef } from 'react';

export default function ProductCarousel({ products, onQuickAdd }) {
  const trackRef = useRef(null);

  const scroll = (dir) => {
    const el = trackRef.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.6, behavior: 'smooth' });
  };

  return (
    <div className="products-section">
      <div className="carousel">
        <button className="carousel-arrow prev" onClick={() => scroll(-1)} aria-label="Previous">‹</button>

        <div className="carousel-track" ref={trackRef}>
          {products.map((p) => (
            <div className="product-card" key={p.id} onClick={() => onQuickAdd(p)}>
              <div className="product-media">
                {p.badge && (
                  <span className={`badge ${p.badge === 'EXCLUSIVE PRICE' ? 'red' : 'black'}`}>
                    {p.badge}
                  </span>
                )}
                <img src={p.image} alt={`${p.silhouette} ${p.title}`} />
                <img className="img-hover" src={p.hoverImage} alt="" aria-hidden="true" />
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
          ))}
        </div>

        <button className="carousel-arrow next" onClick={() => scroll(1)} aria-label="Next">›</button>
      </div>
    </div>
  );
}
