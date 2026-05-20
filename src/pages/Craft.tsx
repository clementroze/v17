import { useState, useRef } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Hero from '../components/Hero';
import { Reveal } from '../lib/reveal';
import CraftLightbox from '../components/CraftLightbox';
import { COL_A, COL_B, COL_C, CRAFT_ITEMS, type CraftItem } from '../data/craft';

// ── card ──────────────────────────────────────────────────────────────────────

function CraftCard({
  item,
  delay,
  onOpen,
  onAspectResolved,
  aspect,
}: {
  item: CraftItem;
  delay: number;
  onOpen: (id: string, el: HTMLElement) => void;
  onAspectResolved: (id: string, aspect: number) => void;
  aspect: number;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  return (
    <Reveal delay={delay}>
      <button
        ref={ref}
        type="button"
        className="craft-card"
        style={{ aspectRatio: String(aspect) }}
        onClick={() => {
          if (ref.current) onOpen(item.id, ref.current);
        }}
        aria-label={`Open ${item.label}`}
      >
        {item.src && (
          <img
            src={item.src}
            alt={item.alt ?? ''}
            className="craft-card__img"
            onLoad={(e) => {
              const img = e.currentTarget;
              if (img.naturalWidth && img.naturalHeight) {
                onAspectResolved(item.id, img.naturalWidth / img.naturalHeight);
              }
            }}
          />
        )}
      </button>
    </Reveal>
  );
}

// ── column ────────────────────────────────────────────────────────────────────

function CraftCol({
  items,
  baseDelay,
  onOpen,
  onAspectResolved,
  aspectMap,
}: {
  items: CraftItem[];
  baseDelay: number;
  onOpen: (id: string, el: HTMLElement) => void;
  onAspectResolved: (id: string, aspect: number) => void;
  aspectMap: Record<string, number>;
}) {
  return (
    <div className="craft-col">
      {items.map((item, i) => (
        <CraftCard
          key={item.id}
          item={item}
          delay={baseDelay + i * 60}
          onOpen={onOpen}
          onAspectResolved={onAspectResolved}
          aspect={aspectMap[item.id] ?? item.aspect}
        />
      ))}
    </div>
  );
}

// ── page ──────────────────────────────────────────────────────────────────────

export default function Craft() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const originElRef = useRef<HTMLElement | null>(null);
  // Real image aspects (width / height), populated as <img> elements load.
  // Source-card aspect AND lightbox aspect both derive from this — same value
  // → no shape change between grid and lightbox.
  const [aspectMap, setAspectMap] = useState<Record<string, number>>({});

  const handleAspectResolved = (id: string, aspect: number) => {
    setAspectMap((m) => (m[id] === aspect ? m : { ...m, [id]: aspect }));
  };

  const openById = (id: string, el: HTMLElement) => {
    const idx = CRAFT_ITEMS.findIndex((i) => i.id === id);
    if (idx >= 0) {
      originElRef.current = el;
      setActiveIndex(idx);
    }
  };

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
            <CraftCol
              items={COL_A}
              baseDelay={0}
              onOpen={openById}
              onAspectResolved={handleAspectResolved}
              aspectMap={aspectMap}
            />
            <CraftCol
              items={COL_B}
              baseDelay={80}
              onOpen={openById}
              onAspectResolved={handleAspectResolved}
              aspectMap={aspectMap}
            />
            <CraftCol
              items={COL_C}
              baseDelay={160}
              onOpen={openById}
              onAspectResolved={handleAspectResolved}
              aspectMap={aspectMap}
            />
          </div>
        </div>
      </div>

      <Footer />

      {activeIndex !== null && (
        <CraftLightbox
          items={CRAFT_ITEMS}
          index={activeIndex}
          getOriginEl={() => originElRef.current}
          onIndexChange={(i) => setActiveIndex(i)}
          onClose={() => {
            setActiveIndex(null);
            originElRef.current = null;
          }}
        />
      )}
    </div>
  );
}
