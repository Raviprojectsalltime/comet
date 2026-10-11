import { useState } from 'react';

export default function CartDrawer({ items, onClose, onRemove, onCheckout, user, onLogin }) {
  const [placed, setPlaced] = useState(false);
  const total = items.reduce((sum, i) => sum + i.price, 0);

  if (placed) {
    return (
      <>
        <div className="drawer-backdrop" onClick={onClose} />
        <aside className="cart-drawer">
          <div className="cart-header">
            ORDER PLACED
            <button className="cart-close" onClick={onClose} aria-label="Close cart">×</button>
          </div>
          <div className="cart-items order-placed">
            <div className="order-tick">✓</div>
            <p className="order-title">Thanks, Cometeer!</p>
            <p className="order-sub">
              Your order is confirmed. We'll WhatsApp you the tracking details shortly.
            </p>
            <button className="btn-dark" onClick={onClose}>CONTINUE SHOPPING</button>
          </div>
        </aside>
      </>
    );
  }

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <aside className="cart-drawer">
        <div className="cart-header">
          CART ({items.length})
          <button className="cart-close" onClick={onClose} aria-label="Close cart">×</button>
        </div>

        <div className="cart-items">
          {items.length === 0 ? (
            <div className="cart-empty">
              <p>Your cart is empty.</p>
              <p>No pairs yet, let's fix that.</p>
            </div>
          ) : (
            items.map((item) => (
              <div className="cart-item" key={item.key}>
                <img src={item.image} alt={item.name} />
                <div className="cart-item-info">
                  <div className="cart-item-name">{item.title}</div>
                  <div className="cart-item-meta">
                    {item.silhouette} · Size UK {item.size}
                  </div>
                  <div className="cart-item-price">₹ {item.price.toLocaleString('en-IN')}</div>
                </div>
                <button className="cart-item-remove" onClick={() => onRemove(item.key)}>
                  Remove
                </button>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="cart-footer">
            {user ? (
              <p className="cart-as">Ordering as <b>{user.email}</b></p>
            ) : (
              <button className="cart-login-link" onClick={onLogin}>
                Log in to attach this order to your account
              </button>
            )}
            <div className="cart-total">
              <span>Subtotal</span>
              <span>₹ {total.toLocaleString('en-IN')}</span>
            </div>
            <button
              className="btn-checkout"
              onClick={() => {
                onCheckout();
                setPlaced(true);
              }}
            >
              CHECKOUT
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
