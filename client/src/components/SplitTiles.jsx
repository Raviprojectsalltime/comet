const TILES = [
  { label: 'X LOWS', img: '/images/split-xlows.jpg' },
  { label: 'AERES', img: '/images/split-aeres.jpg' },
  { label: 'AEON', img: '/images/split-aeon.jpg' },
  { label: 'ASTRA', img: '/images/split-astra.jpg' },
];

export default function SplitTiles({ onShop }) {
  return (
    <section className="tiles-grid">
      {TILES.map((t) => (
        <div className="tile" key={t.label} onClick={onShop}>
          <img src={t.img} alt={t.label} />
          <span className="tile-label">{t.label}</span>
          <button
            className="btn-tile"
            onClick={(e) => {
              e.stopPropagation();
              onShop();
            }}
          >
            SHOP NOW
          </button>
        </div>
      ))}
    </section>
  );
}
