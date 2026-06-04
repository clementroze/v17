import { useState, useRef, useEffect, useCallback } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Hero from "../components/Hero";
import Hourglass from "../components/Hourglass";
import arrowBlack from "../assets/arrow-black.svg";
import { Reveal, useReveal } from "../lib/reveal";
import { Link } from "../lib/router";
import Picture, { bgImageSet } from "../components/Picture";

import work, { WorkItem } from "../data/work";

const WORK_ITEMS = work;

// Hardcoded craft thumbnails for the "See more work" row on the grid view.
// Picked from /public/craft to feel like a sampler — must exist in that dir.
const SEE_MORE_GRID_IMAGES = ["/craft/ebb-insights.png", "/craft/iwater-pair.png", "/craft/souvenir-buttons.png"];

// Floating preview for the "See more work" list row. Drop a square-ish image
// at /public/images/see-more-preview.png (any aspect works, the preview slot
// crops to fill).
const SEE_MORE_LIST_PREVIEW = "/images/see-more-preview.png";

// ─── grid item ────────────────────────────────────────────────────────────────

// Width of a single grid column at the max layout (1400px container, 4 equal
// cells, three 24px gaps): (1400 - 3*24) / 4 = 332px. The `images` numbers are
// authored as the column's HEIGHT at this width, so we turn each into an
// aspect-ratio (332 : h). The image then keeps those proportions and scales
// fluidly as the column flexes narrower below 1400px — the raw px value only
// pins the shape, not a fixed size.
const GRID_COL_WIDTH = 332;

// Stash the current scroll position before leaving for a case study, so that
// returning to /work (via the case study's "Back" link) restores it. Read back
// in the Work page's mount effect. Mirrors the About page's restoration.
function saveWorkScroll() {
  sessionStorage.setItem("work_scroll", String(window.scrollY));
}

// A single image cell. Carries its own reveal so the row's cells animate in
// independently instead of as one block.
// `lead` marks the first pic of a row: on the mobile carousel it's the one that
// rests inset by the left page padding (see .work-grid__pic--lead in the CSS).
function GridPic({ src, h, delay, lead = false }: { src?: string; h: number; delay: number; lead?: boolean }) {
  // threshold 0 so the mobile carousel's peeking next pic reveals at rest (any
  // visible sliver triggers it); fully off-screen slides still wait for scroll.
  const ref = useReveal<HTMLDivElement>(delay, 0);
  return (
    <div
      ref={ref}
      className={`work-grid__pic${lead ? " work-grid__pic--lead" : ""} reveal`}
      style={{ aspectRatio: `${GRID_COL_WIDTH} / ${h}` }}
    >
      {src && <Picture src={src} alt="" />}
    </div>
  );
}

// The text column: the whole clickable surface (or a non-interactive div when
// the case study isn't live yet). The name/subtitle stay as a heading +
// paragraph; the old CTA button becomes an inline label + arrow that animate on
// hover. The link's aria-label mirrors the visible reading order — name, then
// the role/subtitle, then the "See more" action — so screen-reader users hear
// the subtitle (which the label would otherwise suppress) before the CTA. Like
// GridPic it owns its own reveal so it animates independently of the images.
function GridText({ item, delay }: { item: WorkItem; delay: number }) {
  const ref = useReveal<HTMLElement>(delay);
  const inner = (
    <>
      <div className="work-grid__text-top">
        <h2 className="work-grid__name">{item.name}</h2>
        <p className="work-grid__role">{item.subtitle}</p>
      </div>
      <span className="work-grid__cta">
        <span className="work-grid__cta-label">{item.comingSoon ? "Coming soon" : "See more"}</span>
        {item.comingSoon ? (
          <Hourglass className="work-grid__cta-hourglass" />
        ) : (
          <img src={arrowBlack} alt="" className="work-grid__cta-arrow" />
        )}
      </span>
    </>
  );

  if (item.comingSoon) {
    return (
      <div
        ref={ref as React.Ref<HTMLDivElement>}
        className="work-grid__text work-grid__text--disabled reveal"
        style={{ "--accent": item.accent } as React.CSSProperties}
      >
        {inner}
      </div>
    );
  }
  return (
    <Link
      ref={ref as React.Ref<HTMLAnchorElement>}
      href={item.href}
      className="work-grid__text reveal"
      aria-label={`${item.name}. ${item.subtitle}. See more`}
      style={{ "--accent": item.accent } as React.CSSProperties}
      onClick={saveWorkScroll}
    >
      {inner}
    </Link>
  );
}

