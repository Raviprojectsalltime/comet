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

  useEffect(() => {
    fetch('/api/products')
      .then((r) => r.json())
      .then(setProducts)
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
        onHelp={() => setChatOpen(true)}
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

      {page.name === 'search' ? (
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
      <Footer />

      {cartOpen && (
        <CartDrawer
          items={cart}
          onClose={() => setCartOpen(false)}
          onRemove={removeFromCart}
          onCheckout={() => showToast('Checkout is coming soon!')}
        />
      )}

      {loginOpen && (
        <LoginModal
          onClose={() => setLoginOpen(false)}
          onSubmit={() => {
            setLoginOpen(false);
            showToast('OTP sent! Login is coming soon.');
          }}
        />
      )}

      {quickAdd && (
        <QuickAddModal
          product={quickAdd}
          onClose={() => setQuickAdd(null)}
          onAdd={addToCart}
        />
      )}

      <HelpChat open={chatOpen} onClose={() => setChatOpen(false)} />

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
