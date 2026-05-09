import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Hero from '../components/Hero';
import { Reveal } from '../lib/reveal';

// ── types ─────────────────────────────────────────────────────────────────────

type CraftItem = {
  src?: string;
  alt?: string;
  height: number; // unitless px value — sets the card's intrinsic height
};

// ── data: three columns, each with their own list of cards ───────────────────
// Heights match Figma exactly. Swap `src` for real image paths when ready.

const COL_A: CraftItem[] = [
  { height: 244 },
  { height: 465 },
  { height: 358 },
  { height: 773 },
  { height: 243 },
];

const COL_B: CraftItem[] = [
  { height: 382 },
  { height: 465 },
  { height: 349 },
  { height: 349 },
  { height: 349 },
];

const COL_C: CraftItem[] = [
  { height: 560 },
  { height: 465 },
  { height: 304 },
  { height: 304 },
];

// ── card ──────────────────────────────────────────────────────────────────────

function CraftCard({ item, delay }: { item: CraftItem; delay: number }) {
  return (
    <Reveal delay={delay}>
      <div className="craft-card" style={{ height: item.height }}>
        {item.src && <img src={item.src} alt={item.alt ?? ''} className="craft-card__img" />}
      </div>
    </Reveal>
  );
}

// ── column ────────────────────────────────────────────────────────────────────

function CraftCol({ items, baseDelay }: { items: CraftItem[]; baseDelay: number }) {
  return (
    <div className="craft-col">
      {items.map((item, i) => (
        <CraftCard key={i} item={item} delay={baseDelay + i * 60} />
      ))}
    </div>
  );
}

// ── page ──────────────────────────────────────────────────────────────────────

export default function Craft() {
  return (
    <div className="page page--craft">
      <Navbar activeLink="craft" />

      <Hero
        title="Craft"
        subtitle="A collection of side projects, explorations, and small details."
      />

      {/* Masonry grid */}
      <div className="container-wrapper">
        <div className="container">
          <div className="craft-grid">
            <CraftCol items={COL_A} baseDelay={0} />
            <CraftCol items={COL_B} baseDelay={80} />
            <CraftCol items={COL_C} baseDelay={160} />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
