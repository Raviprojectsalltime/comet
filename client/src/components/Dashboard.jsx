import { useEffect, useState } from 'react';

export default function Dashboard({ user, onBack }) {
  const [orders, setOrders] = useState(null);
  const [tickets, setTickets] = useState(null);

  useEffect(() => {
    if (!user?.email) return;
    fetch(`/api/orders?email=${encodeURIComponent(user.email)}`)
      .then((r) => r.json())
      .then((d) => setOrders(Array.isArray(d) ? d : []))
      .catch(() => setOrders([]));
    fetch(`/api/tickets?email=${encodeURIComponent(user.email)}`)
      .then((r) => r.json())
      .then((d) => setTickets(Array.isArray(d) ? d : []))
      .catch(() => setTickets([]));
  }, [user]);

  return (
    <section className="results-page dashboard-page">
      <button className="results-back" onClick={onBack}>← Back to home</button>
      <h2 className="results-title">My Dashboard</h2>
      <p className="results-sub">{user?.email}</p>

      <h3 className="dash-heading">Orders</h3>
      {orders === null ? (
        <p className="dash-empty">Loading…</p>
      ) : orders.length === 0 ? (
        <p className="dash-empty">No orders yet — time to fix that.</p>
      ) : (
        <div className="dash-orders">
          {orders.map((o) =>
            o.items.map((it, i) => (
              <div key={`${o.orderId}-${i}`} className="dash-order">
                {it.image && <img src={it.image} alt={it.title} />}
                <div className="dash-order-info">
                  <b>{it.silhouette} {it.title}</b>
                  <span>{it.color} · UK {it.size} · ₹{it.price?.toLocaleString('en-IN')}</span>
                  <span className="dash-order-meta">
                    {o.orderId} · {new Date(o.date).toLocaleDateString('en-IN')} ·{' '}
                    <em className={o.status === 'Delivered' ? 'st-green' : 'st-gold'}>{o.status}</em>
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <h3 className="dash-heading">Support Tickets</h3>
      {tickets === null ? (
        <p className="dash-empty">Loading…</p>
      ) : tickets.length === 0 ? (
        <p className="dash-empty">No support tickets — everything's running smooth.</p>
      ) : (
        <div className="dash-tickets">
          {tickets.map((t) => (
            <div key={t.ticket} className="dash-ticket">
              <div className="dash-ticket-head">
                <b>#{t.ticket}</b>
                <span className={`st-${t.status === 'open' ? 'gold' : 'green'}`}>{t.status}</span>
              </div>
              <div className="dash-ticket-sub">{t.subject}</div>
              <div className="dash-ticket-meta">
                {t.category || 'General'} · {new Date(t.created_at).toLocaleDateString('en-IN')}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
