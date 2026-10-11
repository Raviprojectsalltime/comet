export default function Hero({ onPreOrder }) {
  return (
    <section className="hero">
      <img src="/images/hero.jpg" alt="Hukum – Final batch coming soon" />
      <button
        className="btn-hero"
        onClick={onPreOrder}
        aria-label="Pre-order Hukum now"
      />
    </section>
  );
}
