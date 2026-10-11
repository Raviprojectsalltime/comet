import { useMemo } from 'react';
import { searchProducts } from '../search.js';
import ProductCard from './ProductCard.jsx';

export default function SearchResults({ query, products, onQuickAdd, onBack }) {
  const results = useMemo(() => searchProducts(products, query), [products, query]);

  return (
    <main className="results-page">
      <div className="results-head">
        <button className="results-back" onClick={onBack}>‹ Back</button>
        <div>
          <h1 className="results-title">Results for “{query}”</h1>
          <p className="results-count">
            {results.length ? `${results.length} pair${results.length === 1 ? '' : 's'} found` : 'No pairs matched your story'}
          </p>
        </div>
      </div>

      {results.length ? (
        <div className="results-grid">
          {results.map((p) => (
            <ProductCard key={p.id} product={p} onQuickAdd={onQuickAdd} />
          ))}
        </div>
      ) : (
        <div className="results-empty">
          <p>Try words like “party”, “college”, “sport”, “gift” or “date”.</p>
          <button className="btn-dark results-browse" onClick={onBack}>BROWSE ALL SNEAKERS</button>
        </div>
      )}
    </main>
  );
}
