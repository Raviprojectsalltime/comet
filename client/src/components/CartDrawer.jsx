export default function CartDrawer({ items, onClose, onRemove, onCheckout }) {
  const total = items.reduce((sum, i) => sum + i.price, 0);

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
            <div className="cart-total">
              <span>Subtotal</span>
              <span>₹ {total.toLocaleString('en-IN')}</span>
            </div>
            <button className="btn-checkout" onClick={onCheckout}>CHECKOUT</button>
          </div>
        )}
      </aside>
    </>
  );
}
