import { useEffect, useState } from 'react';
import Header from './components/Header.jsx';
import Hero from './components/Hero.jsx';
import ProductCarousel from './components/ProductCarousel.jsx';
import XLowsSection from './components/XLowsSection.jsx';
import SplitTiles from './components/SplitTiles.jsx';
import Testimonials from './components/Testimonials.jsx';
import PressBar from './components/PressBar.jsx';
import Footer from './components/Footer.jsx';
import CartDrawer from './components/CartDrawer.jsx';
import SearchPanel from './components/SearchPanel.jsx';
import SearchResults from './components/SearchResults.jsx';
import Dashboard from './components/Dashboard.jsx';
import LoginModal from './components/LoginModal.jsx';
import QuickAddModal from './components/QuickAddModal.jsx';
import HelpChat from './components/HelpChat.jsx';

export default function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [quickAdd, setQuickAdd] = useState(null);
  const [toast, setToast] = useState('');
  const [page, setPage] = useState({ name: 'home' });
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('comet_user')) || null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    fetch('/api/products')
      .then((r) => r.json())
      .then((d) => setProducts(Array.isArray(d) ? d : []))
      .catch(() => setProducts([]));
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2200);
  };

  const addToCart = (product, size) => {
    setCart((c) => [...c, { ...product, size, key: `${product.id}-${size}-${Date.now()}` }]);
    setQuickAdd(null);
    setCartOpen(true);
  };

  const removeFromCart = (key) => setCart((c) => c.filter((i) => i.key !== key));

  const handleLogin = (u) => {
    setUser(u);
    localStorage.setItem('comet_user', JSON.stringify(u));
    setLoginOpen(false);
    showToast(`Welcome, ${u.email.split('@')[0]}!`);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('comet_user');
    showToast('Logged out');
  };

  const checkout = () => {
    const items = cart.map(({ id, title, silhouette, price, size }) => ({
      id, title, silhouette, price, size,
    }));
    const total = cart.reduce((s, i) => s + i.price, 0);
    if (user) {
      fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, items, total }),
      }).catch(() => {});
    }
    setCart([]);
  };

  const scrollToProducts = () => {
    setPage({ name: 'home' });
    requestAnimationFrame(() =>
      document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })
    );
  };

  const goHome = () => {
    setPage({ name: 'home' });
    window.scrollTo({ top: 0 });
  };

  return (
    <>
      <Header
        cartCount={cart.length}
        onCart={() => setCartOpen(true)}
        onSearch={() => setSearchOpen((o) => !o)}
        onLogin={() => setLoginOpen(true)}
        onLogout={handleLogout}
        user={user}
        onHelp={() => setChatOpen(true)}
        onDashboard={() => {
          setPage({ name: 'dashboard' });
          window.scrollTo({ top: 0 });
        }}
        onShopMen={scrollToProducts}
        onShopWomen={scrollToProducts}
        onHome={goHome}
      />

      <SearchPanel
        open={searchOpen}
        products={products}
        onClose={() => setSearchOpen(false)}
        onSelect={(p) => {
          setSearchOpen(false);
          setQuickAdd(p);
        }}
        onSubmit={(q) => {
          setSearchOpen(false);
          setPage({ name: 'search', query: q });
          window.scrollTo({ top: 0 });
        }}
      />

      {page.name === 'dashboard' ? (
        <Dashboard user={user} onBack={goHome} />
      ) : page.name === 'search' ? (
        <SearchResults
          query={page.query}
          products={products}
          onQuickAdd={setQuickAdd}
          onBack={goHome}
        />
      ) : (
        <>
          <Hero onPreOrder={scrollToProducts} />

          <section id="products">
            <ProductCarousel products={products} onQuickAdd={setQuickAdd} />
          </section>

          <XLowsSection onShop={scrollToProducts} />
          <SplitTiles onShop={scrollToProducts} />
          <Testimonials />
          <PressBar />
        </>
      )}
      {page.name !== 'dashboard' && <Footer />}

      {cartOpen && (
        <CartDrawer
          items={cart}
          onClose={() => setCartOpen(false)}
          onRemove={removeFromCart}
          onCheckout={checkout}
          user={user}
          onLogin={() => {
            setCartOpen(false);
            setLoginOpen(true);
          }}
        />
      )}

      {loginOpen && (
        <LoginModal
          onClose={() => setLoginOpen(false)}
          onSuccess={handleLogin}
        />
      )}

      {quickAdd && (
        <QuickAddModal
          product={quickAdd}
          onClose={() => setQuickAdd(null)}
          onAdd={addToCart}
        />
      )}

      <HelpChat
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        user={user}
        onLogin={() => setLoginOpen(true)}
      />

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
