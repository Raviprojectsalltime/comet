import { useEffect, useRef, useState } from 'react';

const STORIES = [
  'Find me a pair for a party…',
  'A gift for my boyfriend…',
  'A gift for my girl…',
  'Something for college + sport…',
  'Suggest me the best party wear…',
  'Trendy sneakers with better design…',
  'Going for a date, suggest me something…',
  'Everyday sneakers for college…',
];

const CHIPS = [
  { label: 'For a party', query: 'party' },
  { label: 'Gift for boyfriend', query: 'gift boyfriend' },
  { label: 'Gift for her', query: 'gift girl' },
  { label: 'College casuals', query: 'college casual' },
  { label: 'Sport + daily wear', query: 'sport daily' },
  { label: 'For a date', query: 'date' },
  { label: 'Everyday', query: 'everyday' },
];

import { searchProducts } from '../search.js';

export default function SearchPanel({ open, products, onClose, onSelect, onSubmit }) {
  const [query, setQuery] = useState('');
  const [placeholder, setPlaceholder] = useState('');
  const inputRef = useRef(null);

  // Typewriter animation: types each story, pauses, deletes, then cycles
  // to the next one — repeating continuously while the panel is open.
  useEffect(() => {
    if (!open) {
      setPlaceholder('');
      return;
    }
    let phrase = 0;
    let char = 0;
    let deleting = false;
    let timer;

    const step = () => {
      const text = STORIES[phrase];
      if (!deleting) {
        char += 1;
        setPlaceholder(text.slice(0, char));
        if (char === text.length) {
          deleting = true;
          timer = setTimeout(step, 1500); // hold the full sentence
        } else {
          timer = setTimeout(step, 55);
        }
      } else {
        char -= 1;
        setPlaceholder(text.slice(0, char));
        if (char === 0) {
          deleting = false;
          phrase = (phrase + 1) % STORIES.length;
          timer = setTimeout(step, 350); // brief gap before next story
        } else {
          timer = setTimeout(step, 25);
        }
      }
    };

    step();
    return () => clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
    if (!open) setQuery('');
  }, [open]);

  const matches = query ? searchProducts(products, query) : products;

  return (
    <div className={`search-panel ${open ? 'open' : ''}`}>
      <div className="search-panel-inner">
        <div className="search-bar">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            ref={inputRef}
            className="search-panel-input"
            placeholder={placeholder || 'Tell us your story…'}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose();
              if (e.key === 'Enter' && query.trim()) onSubmit(query.trim());
            }}
          />
          <button className="search-panel-close" onClick={onClose} aria-label="Close search">×</button>
        </div>

        {!query && (
          <div className="search-chips">
            <span className="search-chips-label">Try:</span>
            {CHIPS.map((c) => (
              <button key={c.label} className="search-chip" onClick={() => onSubmit(c.query)}>
                {c.label}
              </button>
            ))}
          </div>
        )}

        {query && (
          <div className="search-panel-results">
            <button className="search-viewall" onClick={() => onSubmit(query.trim())}>
              View all {matches.length} result{matches.length === 1 ? '' : 's'} →
            </button>
            {matches.length ? (
              matches.slice(0, 8).map((p) => (
                <div className="search-result" key={p.id} onClick={() => onSelect(p)}>
                  <img src={p.image} alt={p.name} />
                  <div>
                    <div className="name">{p.name}</div>
                    <div className="price">
                      {p.silhouette} · ₹ {p.price.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="search-none">
                Hmm, nothing matches “{query}” yet — try “party”, “college” or “gift”.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
