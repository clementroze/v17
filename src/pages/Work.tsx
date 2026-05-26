import { useState, useRef, useEffect, useCallback, Fragment } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Hero from "../components/Hero";
import Hourglass from "../components/Hourglass";
import arrowBlack from "../assets/arrow-black.svg";
import { Reveal } from "../lib/reveal";
import { Link } from "../lib/router";

import work, { WorkItem } from "../data/work";

const WORK_ITEMS = work;

// ─── grid item ────────────────────────────────────────────────────────────────

// Width of a single grid column at the max layout (1400px container, 4 equal
// cells, three 24px gaps): (1400 - 3*24) / 4 = 332px. The `images` numbers are
// authored as the column's HEIGHT at this width, so we turn each into an
// aspect-ratio (332 : h). The image then keeps those proportions and scales
// fluidly as the column flexes narrower below 1400px — the raw px value only
// pins the shape, not a fixed size.
const GRID_COL_WIDTH = 332;

function GridItem({ item, index }: { item: WorkItem; index: number }) {
  const picCols = item.images.map((h, i) => (
    <div
      key={i}
      className="work-grid__pic"
      style={{ aspectRatio: `${GRID_COL_WIDTH} / ${h}` }}
    >
      {item.imageUrls[i] && <img src={item.imageUrls[i]} alt="" />}
    </div>
  ));

  // The text column is the whole clickable surface (or a non-interactive div
  // when the case study isn't live yet). The name/subtitle stay as a heading +
  // paragraph; the old CTA button becomes an inline label + arrow that animate
  // on hover. An aria-label on the link names the destination so screen-reader
  // users get the project name, not just "See more".
  const inner = (
    <>
      <div className="work-grid__text-top">
        <h2 className="work-grid__name">{item.name}</h2>
        <p className="work-grid__role">{item.subtitle}</p>
      </div>
      <span className="work-grid__cta">
        <span className="work-grid__cta-label">
          {item.comingSoon ? "Coming soon" : "See more"}
        </span>
        {item.comingSoon ? (
          <Hourglass className="work-grid__cta-hourglass" />
        ) : (
          <img src={arrowBlack} alt="" className="work-grid__cta-arrow" />
        )}
      </span>
    </>
  );

  const textCol = item.comingSoon ? (
    <div
      className="work-grid__text work-grid__text--disabled"
      style={{ "--accent": item.accent } as React.CSSProperties}
    >
      {inner}
    </div>
  ) : (
    <Link
      href={item.href}
      className="work-grid__text"
      aria-label={`See more: ${item.name}`}
      style={{ "--accent": item.accent } as React.CSSProperties}
    >
      {inner}
    </Link>
  );

  // Where the text column sits among the images. Prefer the per-item
  // `textPosition`; otherwise fall back to the original rotating default
  // (0, 2, 3, 0, then repeating) keyed off the row index.
  const DEFAULT_POSITIONS = [0, 2, 3, 0];
  const rawPos =
    item.textPosition ?? DEFAULT_POSITIONS[index % DEFAULT_POSITIONS.length];
  const textPos = Math.max(0, Math.min(picCols.length, rawPos));

  const cells = [...picCols];
  cells.splice(textPos, 0, textCol);

  return (
    <Reveal delay={index * 60}>
      <div className="work-grid__row">
        {cells.map((cell, i) => (
          <Fragment key={i}>{cell}</Fragment>
        ))}
      </div>
    </Reveal>
  );
}

// ─── list view with floating preview ─────────────────────────────────────────

