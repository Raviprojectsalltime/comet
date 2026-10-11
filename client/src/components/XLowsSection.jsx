export default function XLowsSection({ onShop }) {
  return (
    <section className="xlows">
      <img className="bg" src="/images/xlows.jpg" alt="X Lows – Always in Rotation" />
      <div className="xlows-content">
        <p className="kicker">Always in Rotation</p>
        <h2>X LOWS</h2>
        <div className="xlows-btns">
          <button className="btn-yellow" onClick={onShop}>SHOP MEN</button>
          <button className="btn-yellow" onClick={onShop}>SHOP WOMEN</button>
        </div>
      </div>
    </section>
  );
}
