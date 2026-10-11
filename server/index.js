import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5050;

app.use(express.json());

const products = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'products.json'), 'utf-8')
);

app.get('/api/products', (_req, res) => {
  res.json(products);
});

// Simple rule-based chatbot endpoint for the Help widget.
app.post('/api/chat', (req, res) => {
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

  res.json({ reply });
});

// In production, serve the built React app.
const distDir = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get('*', (_req, res) => res.sendFile(path.join(distDir, 'index.html')));
}

app.listen(PORT, () => {
  console.log(`Comet server running on http://localhost:${PORT}`);
});