function WorkList({
  items,
  dividerRef,
}: {
  items: WorkItem[];
  dividerRef: React.RefObject<HTMLDivElement>;
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: 0, y: 0 });
  const target = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number>(0);
  const activeItem = hoveredIndex !== null ? items[hoveredIndex] : null;
  // The item whose background is painted. It lags `activeItem` on the way out:
  // when the cursor leaves, `activeItem` goes null (opacity fades to 0) but the
  // background stays so the preview fades out showing its image, not an empty
  // box. Only cleared once hidden — switching between items updates it at once.
  const [displayItem, setDisplayItem] = useState<WorkItem | null>(null);
  useEffect(() => {
    if (activeItem) setDisplayItem(activeItem);
  }, [activeItem]);

  const animate = useCallback(() => {
    const LERP = 0.1;
    pos.current.x += (target.current.x - pos.current.x) * LERP;
    pos.current.y += (target.current.y - pos.current.y) * LERP;
    if (previewRef.current) {
      previewRef.current.style.transform = `translate(${pos.current.x}px, ${pos.current.y}px)`;
    }
    rafRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [animate]);

  // Clamp X to the center column (between 25% and 75% of the list width) so the
  // preview never drifts far enough to cover an item's name on either side.
  const clampToCenter = (clientX: number, clientY: number) => {
    const list = listRef.current;
    if (!list) return { x: clientX, y: clientY };
    const rect = list.getBoundingClientRect();
    const minX = rect.left + rect.width * 0.25;
    const maxX = rect.right - rect.width * 0.25;
    return { x: Math.min(maxX, Math.max(minX, clientX)), y: clientY };
  };

  const onMouseMove = (e: React.MouseEvent) => {
    target.current = clampToCenter(e.clientX, e.clientY);
  };

  const handleEnter = (i: number, e: React.MouseEvent) => {
    // Seed the target from the entry event and snap the spring to it, so the
    // preview fades in under the pointer instead of travelling from a stale
    // position (e.g. the top-left origin right after load).
    const point = clampToCenter(e.clientX, e.clientY);
    target.current = point;
    pos.current = { ...point };
    setHoveredIndex(i);
    if (i === 0 && dividerRef.current) {
      dividerRef.current.style.setProperty("--divider-color", items[0].accent);
    }
  };

  const handleLeave = () => {
    setHoveredIndex(null);
    if (dividerRef.current) {
      dividerRef.current.style.removeProperty("--divider-color");
    }
  };

  return (
    <div ref={listRef} className="work-list" onMouseMove={onMouseMove}>
      <div className="work-list__items">
        {items.map((item, i) => {
          const itemClass = [
            "work-list__item",
            i === 0 ? "work-list__item--first" : "",
            item.comingSoon ? "work-list__item--disabled" : "",
          ]
            .filter(Boolean)
            .join(" ");

          const inner = (
            <>
              <span className="work-list__name">{item.name}</span>
              <span className="work-list__role">{item.role}</span>
              <div className="work-list__right">
                {item.comingSoon ? (
                  <span className="work-list__coming-soon">Coming soon</span>
                ) : (
                  <img src={arrowBlack} alt="" className="work-list__arrow" />
                )}
              </div>
            </>
          );

          return (
            <Reveal key={item.name} delay={i * 50}>
              {item.comingSoon ? (
                <div
                  className={itemClass}
                  style={{ "--accent": item.accent } as React.CSSProperties}
                  onMouseEnter={(e) => handleEnter(i, e)}
                  onMouseLeave={handleLeave}
                >
                  {inner}
                </div>
              ) : (
                <Link
                  href={item.href}
                  className={itemClass}
                  style={{ "--accent": item.accent } as React.CSSProperties}
                  onMouseEnter={(e) => handleEnter(i, e)}
                  onMouseLeave={handleLeave}
                >
                  {inner}
                </Link>
              )}
            </Reveal>
          );
        })}
      </div>

      {/* Floating preview — fixed to viewport, follows cursor with spring */}
      <div
        ref={previewRef}
        className={`work-list__preview${activeItem ? " work-list__preview--visible" : ""}`}
        style={
          displayItem
            ? {
                backgroundColor: displayItem.accent,
                backgroundImage: displayItem.previewSrc
                  ? `url(${displayItem.previewSrc})`
                  : "none",
              }
            : {}
        }
      />
    </div>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function Work() {
  const [view, setView] = useState<"grid" | "list">(() => {
    try {
      return (localStorage.getItem("work-view") as "grid" | "list") || "grid";
    } catch {
      return "grid";
    }
  });
  const dividerRef = useRef<HTMLDivElement>(null);
  const gridBtnRef = useRef<HTMLButtonElement>(null);
  const listBtnRef = useRef<HTMLButtonElement>(null);

  const setViewPersisted = (v: "grid" | "list", moveFocus = false) => {
    setView(v);
    try {
      localStorage.setItem("work-view", v);
    } catch {}
    if (moveFocus) {
      // defer so tabIndex update has applied before we call focus()
      requestAnimationFrame(() => {
        (v === "grid" ? gridBtnRef : listBtnRef).current?.focus();
      });
    }
  };

  return (
    <div className="page">
      <Navbar activeLink="work" />

      <Hero
        title="Work"
        subtitle="A closer look at the projects, decisions, and details behind my work."
      />

      {/* Main */}
      <div className="container-wrapper">
        <div className="container">
          <div className="work-main">
            {/* Header row */}
            <div className="work-main__header">
              <span className="work-main__label">Selected work</span>
              <div
                className="work-main__toggle"
                role="radiogroup"
                aria-label="View"
                onKeyDown={(e) => {
                  if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                    e.preventDefault();
                    setViewPersisted("grid", true);
                  }
                  if (e.key === "ArrowRight" || e.key === "ArrowDown") {
                    e.preventDefault();
                    setViewPersisted("list", true);
                  }
                }}
              >
                <button
                  ref={gridBtnRef}
                  role="radio"
                  aria-checked={view === "grid"}
                  tabIndex={view === "grid" ? 0 : -1}
                  className={`work-main__toggle-btn work-main__toggle-btn--grid${view === "grid" ? " work-main__toggle-btn--active" : ""}`}
                  onClick={() => setViewPersisted("grid")}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    aria-hidden="true"
                  >
                    <rect
                      x="0"
                      y="0"
                      width="6"
                      height="6"
                      rx="1"
                      fill="currentColor"
                    />
                    <rect
                      x="8"
                      y="0"
                      width="6"
                      height="6"
                      rx="1"
                      fill="currentColor"
                    />
                    <rect
                      x="0"
                      y="8"
                      width="6"
                      height="6"
                      rx="1"
                      fill="currentColor"
                    />
                    <rect
                      x="8"
                      y="8"
                      width="6"
                      height="6"
                      rx="1"
                      fill="currentColor"
                    />
                  </svg>
                  Grid
                </button>
                <button
                  ref={listBtnRef}
                  role="radio"
                  aria-checked={view === "list"}
                  tabIndex={view === "list" ? 0 : -1}
                  className={`work-main__toggle-btn work-main__toggle-btn--list${view === "list" ? " work-main__toggle-btn--active" : ""}`}
                  onClick={() => setViewPersisted("list")}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    aria-hidden="true"
                  >
                    <rect
                      x="0"
                      y="1"
                      width="14"
                      height="2"
                      rx="1"
                      fill="currentColor"
                    />
                    <rect
                      x="0"
                      y="6"
                      width="14"
                      height="2"
                      rx="1"
                      fill="currentColor"
                    />
                    <rect
                      x="0"
                      y="11"
                      width="14"
                      height="2"
                      rx="1"
                      fill="currentColor"
                    />
                  </svg>
                  List
                </button>
              </div>
            </div>
            <div ref={dividerRef} className="work-main__divider" />

            {/* Grid view */}
            {view === "grid" && (
              <div className="work-grid">
                {WORK_ITEMS.map((item, i) => (
                  <GridItem key={item.name} item={item} index={i} />
                ))}
              </div>
            )}

            {/* List view */}
            {view === "list" && (
              <WorkList items={WORK_ITEMS} dividerRef={dividerRef} />
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
