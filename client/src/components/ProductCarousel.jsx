import { useRef } from 'react';
import ProductCard from './ProductCard.jsx';

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
            <ProductCard key={p.id} product={p} onQuickAdd={onQuickAdd} />
          ))}
        </div>

        <button className="carousel-arrow next" onClick={() => scroll(1)} aria-label="Next">›</button>
      </div>
    </div>
  );
}
