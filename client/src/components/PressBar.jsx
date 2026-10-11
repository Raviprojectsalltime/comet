const LOGOS = [
  { src: '/images/vogue.png', alt: 'Vogue' },
  { src: '/images/gq.png', alt: 'GQ' },
  { src: '/images/cosmopolitan.png', alt: 'Cosmopolitan' },
  { src: '/images/elle.png', alt: 'Elle' },
  { src: '/images/rollingstone.png', alt: 'Rolling Stone' },
];

export default function PressBar() {
  return (
    <section className="press">
      <h2 className="section-title">AS APPRECIATED ON</h2>
      <div className="press-logos">
        {LOGOS.map((l) => (
          <img key={l.alt} src={l.src} alt={l.alt} />
        ))}
      </div>
    </section>
  );
}