function GridItem({ item, index }: { item: WorkItem; index: number }) {
  // Build the row as descriptors first, splice the text column into place, then
  // render — so each cell knows its final position (for the reveal direction and
  // stagger) regardless of where the text lands among the images.
  type Cell = { kind: "pic"; src?: string; h: number; lead: boolean } | { kind: "text" };
  const cells: Cell[] = item.images.map((h, i) => ({ kind: "pic", h, src: item.imageUrls[i], lead: i === 0 }));

  // Where the text column sits among the images. Prefer the per-item
  // `textPosition`; otherwise fall back to the original rotating default
  // (0, 2, 3, 0, then repeating) keyed off the row index.
  const DEFAULT_POSITIONS = [0, 2, 3, 0];
  const rawPos = item.textPosition ?? DEFAULT_POSITIONS[index % DEFAULT_POSITIONS.length];
  const textPos = Math.max(0, Math.min(item.images.length, rawPos));
  cells.splice(textPos, 0, { kind: "text" });

  return (
    <div className="work-grid__row">
      {cells.map((cell, i) => {
        const delay = index * 60 + i * 70;
        return cell.kind === "pic" ? (
          <GridPic key={i} src={cell.src} h={cell.h} delay={delay} lead={cell.lead} />
        ) : (
          <GridText key={i} item={item} delay={delay} />
        );
      })}
    </div>
  );
}

// Standalone row at the bottom of the grid that points to /craft. Mirrors
// GridItem layout (3 pics + 1 text col) so it visually rhymes with the
// project rows; copy + accent are unique to mark it as a different kind of
// link (a category, not a project).
// The "See more" text column, with its own reveal so it animates in separately
// from the sampler images beside it (same pattern as GridText).
function SeeMoreText({ delay }: { delay: number }) {
  const ref = useReveal<HTMLAnchorElement>(delay);
  return (
    <Link
      ref={ref}
      href="/craft"
      className="work-grid__text reveal"
      aria-label="See more of my craft and explorations"
      style={{ "--accent": "#000000" } as React.CSSProperties}
    >
      <div className="work-grid__text-top">
        <h2 className="work-grid__name">More</h2>
        <p className="work-grid__role">A wider sample of UI and side work.</p>
      </div>
      <span className="work-grid__cta">
        <span className="work-grid__cta-label">See more</span>
        <img src={arrowBlack} alt="" className="work-grid__cta-arrow" />
      </span>
    </Link>
  );
}

function SeeMoreGridRow({ index }: { index: number }) {
  const textIndex = SEE_MORE_GRID_IMAGES.length;
  return (
    <div className="work-grid__row">
      {SEE_MORE_GRID_IMAGES.map((src, i) => (
        <GridPic key={i} src={src} h={332} delay={index * 60 + i * 70} lead={i === 0} />
      ))}
      <SeeMoreText delay={index * 60 + textIndex * 70} />
    </div>
  );
}

// ─── list view with floating preview ─────────────────────────────────────────

// Minimal shape the floating preview needs — works for both real WorkItems
// and the synthetic "see more" row.
type PreviewSource = {
  accent: string;
  previewSrc?: string;
};

