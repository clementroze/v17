import { useState, useRef, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Hero from '../components/Hero';
import { Reveal } from '../lib/reveal';
import CraftLightbox from '../components/CraftLightbox';
import { CRAFT_ITEMS, distributeIntoColumns, type CraftItem } from '../data/craft';

// Responsive column count. The single ordered CRAFT_ITEMS list is dealt out
// across this many columns (round-robin), so the layout — and the order — adapts
// to screen size while staying in sync with the lightbox. One column on mobile
// means the grid reads in the exact CRAFT_ITEMS order.
function getColumnCount(width: number): number {
  if (width <= 480) return 1;
  if (width <= 900) return 2;
  return 3;
}

function useColumnCount(): number {
  const [count, setCount] = useState(() =>
    getColumnCount(typeof window === 'undefined' ? 1200 : window.innerWidth),
  );
  useEffect(() => {
    const onResize = () => setCount(getColumnCount(window.innerWidth));
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return count;
}

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
  const isVideo = item.src ? /\.(mp4|mov|webm|ogg)$/i.test(item.src) : false;
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
          isVideo ? (
            <video
              src={item.src}
              className="craft-card__img"
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              onLoadedMetadata={(e) => {
                const v = e.currentTarget;
                if (v.videoWidth && v.videoHeight) {
                  onAspectResolved(item.id, v.videoWidth / v.videoHeight);
                }
              }}
            />
          ) : (
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
          )
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
          aspect={aspectMap[item.id] ?? item.aspect ?? 1}
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

  const columnCount = useColumnCount();
  const columns = distributeIntoColumns(CRAFT_ITEMS, columnCount);

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

      {/* Masonry grid — columns derived from the single ordered CRAFT_ITEMS list */}
      <div className="container-wrapper">
        <div className="container">
          <div className="craft-grid">
            {columns.map((items, col) => (
              <CraftCol
                key={col}
                items={items}
                baseDelay={col * 80}
                onOpen={openById}
                onAspectResolved={handleAspectResolved}
                aspectMap={aspectMap}
              />
            ))}
          </div>
        </div>
      </div>

      <Footer />

      {activeIndex !== null && (
        <CraftLightbox
          items={CRAFT_ITEMS}
          index={activeIndex}
          aspectMap={aspectMap}
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
