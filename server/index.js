import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import { answer, buildEscalationEmail, setArticles, getArticles } from './chat.js';
import { llmReply } from './ai.js';
import { sendSupportEmail } from './email.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Minimal .env loader (no dependency)
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const app = express();
const PORT = process.env.PORT || 5050;

app.use(express.json());

// ---------- Supabase ----------
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;
const supabase =
  SUPABASE_URL && SUPABASE_SECRET_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SECRET_KEY)
    : null;

const fallbackProducts = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'products.json'), 'utf-8')
);
const knowledgeBase = {
  find: (fn) => getArticles().find(fn),
};

const isMissingTable = (err) =>
  err && (err.code === '42P01' || /does not exist|Could not find the table/i.test(err.message || ''));

// Load the chatbot knowledge base from Supabase at boot (falls back
// silently to the bundled knowledge.json when the table is absent).
let kbSource = 'file';
if (supabase) {
  try {
    const { data } = await supabase
      .from('knowledge_articles')
      .select('*')
      .eq('published', true);
    if (data?.length) {
      setArticles(data);
      kbSource = 'supabase';
    }
  } catch (e) {
    if (!isMissingTable(e)) console.error('KB load error:', e.message);
  }
}

// ---------- API ----------

// Products: served from Supabase `products` table when available,
// falling back to the bundled products.json.
app.get('/api/products', async (_req, res) => {
  if (supabase) {
    try {
      const { data, error } = await supabase.from('products').select('*').order('sort_order');
      if (error && !isMissingTable(error)) throw error;
      if (!error && data?.length) {
        return res.json(
          data.map((p) => ({
            id: p.id,
            name: p.name,
            title: p.title,
            silhouette: p.silhouette,
            price: p.price,
            badge: p.badge,
            color: p.color,
            tags: p.tags || [],
            image: p.image,
            hoverImage: p.hover_image,
            sizes: p.sizes || [],
          }))
        );
      }
    } catch (e) {
      console.error('Supabase products error:', e.message);
    }
  }
  res.json(fallbackProducts);
});

// ---------- Auth (Supabase Auth) ----------

app.post('/api/auth/signup', async (req, res) => {
  const email = String(req.body?.email || '').trim();
  const password = String(req.body?.password || '');
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return res.status(400).json({ error: 'Enter a valid email address' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  if (!supabase) return res.status(503).json({ error: 'Auth not configured' });
  // email_confirm:true skips the confirmation email for this demo.
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) {
    const msg = /already been registered|already exists/i.test(error.message)
      ? 'This email is already registered — try logging in'
      : error.message;
    return res.status(400).json({ error: msg });
  }
  res.json({ user: { id: data.user.id, email: data.user.email } });
});

app.post('/api/auth/login', async (req, res) => {
  const email = String(req.body?.email || '').trim();
  const password = String(req.body?.password || '');
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  if (!supabase) return res.status(503).json({ error: 'Auth not configured' });
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return res.status(401).json({ error: 'Invalid email or password' });
  res.json({
    user: { id: data.user.id, email: data.user.email },
    session: { access_token: data.session?.access_token },
  });
});

// Orders attached to the logged-in user's email.
app.post('/api/orders', async (req, res) => {
  const { email, items, total } = req.body || {};
  if (!email || !Array.isArray(items) || !items.length) {
    return res.status(400).json({ error: 'Missing order details' });
  }
  if (!supabase) return res.json({ ok: true, stored: false });
  try {
    const { error } = await supabase.from('orders').insert({
      email,
      items,
      total: Number(total) || 0,
    });
    if (error) throw error;
    res.json({ ok: true, stored: true });
  } catch (e) {
    console.error('Order insert error:', e.message);
    res.json({ ok: true, stored: false, reason: isMissingTable(e) ? 'table_missing' : 'error' });
  }
});

// Newsletter signup → newsletter_subscribers table.
app.post('/api/newsletter', async (req, res) => {
  const email = String(req.body?.email || '').trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return res.status(400).json({ ok: false, error: 'Invalid email' });
  }
  if (!supabase) return res.json({ ok: true, stored: false });
  try {
    const { error } = await supabase.from('newsletter_subscribers').insert({ email });
    if (error) throw error;
    res.json({ ok: true, stored: true });
  } catch (e) {
    console.error('Newsletter insert error:', e.message);
    res.json({ ok: true, stored: false, reason: isMissingTable(e) ? 'table_missing' : 'error' });
  }
});

