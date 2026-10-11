import { useEffect, useRef, useState } from 'react';

const GREETING = {
  from: 'bot',
  text: "Hey Cometeer! I'm the Comet help bot. Ask me about your order, sizes, returns or the Hukum drop.",
};

export default function HelpChat({ open, onClose }) {
  const [messages, setMessages] = useState([GREETING]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput('');
    setMessages((m) => [...m, { from: 'user', text }]);
    setSending(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      setMessages((m) => [...m, { from: 'bot', text: data.reply }]);
    } catch {
      setMessages((m) => [
        ...m,
        { from: 'bot', text: 'Oops, something went wrong. Please try again.' },
      ]);
    } finally {
      setSending(false);
    }
  };

  if (!open) return null;

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <div>
          <div className="title">Comet Help</div>
          <div className="sub">Typically replies instantly</div>
        </div>
        <button className="chat-close" onClick={onClose} aria-label="Close help chat">×</button>
      </div>
      <div className="chat-messages" ref={listRef}>
        {messages.map((m, i) => (
          <div key={i} className={`chat-msg ${m.from}`}>{m.text}</div>
        ))}
        {sending && <div className="chat-msg bot">Typing…</div>}
      </div>
      <div className="chat-input">
        <input
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
        />
        <button onClick={send}>SEND</button>
      </div>
    </div>
  );
}
