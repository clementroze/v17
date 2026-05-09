import { useState, useRef, useEffect, useCallback } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Hero from "../components/Hero";
import Button from "../components/Button";
import arrowBlack from "../assets/arrow-black.svg";
import { Reveal } from "../lib/reveal";
import { Link } from "../lib/router";

import work, { WorkItem } from "../data/work";

const WORK_ITEMS = work;

// ─── grid item ────────────────────────────────────────────────────────────────

function GridItem({ item, index }: { item: WorkItem; index: number }) {
  const picCols = item.images.map((h, i) => (
    <div key={i} className="work-grid__pic" style={{ height: h }}>
      {item.imageUrls[i] && <img src={item.imageUrls[i]} alt="" />}
    </div>
  ));

  const textCol = (
    <div className="work-grid__text">
      <div className="work-grid__text-top">
        <span className="work-grid__name">{item.name}</span>
        <span className="work-grid__role">{item.role}</span>
      </div>
      <Button
        variant="outline-black"
        href={item.href}
        iconSrc={arrowBlack}
        iconAlt="Arrow"
      >
        See more
      </Button>
    </div>
  );

  if (index === 0) {
    return (
      <Reveal delay={index * 60}>
        <div className="work-grid__row">
          {textCol}
          {picCols[0]}
          {picCols[1]}
          {picCols[2]}
        </div>
      </Reveal>
    );
  }
  if (index === 1) {
    return (
      <Reveal delay={index * 60}>
        <div className="work-grid__row">
          {picCols[0]}
          {picCols[1]}
          {textCol}
          {picCols[2]}
        </div>
      </Reveal>
    );
  }
  if (index === 2) {
    return (
      <Reveal delay={index * 60}>
        <div className="work-grid__row">
          {picCols[0]}
          {picCols[1]}
          {picCols[2]}
          {textCol}
        </div>
      </Reveal>
    );
  }
  // index === 3
  return (
    <Reveal delay={index * 60}>
      <div className="work-grid__row">
        {textCol}
        {picCols[0]}
        {picCols[1]}
        {picCols[2]}
      </div>
    </Reveal>
  );
}

// ─── list view with floating preview ─────────────────────────────────────────

function WorkList({ items, dividerRef }: { items: WorkItem[]; dividerRef: React.RefObject<HTMLDivElement> }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: 0, y: 0 });
  const target = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number>(0);
  const activeItem = hoveredIndex !== null ? items[hoveredIndex] : null;

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

  const onMouseMove = (e: React.MouseEvent) => {
    // Clamp X to the center column: between 1/3 and 2/3 of the list width
    const list = listRef.current;
    if (list) {
      const rect = list.getBoundingClientRect();
      const minX = rect.left + rect.width * 0.25;
      const maxX = rect.right - rect.width * 0.25;
      target.current = {
        x: Math.min(maxX, Math.max(minX, e.clientX)),
        y: e.clientY,
      };
    } else {
      target.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleEnter = (i: number) => {
    setHoveredIndex(i);
    if (i === 0 && dividerRef.current) {
      dividerRef.current.style.setProperty('--divider-color', items[0].accent);
    }
  };

  const handleLeave = () => {
    setHoveredIndex(null);
    if (dividerRef.current) {
      dividerRef.current.style.removeProperty('--divider-color');
    }
  };

  return (
    <div ref={listRef} className="work-list" onMouseMove={onMouseMove}>
      <div className="work-list__items">
        {items.map((item, i) => (
          <Reveal key={item.name} delay={i * 50}>
            <Link
              href={item.href}
              className={`work-list__item${i === 0 ? " work-list__item--first" : ""}`}
              style={{ "--accent": item.accent } as React.CSSProperties}
              onMouseEnter={() => handleEnter(i)}
              onMouseLeave={handleLeave}
            >
              <span className="work-list__name">{item.name}</span>
              <span className="work-list__role">{item.role}</span>
              <div className="work-list__right">
                <img src={arrowBlack} alt="" className="work-list__arrow" />
              </div>
            </Link>
          </Reveal>
        ))}
      </div>

      {/* Floating preview — fixed to viewport, follows cursor with spring */}
      <div
        ref={previewRef}
        className={`work-list__preview${activeItem ? " work-list__preview--visible" : ""}`}
        style={activeItem ? { background: activeItem.accent } : {}}
      />
    </div>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function Work() {
  const [view, setView] = useState<"grid" | "list">(() => {
    try { return (localStorage.getItem('work-view') as 'grid' | 'list') || 'grid'; } catch { return 'grid'; }
  });
  const dividerRef = useRef<HTMLDivElement>(null);
  const gridBtnRef = useRef<HTMLButtonElement>(null);
  const listBtnRef = useRef<HTMLButtonElement>(null);

  const setViewPersisted = (v: 'grid' | 'list', moveFocus = false) => {
    setView(v);
    try { localStorage.setItem('work-view', v); } catch {}
    if (moveFocus) {
      // defer so tabIndex update has applied before we call focus()
      requestAnimationFrame(() => {
        (v === 'grid' ? gridBtnRef : listBtnRef).current?.focus();
      });
    }
  };

  return (
    <div className="page">
      <Navbar activeLink="work" />

      <Hero
        title="Work"
        subtitle="Designs and builds web experiences that are accessible, intentional, and beautifully."
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
                  if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); setViewPersisted('grid', true); }
                  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); setViewPersisted('list', true); }
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
                    <rect x="0" y="0" width="6" height="6" rx="1" fill="currentColor"/>
                    <rect x="8" y="0" width="6" height="6" rx="1" fill="currentColor"/>
                    <rect x="0" y="8" width="6" height="6" rx="1" fill="currentColor"/>
                    <rect x="8" y="8" width="6" height="6" rx="1" fill="currentColor"/>
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
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <rect x="0" y="1" width="14" height="2" rx="1" fill="currentColor"/>
                    <rect x="0" y="6" width="14" height="2" rx="1" fill="currentColor"/>
                    <rect x="0" y="11" width="14" height="2" rx="1" fill="currentColor"/>
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
            {view === "list" && <WorkList items={WORK_ITEMS} dividerRef={dividerRef} />}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