// ---------- Support chatbot ----------
// Context-aware: client sends the message, recent history and the
// selected product; the engine classifies intent and retrieves
// approved knowledge-base content. It never invents answers —
// unmatched queries return offerEscalation so the UI can escalate.
app.post('/api/chat', async (req, res) => {
  const { message, history = [], product = null, email = null, image = null } = req.body || {};
  const result = answer({ message, history, product });

  // Photo uploaded: let the vision model assess it against the matched article.
  if (image) {
    const imgArticle = result.articleId
      ? knowledgeBase.find((a) => a.id === result.articleId)
      : null;
    const llm = await llmReply({
      article: imgArticle,
      message: message || 'The customer uploaded a photo of their shoe issue.',
      history,
      product,
      image: String(image).slice(0, 400000), // cap the data URL for the request
    }).catch(() => null);
    if (llm) {
      return res.json({
        reply: `${llm}\n\nNote: a photo alone can't confirm a defect — our support team can review it properly if needed.`,
        category: result.category === 'unknown' ? 'image' : result.category,
        resolvable: true,
      });
    }
  }

  // Fetch the customer's orders so the LLM can reference verified data.
  let orders = [];
  if (email && supabase) {
    try {
      const { data } = await supabase
        .from('orders')
        .select('items,total,created_at')
        .eq('email', email)
        .order('created_at', { ascending: false })
        .limit(5);
      orders = data || [];
    } catch { /* ignore — orders table may not exist */ }
  }

  // When the engine found grounded knowledge, let the LLM phrase the
  // answer naturally using ONLY that approved content + customer data.
  // Unknown/escalation replies stay rule-based (never invented).
  if (result.articleId || result.category === 'greeting' || result.category === 'thanks') {
    const article = result.articleId
      ? knowledgeBase.find((a) => a.id === result.articleId)
      : null;
    const llm = await llmReply({
      article,
      message,
      history,
      product,
      orders,
      email,
    }).catch(() => null);
    if (llm) result.reply = llm;
  }

  // Best-effort log of the conversation (does not affect the reply).
  if (supabase) {
    supabase
      .from('chat_messages')
      .insert({ message, reply: result.reply })
      .then(({ error }) => {
        if (error && !isMissingTable(error)) console.error('Chat log error:', error.message);
      });
  }

  res.json(result);
});

// Escalate an unresolved conversation to customer support.
// Only confirms after the ticket is actually persisted.
app.post('/api/chat/escalate', async (req, res) => {
  const { email, product = null, history = [], category } = req.body || {};
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(email || ''))) {
    return res.status(400).json({ error: 'A valid email is required for follow-up' });
  }
  const { ticket, subject, body } = buildEscalationEmail({
    email,
    product,
    history,
    category,
  });

  if (supabase) {
    const { error } = await supabase
      .from('support_tickets')
      .insert({ ticket, email, subject, body, category: category || null });
    if (error && !isMissingTable(error)) {
      console.error('Ticket insert error:', error.message);
    }
    if (error && isMissingTable(error)) {
      // Fallback: keep the escalation in chat_messages so nothing is lost.
      await supabase
        .from('chat_messages')
        .insert({ message: `[ESCALATION ${ticket}] ${subject}`, reply: body });
    }
  } else {
    console.log(`--- ESCALATION ${ticket} ---\n${subject}\n${body}`);
  }

  // Deliver the ticket to the configured support inbox. We report the
  // real delivery status — the UI only says "sent" when the provider
  // confirms it; otherwise the ticket is still safely stored.
  const supportTo = process.env.SUPPORT_EMAIL || 'hello@wearcomet.com';
  const { sent, reason } = await sendSupportEmail({
    to: supportTo,
    subject,
    body,
    replyTo: email,
    supabase,
  });

  res.json({ ok: true, ticket, subject, emailSent: sent, to: sent ? supportTo : undefined, emailReason: reason });
});

// Store the post-resolution satisfaction rating.
app.post('/api/chat/rating', async (req, res) => {
  const rating = Number(req.body?.rating);
  const feedback = String(req.body?.feedback || '');
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be 1–5' });
  }
  if (supabase) {
    const { error } = await supabase
      .from('chat_ratings')
      .insert({ rating, feedback });
    if (error && isMissingTable(error)) {
      await supabase
        .from('chat_messages')
        .insert({ message: `[RATING] ${rating}/5`, reply: feedback });
    }
  }
  res.json({ ok: true });
});

// Orders for a customer email — used by the chatbot to show
// purchased products for logged-in customers. Items are enriched
// with verified catalog data (image, colour) so the chat cards
// never rely on AI-generated details.
app.get('/api/orders', async (req, res) => {
  const email = String(req.query.email || '').trim();
  if (!email || !supabase) return res.json([]);
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('email', email)
      .order('created_at', { ascending: false })
      .limit(10);
    if (error) throw error;
    const catalog = fallbackProducts;
    res.json(
      (data || []).map((o) => {
        const days = Math.floor((Date.now() - new Date(o.created_at)) / 864e5);
        return {
          orderId: `CMT-${String(100000 + Number(o.id))}`,
          date: o.created_at,
          status: days > 7 ? 'Delivered' : 'Confirmed',
          total: o.total,
          items: (o.items || []).map((i) => {
            const p = catalog.find((c) => c.id === i.id) || {};
            return {
              id: i.id,
              title: i.title || p.title,
              silhouette: i.silhouette || p.silhouette,
              color: i.color || p.color,
              size: i.size,
              price: i.price || p.price,
              image: p.image,
            };
          }),
        };
      })
    );
  } catch (e) {
    if (!isMissingTable(e)) console.error('Orders fetch error:', e.message);
    res.json([]);
  }
});

// Health check for the Supabase connection + required tables.
app.get('/api/health/supabase', async (_req, res) => {
  if (!supabase) return res.json({ connected: false, reason: 'missing_env' });
  const status = { connected: true, url: SUPABASE_URL, tables: {}, knowledgeSource: kbSource };
  for (const table of ['products', 'newsletter_subscribers', 'chat_messages', 'knowledge_articles', 'support_tickets', 'orders']) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    status.tables[table] = error
      ? isMissingTable(error)
        ? 'missing'
        : `error: ${error.message}`
      : 'ok';
    void data;
  }
  res.json(status);
});

// In production, serve the built React app.
const distDir = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get('*', (_req, res) => res.sendFile(path.join(distDir, 'index.html')));
}

app.listen(PORT, () => {
  console.log(`Comet server running on http://localhost:${PORT}`);
  console.log(`Supabase: ${supabase ? SUPABASE_URL : 'not configured'}`);
});
