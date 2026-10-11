import { useState } from 'react';

const REVIEWS = [
  {
    quote: '“Craziest shoes out there”',
    text: "As a DJ, the colour orange is a big part of my brand, so I knew I had to get these. I really vibe with design and fit.",
    name: 'Karan',
    img: '/images/review-1.jpg',
  },
  {
    quote: '“They’re so pretty!”',
    text: "Love the colour, especially the white detailing. They're so comfy and I can't wait to get my hands on more.",
    name: 'Neha',
    img: '/images/review-2.jpg',
  },
  {
    quote: '“Whole crew in Comets”',
    text: 'Took my Comets to Vietnam and wore them for the entire trip! They went with all my vacay fits and were so comfortable to walk in.',
    name: 'Siddhi',
    img: '/images/review-3.jpg',
  },
  {
    quote: '“They look so cute!”',
    text: "Received these as a gift and I absolutely love them. They're so lightweight, and I love the neutral tones because they're super easy to style.",
    name: 'Hannah',
    img: '/images/review-4.jpg',
  },
  {
    quote: '“Comfy, stylish & such a fun pair!”',
    text: "I've been loving my Comets! They're super comfortable, easy to style, and the colours add such a fun pop to any outfit.",
    name: 'Rishi',
    img: '/images/review-5.jpg',
  },
];

export default function Testimonials() {
  const [index, setIndex] = useState(0);
  const review = REVIEWS[index];

  return (
    <section className="testimonials">
      <h2 className="section-title">WHAT’RE THEY SAYING?</h2>
      <div className="testimonial-viewport">
        <button
          className="testimonial-arrow prev"
          onClick={() => setIndex((index - 1 + REVIEWS.length) % REVIEWS.length)}
          aria-label="Previous review"
        >
          ‹
        </button>
        <div className="testimonial-card">
          <img src={review.img} alt={review.name} />
          <div className="testimonial-quote">{review.quote}</div>
          <p className="testimonial-text">{review.text}</p>
          <div className="testimonial-name">{review.name}</div>
          <div className="testimonial-verified">Verified reviewer</div>
        </div>
        <button
          className="testimonial-arrow next"
          onClick={() => setIndex((index + 1) % REVIEWS.length)}
          aria-label="Next review"
        >
          ›
        </button>
      </div>
      <div className="testimonial-dots">
        {REVIEWS.map((_, i) => (
          <button
            key={i}
            className={i === index ? 'active' : ''}
            onClick={() => setIndex(i)}
            aria-label={`Go to review ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
