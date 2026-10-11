const STOP_WORDS = new Set([
  'a', 'an', 'the', 'me', 'my', 'i', 'for', 'to', 'and', 'or', 'with', 'want',
  'need', 'find', 'get', 'pair', 'of', 'shoe', 'shoes', 'sneaker', 'sneakers',
  'something', 'use', 'used', 'it', 'as', 'well', 'both', 'combined', 'like',
  'going', 'best', 'where', 'that', 'can', 'also', 'suggest', 'tell', 'please',
  'wear', 'wearing', 'out', 'in', 'on', 'is', 'am', 'are', 'you', 'your',
  'looking', 'good', 'nice', 'some', 'any', 'which', 'what', 'would', 'should',
]);

// Map natural-language words to catalog vocabulary.
const SYNONYMS = {
  gym: 'sport',
  workout: 'sport',
  running: 'sport running',
  run: 'sport running',
  jogging: 'sport running',
  training: 'sport',
  sports: 'sport',
  athletic: 'sport',
  partywear: 'party',
  parties: 'party',
  clubbing: 'party',
  club: 'party',
  nightout: 'party night',
  festive: 'festive party',
  wedding: 'wedding party designer',
  shaadi: 'wedding party',
  marriage: 'wedding party',
  reception: 'wedding party',
  birthday: 'gift party',
  present: 'gift',
  gifting: 'gift',
  anniversary: 'gift date',
  girlfriend: 'girl women gift',
  wife: 'girl women gift',
  sister: 'girl women gift',
  boyfriend: 'boyfriend men gift',
  husband: 'boyfriend men gift',
  brother: 'boyfriend men gift',
  him: 'men',
  her: 'women girl',
  mens: 'men',
  womens: 'women',
  ladies: 'women',
  girls: 'girl women',
  boys: 'men boyfriend',
  college: 'college casual',
  campus: 'college',
  school: 'college',
  classes: 'college',
  everyday: 'everyday daily casual',
  office: 'office daily',
  work: 'office daily',
  dailywear: 'daily',
  regular: 'daily everyday',
  casuals: 'casual',
  weekend: 'casual',
  outing: 'casual',
  vacation: 'travel',
  trip: 'travel',
  trekking: 'travel sport',
  hike: 'travel',
  hiking: 'travel sport',
  date: 'date',
  dinner: 'date',
  trendy: 'trendy statement',
  fashion: 'trendy designer',
  stylish: 'trendy designer',
  fashionable: 'trendy designer',
  designer: 'designer special',
  premium: 'designer statement',
  luxury: 'designer statement',
  colorful: 'colorful',
  colourful: 'colorful',
  bright: 'colorful',
  bold: 'colorful statement',
  white: 'white',
  black: 'black',
  blue: 'blue',
  brown: 'brown',
  orange: 'orange',
  green: 'green',
  grey: 'grey',
  gray: 'grey',
};

// Very small stemming so "sports", "parties", "running" etc. still match tags.
function variants(token) {
  const out = [token];
  if (token.endsWith('ies') && token.length > 4) out.push(`${token.slice(0, -3)}y`);
  if (token.endsWith('es') && token.length > 3) out.push(token.slice(0, -2));
  if (token.endsWith('s') && token.length > 3) out.push(token.slice(0, -1));
  if (token.endsWith('ing') && token.length > 5) out.push(token.slice(0, -3));
  return out;
}

// Expand one raw token into the set of terms it should match against
// (the token itself, its stems, and any synonyms).
function expand(token) {
  const terms = new Set(variants(token));
  const syn = SYNONYMS[token] || SYNONYMS[terms.values().next().value];
  if (syn) syn.split(' ').forEach((s) => terms.add(s));
  // also try synonyms for the stemmed forms
  for (const v of variants(token)) {
    const s2 = SYNONYMS[v];
    if (s2) s2.split(' ').forEach((s) => terms.add(s));
  }
  return [...terms];
}

export function tokensFrom(query) {
  return String(query)
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t));
}

// Weighted score: name > silhouette > tags > colour.
// Phrase bonus when the whole query appears in the name (e.g. "x lows").
export function scoreProduct(product, tokens, rawQuery = '') {
  const name = product.name.toLowerCase();
  const silhouette = product.silhouette.toLowerCase();
  const color = (product.color || '').toLowerCase();
  const tags = (product.tags || []).map((t) => t.toLowerCase());

  let score = 0;
  for (const token of tokens) {
    const terms = expand(token);
    const hit = (field) => terms.some((v) => field.includes(v));
    if (hit(name)) score += 5;
    if (hit(silhouette)) score += 4;
    // Direct tag hit scores higher than synonym-expanded hits.
    const direct = variants(token);
    if (direct.some((v) => tags.includes(v))) score += 3;
    else if (terms.some((v) => tags.includes(v))) score += 2;
    else if (terms.some((v) => tags.some((tag) => tag.includes(v) || v.includes(tag)))) score += 1.5;
    if (hit(color)) score += 2;
  }

  const q = rawQuery.toLowerCase().trim();
  if (q && name.includes(q)) score += 8;
  if (q && silhouette.includes(q)) score += 6;
  return score;
}

export function searchProducts(products, query) {
  const tokens = tokensFrom(query);
  if (!tokens.length) return products;
  const scored = products
    .map((p) => ({ p, s: scoreProduct(p, tokens, query) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s);
  // If nothing scored, show everything rather than an empty page.
  return scored.length ? scored.map((x) => x.p) : products;
}
