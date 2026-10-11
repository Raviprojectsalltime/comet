import { useState } from 'react';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const subscribe = async () => {
    if (!email) return;
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.ok) setSubscribed(true);
    } catch {
      // keep the UI quiet on network errors
    }
  };

  return (
    <footer className="footer">
      <div className="footer-grid">
        <div>
          <div className="footer-brand">COMET</div>
          <p>Never Shy Never Sorry.</p>
          <p>India's homegrown sneaker brand, made for the bold.</p>
        </div>

        <div>
          <h4>GET IN TOUCH</h4>
          <p>Whatsapp: +91 9606081463</p>
          <p>Support: hello@wearcomet.com</p>
          <p>Gifting & Corporate: bulkorders@wearcomet.com</p>
          <p>Partnerships: partnerships@wearcomet.com</p>
        </div>

        <div>
          <h4>HELP</h4>
          <a href="#products">Track your Order</a>
          <a href="#products">Store Locator</a>
          <a href="#products">Returns and Exchange</a>
          <a href="#products">Care</a>
          <a href="#products">FAQ</a>
          <a href="#products">Contact Us</a>
        </div>

        <div>
          <h4>NEWSLETTER</h4>
          <p>Subscribe for drops, offers and all things Comet.</p>
          {subscribed ? (
            <p style={{ color: '#e8ff47' }}>Thanks for subscribing!</p>
          ) : (
            <div className="newsletter-input">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button onClick={subscribe}>JOIN</button>
            </div>
          )}
          <div className="store-badges">
            <a className="store-badge" href="https://www.wearcomet.com/" target="_blank" rel="noreferrer">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.08zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
              <span><small>Download on the</small>App Store</span>
            </a>
            <a className="store-badge" href="https://www.wearcomet.com/" target="_blank" rel="noreferrer">
              <svg width="16" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M3.6 2.3 13.7 12 3.6 21.7c-.36-.2-.6-.6-.6-1.1V3.4c0-.5.24-.9.6-1.1zm11.5 8.3L4.6 1.6l12.9 7.3-2.4 1.7zm2.4 1.7-2.4 1.7 2.4 1.7 2.4-1.5c.9-.5.9-1.4 0-1.9l-2.4-.1zM4.6 22.4l10.5-9 2.4 1.7-12.9 7.3z"/></svg>
              <span><small>Get it on</small>Google Play</span>
            </a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        © {new Date().getFullYear()} Comet. Koramangala, Bengaluru, Karnataka, India.
      </div>
    </footer>
  );
}
