import { useState, useRef, useEffect } from "react";
import { trackEvent, incrementCraftView } from "../lib/analytics";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Hero from "../components/Hero";
import { Reveal } from "../lib/reveal";
import CraftLightbox from "../components/CraftLightbox";
import Picture from "../components/Picture";
import { CRAFT_ITEMS, distributeIntoColumns, type CraftItem } from "../data/craft";

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
  const [count, setCount] = useState(() => getColumnCount(typeof window === "undefined" ? 1200 : window.innerWidth));
  useEffect(() => {
    const onResize = () => setCount(getColumnCount(window.innerWidth));
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
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
  registerEl,
}: {
  item: CraftItem;
  delay: number;
  onOpen: (id: string) => void;
  onAspectResolved: (id: string, aspect: number) => void;
  aspect: number;
  registerEl: (id: string, el: HTMLElement | null) => void;
}) {
  const isVideo = item.src ? /\.(mp4|mov|webm|ogg)$/i.test(item.src) : false;
  return (
    <Reveal delay={delay} scrollAware>
      <button
        ref={(el) => registerEl(item.id, el)}
        type="button"
        className="craft-card"
        style={{ aspectRatio: String(aspect) }}
        onClick={() => onOpen(item.id)}
        aria-label={`Open ${item.label}`}
      >
        {item.src &&
          (isVideo ? (
            <video
              src={item.src}
              className="craft-card__img"
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              aria-label={item.alt ?? item.label}
              onLoadedMetadata={(e) => {
                const v = e.currentTarget;
                if (v.videoWidth && v.videoHeight) {
                  onAspectResolved(item.id, v.videoWidth / v.videoHeight);
                }
              }}
            />
          ) : (
            <Picture
              src={item.src}
              alt={item.alt ?? item.label}
              className="craft-card__img"
              onLoad={(e) => {
                const img = e.currentTarget;
                if (img.naturalWidth && img.naturalHeight) {
                  onAspectResolved(item.id, img.naturalWidth / img.naturalHeight);
                }
              }}
            />
          ))}
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
  registerEl,
}: {
  items: CraftItem[];
  baseDelay: number;
  onOpen: (id: string) => void;
  onAspectResolved: (id: string, aspect: number) => void;
  aspectMap: Record<string, number>;
  registerEl: (id: string, el: HTMLElement | null) => void;
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
          registerEl={registerEl}
        />
      ))}
    </div>
  );
}

// ── page ──────────────────────────────────────────────────────────────────────

export default function Craft() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  // Source card elements keyed by item id, registered as cards mount. The
  // lightbox morphs to/from the card for whatever index is CURRENTLY shown, so
  // closing after prev/next navigation lands on the right card (getOriginEl).
  const cardElsRef = useRef<Record<string, HTMLElement | null>>({});
  // Real image aspects (width / height), populated as <img> elements load.
  // Source-card aspect AND lightbox aspect both derive from this — same value
  // → no shape change between grid and lightbox.
  const [aspectMap, setAspectMap] = useState<Record<string, number>>({});

  const columnCount = useColumnCount();
  const columns = distributeIntoColumns(CRAFT_ITEMS, columnCount);

  const handleAspectResolved = (id: string, aspect: number) => {
    setAspectMap((m) => (m[id] === aspect ? m : { ...m, [id]: aspect }));
  };

  const registerCardEl = (id: string, el: HTMLElement | null) => {
    cardElsRef.current[id] = el;
  };

  const openById = (id: string) => {
    const idx = CRAFT_ITEMS.findIndex((i) => i.id === id);
    if (idx >= 0) {
      const item = CRAFT_ITEMS[idx];
      trackEvent("lightbox-open", { id: item.id, label: item.label });
      incrementCraftView(item.id);
      setActiveIndex(idx);
    }
  };

  return (
    <div className="page page--craft">
      <Navbar activeLink="craft" />

      <main id="main-content" className="page__main">
      <Hero title="Craft" subtitle="A collection of side projects, explorations, and small details." />

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
                registerEl={registerCardEl}
              />
            ))}
          </div>
        </div>
      </div>

      </main>
      <Footer />

      {activeIndex !== null && (
        <CraftLightbox
          items={CRAFT_ITEMS}
          index={activeIndex}
          aspectMap={aspectMap}
          getOriginEl={(i) => {
            const id = CRAFT_ITEMS[i]?.id;
            return id ? (cardElsRef.current[id] ?? null) : null;
          }}
          onIndexChange={(i) => setActiveIndex(i)}
          onClose={() => setActiveIndex(null)}
        />
      )}
    </div>
  );
}
