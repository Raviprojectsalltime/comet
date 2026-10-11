const STOP_WORDS = new Set([
  'a', 'an', 'the', 'me', 'my', 'i', 'for', 'to', 'and', 'or', 'with', 'want',
  'need', 'find', 'get', 'pair', 'of', 'shoe', 'shoes', 'sneaker', 'sneakers',
  'something', 'use', 'used', 'it', 'as', 'well', 'both', 'combined', 'like',
  'going', 'best', 'where', 'that', 'can', 'also', 'suggest', 'tell', 'please',
  'wear', 'wearing', 'out', 'in', 'on', 'is', 'am', 'are', 'you', 'your',
]);

export function tokensFrom(query) {
  return String(query)
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter((t) => t && !STOP_WORDS.has(t));
}

export function scoreProduct(product, tokens) {
  const hay = `${product.name} ${product.silhouette} ${product.color} ${(product.tags || []).join(' ')}`.toLowerCase();
  return tokens.reduce((s, t) => (hay.includes(t) ? s + 1 : s), 0);
}

export function searchProducts(products, query) {
  const tokens = tokensFrom(query);
  if (!tokens.length) return products;
  return products
    .map((p) => ({ p, s: scoreProduct(p, tokens) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .map((x) => x.p);
}