function WorkList({ items, dividerRef }: { items: WorkItem[]; dividerRef: React.RefObject<HTMLDivElement> }) {
  // `hoveredIndex` is the index into `items`, or "see-more" for the trailing
  // craft row, or null when nothing is hovered.
  const [hoveredIndex, setHoveredIndex] = useState<number | "see-more" | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: 0, y: 0 });
  const target = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number>(0);
  const activeItem: PreviewSource | null =
    hoveredIndex === null
      ? null
      : hoveredIndex === "see-more"
        ? { accent: "#000000", previewSrc: SEE_MORE_LIST_PREVIEW }
        : items[hoveredIndex];
  // The item whose background is painted. It lags `activeItem` on the way out:
  // when the cursor leaves, `activeItem` goes null (opacity fades to 0) but the
  // background stays so the preview fades out showing its image, not an empty
  // box. Only cleared once hidden — switching between items updates it at once.
  const [displayItem, setDisplayItem] = useState<PreviewSource | null>(null);
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

  const handleEnter = (i: number | "see-more", e: React.MouseEvent) => {
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
                  onClick={saveWorkScroll}
                >
                  {inner}
                </Link>
              )}
            </Reveal>
          );
        })}

        {/* "See more" link to /craft — uses the same hover/preview machinery
            as the regular project rows, but with neutral accent and a
            placeholder preview image (see SEE_MORE_LIST_PREVIEW). */}
        <Reveal delay={items.length * 50}>
          <Link
            href="/craft"
            className="work-list__item"
            style={{ "--accent": "#000000" } as React.CSSProperties}
            onMouseEnter={(e) => handleEnter("see-more", e)}
            onMouseLeave={handleLeave}
          >
            <span className="work-list__name">More</span>
            <span className="work-list__role">Sketches & side work</span>
            <div className="work-list__right">
              <img src={arrowBlack} alt="" className="work-list__arrow" />
            </div>
          </Link>
        </Reveal>
      </div>

      {/* Floating preview — fixed to viewport, follows cursor with spring */}
      <div
        ref={previewRef}
        className={`work-list__preview${activeItem ? " work-list__preview--visible" : ""}`}
        style={
          displayItem
            ? {
                backgroundColor: displayItem.accent,
                backgroundImage: displayItem.previewSrc ? bgImageSet(displayItem.previewSrc) : "none",
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

  // Restore scroll position when returning from a case study (the case study's
  // "Back" link routes here). The position was stashed by saveWorkScroll() when
  // the user left. Only fires once per arrival; absent on a fresh visit, so we
  // land at the top normally. Deferred to the next frame so the page has laid
  // out at full height before we scroll.
  useEffect(() => {
    const y = sessionStorage.getItem("work_scroll");
    if (y === null) return;
    sessionStorage.removeItem("work_scroll");
    const target = parseInt(y, 10);
    requestAnimationFrame(() => {
      window.scrollTo({ top: target, behavior: "instant" });
    });
  }, []);

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

      <main id="main-content" className="page__main">
        <Hero title="Work" subtitle="A closer look at the projects, decisions, and details behind my work." />

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
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                      <rect x="0" y="0" width="6" height="6" rx="1" fill="currentColor" />
                      <rect x="8" y="0" width="6" height="6" rx="1" fill="currentColor" />
                      <rect x="0" y="8" width="6" height="6" rx="1" fill="currentColor" />
                      <rect x="8" y="8" width="6" height="6" rx="1" fill="currentColor" />
                    </svg>
                    <span className="label">Grid</span>
                  </button>
                  <button
                    ref={listBtnRef}
                    role="radio"
                    aria-checked={view === "list"}
                    tabIndex={view === "list" ? 0 : -1}
                    className={`work-main__toggle-btn work-main__toggle-btn--list${view === "list" ? " work-main__toggle-btn--active" : ""}`}
                    onClick={() => setViewPersisted("list")}
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                      <rect x="0" y="1" width="14" height="2" rx="1" fill="currentColor" />
                      <rect x="0" y="6" width="14" height="2" rx="1" fill="currentColor" />
                      <rect x="0" y="11" width="14" height="2" rx="1" fill="currentColor" />
                    </svg>
                    <span className="label">List</span>
                  </button>
                </div>
              </div>
              {/* <div ref={dividerRef} className="work-main__divider" /> */}

              {/* Grid view */}
              {view === "grid" && (
                <div className="work-grid">
                  {WORK_ITEMS.map((item, i) => (
                    <GridItem key={item.name} item={item} index={i} />
                  ))}
                  <SeeMoreGridRow index={WORK_ITEMS.length} />
                </div>
              )}

              {/* List view */}
              {view === "list" && <WorkList items={WORK_ITEMS} dividerRef={dividerRef} />}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
