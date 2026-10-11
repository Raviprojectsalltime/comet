import { useEffect, useRef, useState } from 'react';

const nameFromEmail = (email = '') => {
  const n = email.split('@')[0].replace(/[^a-zA-Z]/g, '');
  return n ? n[0].toUpperCase() + n.slice(1) : 'Cometeer';
};

export default function HelpChat({ open, onClose, user, onLogin }) {
  const greeting = user
    ? `Hi ${nameFromEmail(user.email)}! Welcome to Comet Support. How can we help you today? You can ask about your products, orders, delivery, shoe care, or any issue you're experiencing.`
    : "Hi! Welcome to Comet Support. How can we help you today? You can ask about our products, delivery, shoe care, or any issue you're experiencing.";

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [stage, setStage] = useState('chat'); // chat | resolving | escalate-offer | anything-else | rating | done
  const [product, setProduct] = useState(null);
  const [orders, setOrders] = useState(null);
  const [showProducts, setShowProducts] = useState(false);
  const [lastCategory, setLastCategory] = useState(null);
  const [unresolved, setUnresolved] = useState(0);
  const [escEmail, setEscEmail] = useState('');
  const [escSending, setEscSending] = useState(false);
  const [feedback, setFeedback] = useState('');
  const listRef = useRef(null);
  const fileRef = useRef(null);

  // On open: greet by name and fetch verified purchases for the product row.
  useEffect(() => {
    if (!open) return;
    setMessages([{ from: 'bot', text: greeting }]);
    if (user?.email) {
      setEscEmail(user.email);
      fetch(`/api/orders?email=${encodeURIComponent(user.email)}`)
        .then((r) => r.json())
        .then((o) => {
          const list = Array.isArray(o) ? o : [];
          setOrders(list);
          setShowProducts(list.length > 0);
        })
        .catch(() => setOrders([]));
    }
  }, [open, user]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending, stage, showProducts]);

  const push = (m) => setMessages((ms) => [...ms, m]);

  const send = async (text, image) => {
    const msg = (text ?? input).trim();
    if ((!msg && !image) || sending) return;
    setInput('');
    setShowProducts(false);
    const userMsg = { from: 'user', text: msg, image: image || undefined };
    push(userMsg);
    setSending(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          product,
          email: user?.email,
          image,
          history: [...messages, userMsg].slice(-10),
        }),
      });
      const data = await res.json();
      push({ from: 'bot', text: data.reply, followUp: data.followUp });
      setLastCategory(data.category || null);
      if (data.offerEscalation) setStage('escalate-offer');
      else if (data.resolvable) setStage('resolving');
    } catch {
      push({ from: 'bot', text: 'Oops, something went wrong. Please try again.' });
    } finally {
      setSending(false);
    }
  };

  // Downscale the photo so the data URL stays small enough for the API.
  const sendImage = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = Math.min(1, 900 / Math.max(img.width, img.height));
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        send('', canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  const selectProduct = (item, order) => {
    setProduct({ ...item, orderId: order.orderId, orderDate: order.date, orderStatus: order.status });
    setShowProducts(false);
    push({ from: 'user', text: `I need help with my ${item.silhouette} ${item.title}` });
    push({
      from: 'bot',
      text: `Got it! Your ${item.silhouette} ${item.title} (${item.color}, UK ${item.size}) from order ${order.orderId}, ${order.status.toLowerCase()} on ${new Date(order.date).toLocaleDateString('en-IN')}. What issue are you facing with this product?`,
    });
    setStage('chat');
  };

  const resolved = (yes) => {
    if (yes) {
      push({ from: 'user', text: 'Yes, that helped' });
      push({ from: 'bot', text: "Glad we could help! Is there anything else you'd like to ask?" });
      setStage('anything-else');
    } else {
      push({ from: 'user', text: "No, it's still not resolved" });
      const n = unresolved + 1;
      setUnresolved(n);
      if (n >= 2) {
        push({
          from: 'bot',
          text: "I'm sorry we couldn't fully resolve your issue. Would you like me to send your case to Comet Customer Support?",
        });
        setStage('escalate-offer');
      } else {
        push({
          from: 'bot',
          text: "Okay, let's try one more thing. Can you describe what's happening in a bit more detail? If it's damage or a defect, a photo would really help (use the attachment button).",
        });
        setStage('chat');
      }
    }
  };

  const anythingElse = (yes) => {
    if (yes) {
      push({ from: 'user', text: 'Yes, I have another question' });
      push({ from: 'bot', text: 'Go ahead, what else can I help with?' });
      setStage('chat');
    } else {
      push({ from: 'user', text: 'No, that’s all' });
      push({ from: 'bot', text: 'How would you rate your support experience with Comet?' });
      setStage('rating');
    }
  };

  const submitRating = async (stars) => {
    try {
      await fetch('/api/chat/rating', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: stars, feedback }),
      });
    } catch { /* non-blocking */ }
    push({ from: 'bot', text: `Thanks for the ${stars}-star rating! Never Shy, Never Sorry.` });
    setStage('done');
  };

  const escalate = async () => {
    if (!escEmail.trim() || escSending) return;
    setEscSending(true);
    try {
      const res = await fetch('/api/chat/escalate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: escEmail.trim(),
          product,
          history: messages,
          category: lastCategory,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      push({
        from: 'bot',
        text: data.emailSent
          ? `Done! I've emailed your case to our support team (${data.to}). Ticket ${data.ticket}. They'll reply to ${escEmail.trim()} shortly.`
          : `Done! Your case is filed as ticket ${data.ticket} with our support team. They'll reply to ${escEmail.trim()} shortly.`,
      });
      setStage('done');
    } catch (e) {
      push({ from: 'bot', text: `I couldn't send that just now (${e.message}). You can also reach us on WhatsApp +91 9606081463.` });
      setStage('chat');
    } finally {
      setEscSending(false);
    }
  };

  const reset = () => {
    setMessages([{ from: 'bot', text: greeting }]);
    setStage('chat');
    setUnresolved(0);
    setProduct(null);
    setShowProducts((orders || []).length > 0);
  };

  if (!open) return null;

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <div>
          <div className="title">Comet Support</div>
          <div className="sub">{user ? `Welcome, ${nameFromEmail(user.email)}` : 'Guest · log in for order help'}</div>
        </div>
        <button className="chat-close" onClick={onClose} aria-label="Close help chat">×</button>
      </div>

      {product && (
        <div className="chat-product-bar">
          {product.image && <img src={product.image} alt="" />}
          <div>
            <b>{product.silhouette} {product.title}</b>
            <span>{product.color} · UK {product.size} · {product.orderId}</span>
          </div>
          <button onClick={() => setShowProducts(true)}>Change</button>
        </div>
      )}

      <div className="chat-messages" ref={listRef}>
        {messages.map((m, i) =>
          m.image ? (
            <div key={i} className="chat-msg user chat-img">
              <img src={m.image} alt="uploaded" />
              {m.text && <div>{m.text}</div>}
            </div>
          ) : (
            <div key={i} className={`chat-msg ${m.from}`}>
              {m.text}
              {m.followUp && <div className="chat-followup">{m.followUp}</div>}
            </div>
          )
        )}
        {sending && (
          <div className="chat-msg bot chat-typing">
            <span /><span /><span />
          </div>
        )}

        {showProducts && orders && orders.length > 0 && (
          <div className="chat-products-wrap">
            <div className="chat-products-label">Your purchases. Tap one for help</div>
            <div className="chat-product-row">
              {orders.map((o) =>
                o.items.map((it, idx) => (
                  <button
                    key={`${o.orderId}-${idx}`}
                    className="chat-product-mini"
                    onClick={() => selectProduct(it, o)}
                  >
                    {it.image && <img src={it.image} alt={it.title} />}
                    <b>{it.silhouette} {it.title}</b>
                    <span>UK {it.size} · {o.orderId}</span>
                    <span className="cp-status">{o.status}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {stage === 'resolving' && (
          <div className="chat-chips">
            <span className="chat-ask">Did this help resolve your issue?</span>
            <button className="chat-chip" onClick={() => resolved(true)}>Yes, resolved</button>
            <button className="chat-chip" onClick={() => resolved(false)}>Not resolved</button>
          </div>
        )}

        {stage === 'anything-else' && (
          <div className="chat-chips">
            <button className="chat-chip" onClick={() => anythingElse(true)}>Yes, another question</button>
            <button className="chat-chip" onClick={() => anythingElse(false)}>No, that’s all</button>
          </div>
        )}

        {stage === 'escalate-offer' && (
          <div className="chat-escalate">
            <p>Send this case to customer support?</p>
            <input
              className="chat-email"
              type="email"
              placeholder="Your email for follow-up"
              value={escEmail}
              onChange={(e) => setEscEmail(e.target.value)}
            />
            <div className="chat-chips">
              <button className="chat-chip dark" onClick={escalate} disabled={escSending}>
                {escSending ? 'Sending…' : 'Yes, create ticket'}
              </button>
              <button className="chat-chip" onClick={() => setStage('chat')}>Keep chatting</button>
            </div>
          </div>
        )}

        {stage === 'rating' && (
          <div className="chat-rating">
            <div className="stars">
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} onClick={() => submitRating(s)} aria-label={`${s} star`}>★</button>
              ))}
            </div>
            <input
              className="chat-email"
              placeholder="Optional feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            />
          </div>
        )}

        {stage === 'done' && (
          <div className="chat-chips">
            <button className="chat-chip" onClick={reset}>Start a new conversation</button>
          </div>
        )}
      </div>

      <div className="chat-input">
        <button
          className="chat-attach"
          onClick={() => fileRef.current?.click()}
          aria-label="Upload a photo of the issue"
          title="Upload a photo"
        >
          📎
        </button>
        <input
          type="file"
          accept="image/*"
          ref={fileRef}
          style={{ display: 'none' }}
          onChange={(e) => sendImage(e.target.files?.[0])}
        />
        <input
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
        />
        <button onClick={() => send()}>SEND</button>
      </div>
    </div>
  );
}
