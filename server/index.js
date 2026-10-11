import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

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

const isMissingTable = (err) =>
  err && (err.code === '42P01' || /does not exist|Could not find the table/i.test(err.message || ''));

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

// Simple rule-based chatbot endpoint for the Help widget.
app.post('/api/chat', async (req, res) => {
  const message = String(req.body?.message || '').toLowerCase();
  let reply =
    "Thanks for reaching out! A Comet crew member will get back to you soon. Meanwhile, try asking about orders, sizes, or the Hukum drop.";

  if (/(track|order|shipping|delivery)/.test(message)) {
    reply =
      'You can track your order from the "Track your Order" link in the footer, or share your order ID here and I will look into it.';
  } else if (/(size|fit|sizing)/.test(message)) {
    reply =
      'Comets run true to size. If you are between sizes, we recommend going half a size up. All sizes are UK sizes.';
  } else if (/(return|exchange|refund)/.test(message)) {
    reply =
      'We offer easy 7-day returns and exchanges. Head to "Returns and Exchanges" in the footer to start one.';
  } else if (/(hukum|pre-?order|drop)/.test(message)) {
    reply =
      'Hukum is our Designer Special drop — the first batch sold out in hours! Pre-orders for the final batch are open now at ₹5,899.';
  } else if (/(price|cost|discount|offer)/.test(message)) {
    reply =
      'X Lows start at ₹4,299, Aeres at ₹5,299 and Astra at ₹4,899. Keep an eye on The Vault for exclusive prices.';
  } else if (/(hi|hello|hey|namaste)/.test(message)) {
    reply = 'Hey Cometeer! How can I help you today?';
  } else if (/(contact|human|support|agent)/.test(message)) {
    reply =
      'You can reach us on WhatsApp at +91 9606081463 or email hello@wearcomet.com. Anything else I can help with?';
  }

  // Best-effort log of the conversation (does not affect the reply).
  if (supabase) {
    supabase
      .from('chat_messages')
      .insert({ message: req.body?.message, reply })
      .then(({ error }) => {
        if (error && !isMissingTable(error)) console.error('Chat log error:', error.message);
      });
  }

  res.json({ reply });
});

// Health check for the Supabase connection + required tables.
app.get('/api/health/supabase', async (_req, res) => {
  if (!supabase) return res.json({ connected: false, reason: 'missing_env' });
  const status = { connected: true, url: SUPABASE_URL, tables: {} };
  for (const table of ['products', 'newsletter_subscribers', 'chat_messages']) {
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
