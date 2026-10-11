const SNEAKERS_MEN = ['Shop All', 'X Lows', 'Aeon', 'Apex', 'Aeres', 'Hukum'];
const SNEAKERS_WOMEN = ['Shop All', 'X Lows', 'Astra', 'Aeon', 'Apex', 'Aeres', 'Hukum'];

export default function Header({ cartCount, onCart, onSearch, onLogin, onHelp, onShopMen, onShopWomen }) {
  return (
    <header className="header">
      <a className="header-logo" href="/">COMET</a>

      <nav className="header-nav">
        <div className="nav-item has-dropdown">
          Men
          <div className="nav-dropdown">
            {SNEAKERS_MEN.map((s) => (
              <button key={s} onClick={onShopMen}>{s}</button>
            ))}
          </div>
        </div>
        <div className="nav-item has-dropdown">
          Women
          <div className="nav-dropdown">
            {SNEAKERS_WOMEN.map((s) => (
              <button key={s} onClick={onShopWomen}>{s}</button>
            ))}
          </div>
        </div>
        <button className="nav-item" onClick={onShopMen}>The Vault</button>
        <button className="nav-item" onClick={onShopMen}>About Us</button>
        <button className="nav-item nav-search" onClick={onSearch}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
          Search
        </button>
      </nav>

      <div className="header-icons">
        <button className="help-btn" onClick={onHelp}>Help</button>
        <button className="icon-btn" onClick={onLogin} aria-label="Account">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/></svg>
        </button>
        <button className="icon-btn" onClick={onCart} aria-label="Cart">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 7h12l1.5 13.5a1 1 0 0 1-1 1.1H5.5a1 1 0 0 1-1-1.1L6 7z"/><path d="M9 10V6a3 3 0 0 1 6 0v4"/></svg>
          {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
        </button>
      </div>
    </header>
  );
}
