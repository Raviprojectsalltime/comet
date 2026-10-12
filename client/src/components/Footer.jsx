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
              <svg width="20" height="20" viewBox="0 0 512 512"><path d="M325.3 234.3 104.6 13l280.8 161.3-60.1 60z" fill="#FF4444"/><path d="M47 0C34 6.8 25.3 19.2 25.3 35.3v441.4c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0z" fill="#00D2FF"/><path d="M472.2 225.6l-58.9-41.2-84.9 50.4 84.9 50.4 58.9-41.2c15.2-8.5 15.2-30.5 0-38.4z" fill="#FFBE00"/><path d="M104.6 499l280.8-161.2-60.1-60.1L104.6 499z" fill="#00F076"/></svg>
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
