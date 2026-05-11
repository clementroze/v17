import React, { useRef, useState, useCallback, useEffect } from "react"; // useCallback/useEffect used by NavPreview
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import { Link, useRouter } from "../lib/router";
import arrowWhite from "../assets/arrow.svg";
import arrowBlack from "../assets/arrow-black.svg";
import { parseCase, CaseStudy as CaseStudyData, Block, Col } from "../lib/parseCase";
import { Reveal } from "../lib/reveal";
import work from "../data/work";

function renderInlineLinks(text: string): React.ReactNode {
  const parts = text.split(/(\[[^\]]+\]\([^)]+\))/g);
  return parts.map((part, i) => {
    const m = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (m) return <a key={i} href={m[2]} target="_blank" rel="noopener noreferrer" className="cs-link">{m[1]}</a>;
    return part;
  });
}

const mdFiles = import.meta.glob("../work/*.md", {
  as: "raw",
  eager: true,
}) as Record<string, string>;

function loadCase(slug: string): CaseStudyData | null {
  const key = `../work/${slug}.md`;
  if (!(key in mdFiles)) return null;
  return parseCase(mdFiles[key]);
}

// ── body block renderer ───────────────────────────────────────────────────────
function renderBlock(block: Block, idx: number, prevBlock?: Block): React.ReactNode {
  switch (block.type) {
    case "section":
      return (
        <Reveal key={idx}>
          <div className="cs-section__divider" />
          <div className="cs-section">
            <h2 className="cs-section__title">{block.title}</h2>
            <div className="cs-section__body" />
          </div>
        </Reveal>
      );
    case "heading":
      return (
        <Reveal key={idx} delay={40}>
          <h3 className="cs-heading">{renderInlineLinks(block.text)}</h3>
        </Reveal>
      );
    case "quote":
      return (
        <Reveal key={idx} delay={40}>
          <blockquote className="cs-quote">{renderInlineLinks(block.text)}</blockquote>
        </Reveal>
      );
    case "hmw":
      return (
        <Reveal key={idx} delay={40}>
          <div className="cs-hmw-wrap">
            <h2 className="cs-hmw">{renderInlineLinks(block.text)}</h2>
          </div>
        </Reveal>
      );
    case "cols": {
      const afterImage = prevBlock?.type === "images";
      return (
        <Reveal key={idx}>
          <div className={`cs-cols${afterImage ? " cs-cols--after-image" : ""}`}>
            {block.columns.map((col: Col, j: number) => (
              <div key={j} className="cs-cols__col">
                {col.heading && <h3 className="cs-cols__heading">{renderInlineLinks(col.heading)}</h3>}
                {col.body && <p className="cs-cols__body">{renderInlineLinks(col.body)}</p>}
              </div>
            ))}
          </div>
        </Reveal>
      );
    }
    case "paragraph":
      return (
        <Reveal key={idx} delay={40}>
          <p className="cs-paragraph">{renderInlineLinks(block.text)}</p>
        </Reveal>
      );
    case "list":
      return (
        <Reveal key={idx} delay={40}>
          <ul className="cs-list">
            {block.items.map((item, i) => (
              <li key={i}>{renderInlineLinks(item)}</li>
            ))}
          </ul>
        </Reveal>
      );
    case "images":
      return (
        <Reveal key={idx}>
          <div
            className={`cs-images cs-images--${block.srcs.length}`}
            style={block.width ? { maxWidth: block.width, width: '100%' } : undefined}
          >
            {block.srcs.map((src, i) => {
              const isVideo = /\.(mp4|mov|webm|ogg)$/i.test(src);
              return (
                <figure key={i} className="cs-figure">
                  <div className="cs-images__pic">
                    {src && (isVideo
                      ? <video src={src} autoPlay loop muted playsInline />
                      : <img src={src} alt={block.alts?.[i] ?? ""} />
                    )}
                  </div>
                  {block.captions?.[i] && (
                    <figcaption className="cs-figcaption">{block.captions[i]}</figcaption>
                  )}
                </figure>
              );
            })}
          </div>
        </Reveal>
      );
  }
}

// ── section-aware body renderer ───────────────────────────────────────────────
// Within a section, images go full-width while paragraphs/lists always render
// in the right column — even when they appear after an image.
function renderBody(blocks: Block[]) {
  const out: React.ReactNode[] = [];
  let i = 0;

  while (i < blocks.length) {
    const block = blocks[i];

    if (block.type === "section") {
      const bodyBlocks: Block[] = [];
      i++;
      while (i < blocks.length && blocks[i].type !== "section") {
        bodyBlocks.push(blocks[i]);
        i++;
      }

      // Partition into alternating runs: inline (paragraphs/lists) and images.
      // Each run is rendered in order: inline runs go in a cs-section row,
      // image runs go full-width between rows.
      type Run = { kind: 'inline'; items: Block[] } | { kind: 'image'; block: Block };
      const runs: Run[] = [];
      for (const b of bodyBlocks) {
        if (b.type === "images" || b.type === "hmw" || b.type === "cols") {
          runs.push({ kind: 'image', block: b });
        } else {
          const last = runs[runs.length - 1];
          if (last?.kind === 'inline') {
            last.items.push(b);
          } else {
            runs.push({ kind: 'inline', items: [b] });
          }
        }
      }

      // First inline run shares the section title row; subsequent inline runs
      // get their own title-less section row (right-column aligned).
      let firstInline = true;
      runs.forEach((run, r) => {
        if (run.kind === 'inline') {
          if (firstInline) {
            firstInline = false;
            out.push(
              <Reveal key={`section-${i}-${r}`}>
                <div className="cs-section">
                  <h2 className="cs-section__title">{block.title}</h2>
                  <div className="cs-section__body">
                    {run.items.map((b, j) => renderInlineBlock(b, j))}
                  </div>
                </div>
              </Reveal>,
            );
          } else {
            out.push(
              <Reveal key={`section-${i}-${r}`}>
                <div className="cs-section cs-section--no-border">
                  <div className="cs-section__title" />
                  <div className="cs-section__body">
                    {run.items.map((b, j) => renderInlineBlock(b, j))}
                  </div>
                </div>
              </Reveal>,
            );
          }
        } else {
          const prevRun = runs[r - 1];
          const prev = prevRun?.kind === 'image' ? prevRun.block : undefined;
          out.push(renderBlock(run.block, i * 100 + r, prev));
        }
      });

      // Section with no inline content at all (only images or empty)
      if (firstInline) {
        out.push(
          <Reveal key={`section-${i}-title`}>
            <div className="cs-section">
              <h2 className="cs-section__title">{block.title}</h2>
              <div className="cs-section__body" />
            </div>
          </Reveal>,
        );
      }
    } else {
      const prevBlock = i > 0 ? blocks[i - 1] : undefined;
      out.push(renderBlock(block, i, prevBlock));
      i++;
    }
  }

  return out;
}

function renderInlineBlock(block: Block, idx: number): React.ReactNode {
  if (block.type === "heading") {
    return (
      <Reveal key={idx} delay={idx * 50}>
        <h3 className="cs-heading">{renderInlineLinks(block.text)}</h3>
      </Reveal>
    );
  }
  if (block.type === "quote") {
    return (
      <Reveal key={idx} delay={idx * 50}>
        <blockquote className="cs-quote">{renderInlineLinks(block.text)}</blockquote>
      </Reveal>
    );
  }
  if (block.type === "hmw") {
    return (
      <Reveal key={idx} delay={idx * 50}>
        <p className="cs-hmw">{renderInlineLinks(block.text)}</p>
      </Reveal>
    );
  }
  if (block.type === "paragraph") {
    return (
      <Reveal key={idx} delay={idx * 50}>
        <p className="cs-paragraph">{renderInlineLinks(block.text)}</p>
      </Reveal>
    );
  }
  if (block.type === "list") {
    return (
      <Reveal key={idx} delay={idx * 50}>
        <ul className="cs-list">
          {block.items.map((item, i) => (
            <li key={i}>{renderInlineLinks(item)}</li>
          ))}
        </ul>
      </Reveal>
    );
  }
  return null;
}

// ── floating nav preview ──────────────────────────────────────────────────────
function NavPreview({ items }: { items: typeof work }) {
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: 0, y: 0 });
  const target = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number>(0);

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
    target.current = { x: e.clientX, y: e.clientY };
  };

  const handleEnter = (slug: string) => setActiveSlug(slug);
  const handleLeave = () => setActiveSlug(null);

  const activeItem = activeSlug ? items.find(w => w.slug === activeSlug) : null;

  return { onMouseMove, handleEnter, handleLeave, previewRef, activeItem };
}

// ── page ──────────────────────────────────────────────────────────────────────
export default function CaseStudy({ slug }: { slug: string }) {
  const heroRef = useRef<HTMLDivElement>(null);
  const nav = NavPreview({ items: work });
  const { previousPath } = useRouter();
  const backHref = previousPath === "/about" ? "/about" : "/work";
  const backLabel = previousPath === "/about" ? "Back to About" : "Back";
  const data = loadCase(slug);

  if (!data) {
    return (
      <div className="page cs-not-found">
        <p className="cs-not-found__message">Case study "{slug}" not found.</p>
        <Link href={backHref} className="cs-not-found__back">
          ← {backLabel}
        </Link>
      </div>
    );
  }

  const { meta, blocks } = data;
  const workItem = work.find((w) => w.slug === slug);
  const heroBg = workItem?.imageSrc || "";
  const coverBg = meta.cover || "";

  const currentIdx = work.findIndex((w) => w.slug === slug);
  const prevItem = work[(currentIdx - 1 + work.length) % work.length];
  const nextItem = work[(currentIdx + 1) % work.length];

  return (
    <div className="page cs-page">
      <Navbar watchShowRef={heroRef} activeLink="work" />

      {/* ── Hero block ────────────────────────────────────────────── */}
      <div className="cs-hero-wrap">
        <div ref={heroRef} className="cs-hero">
          {heroBg && <img src={heroBg} alt="" className="cs-hero__img" />}

          {/* Title block anchored to bottom */}
          <div className="container-wrapper cs-hero__bottom">
            <div className="container">
              <div className="cs-hero__text">
                <Link href={backHref} className="cs-hero__back">
                  <img
                    src={arrowWhite}
                    alt=""
                    className="cs-hero__back-arrow"
                  />
                  {backLabel}
                </Link>
                <h1 className="cs-hero__title">{meta.title}</h1>
                <p className="cs-hero__subtitle">{meta.subtitle}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Cover image (overlaps hero bottom) ──────────────────── */}
        <div className="container-wrapper cs-cover-wrap">
          <div className="container">
            <div
              className="cs-cover"
              style={coverBg ? { backgroundImage: `url(${coverBg})` } : {}}
            />
          </div>
        </div>
      </div>

      {/* ── Body ──────────────────────────────────────────────────── */}
      <div className="container-wrapper">
        <div className="container">
          <div className="cs-body">
            {/* Meta block */}
            <Reveal>
              <div className="cs-meta">
                <div className="cs-meta__left">
                  <div className="cs-meta__col">
                    <div className="cs-meta__row">
                      <p className="cs-meta__label">Year</p>
                      <p className="cs-meta__value">{meta.year}</p>
                    </div>
                    <div className="cs-meta__row">
                      <p className="cs-meta__label">Role</p>
                      <p className="cs-meta__value cs-role">{meta.role}</p>
                    </div>
                  </div>
                  <div className="cs-meta__col">
                    <p className="cs-meta__label">Type</p>
                    <p className="cs-meta__value">{meta.type}</p>
                  </div>
                </div>
                <div className="cs-meta__about">
                  <p className="cs-meta__label">About</p>
                  {meta.about.map((p, i) => (
                    <p key={i} className="cs-meta__value">
                      {renderInlineLinks(p)}
                    </p>
                  ))}
                </div>
              </div>
            </Reveal>

            {/* Sections */}
            {renderBody(blocks)}

            {/* Prev / Next nav */}
            <div className="cs-nav" onMouseMove={nav.onMouseMove}>
              {prevItem.comingSoon ? (
                <div
                  className="cs-nav__card cs-nav__card--prev cs-nav__card--disabled"
                  style={{ "--accent": prevItem.accent } as React.CSSProperties}
                >
                  <span className="cs-nav__name">{prevItem.name}</span>
                  <span className="cs-nav__meta">
                    <span className="cs-nav__label">Coming soon</span>
                  </span>
                </div>
              ) : (
                <Link
                  href={prevItem.href}
                  className="cs-nav__card cs-nav__card--prev"
                  style={{ "--accent": prevItem.accent } as React.CSSProperties}
                  onMouseEnter={() => nav.handleEnter(prevItem.slug)}
                  onMouseLeave={nav.handleLeave}
                >
                  <span className="cs-nav__name">{prevItem.name}</span>
                  <span className="cs-nav__meta">
                    <img src={arrowBlack} alt="" className="cs-nav__arrow cs-nav__arrow--left" />
                    <span className="cs-nav__label">Previous</span>
                  </span>
                </Link>
              )}
              {nextItem.comingSoon ? (
                <div
                  className="cs-nav__card cs-nav__card--next cs-nav__card--disabled"
                  style={{ "--accent": nextItem.accent } as React.CSSProperties}
                >
                  <span className="cs-nav__name">{nextItem.name}</span>
                  <span className="cs-nav__meta">
                    <span className="cs-nav__label">Coming soon</span>
                  </span>
                </div>
              ) : (
                <Link
                  href={nextItem.href}
                  className="cs-nav__card cs-nav__card--next"
                  style={{ "--accent": nextItem.accent } as React.CSSProperties}
                  onMouseEnter={() => nav.handleEnter(nextItem.slug)}
                  onMouseLeave={nav.handleLeave}
                >
                  <span className="cs-nav__name">{nextItem.name}</span>
                  <span className="cs-nav__meta">
                    <span className="cs-nav__label">Next</span>
                    <img src={arrowBlack} alt="" className="cs-nav__arrow" />
                  </span>
                </Link>
              )}

              {/* Floating preview */}
              <div
                ref={nav.previewRef}
                className={`work-list__preview${nav.activeItem ? " work-list__preview--visible" : ""}`}
                style={nav.activeItem ? {
                  backgroundColor: nav.activeItem.accent,
                  backgroundImage: nav.activeItem.previewSrc ? `url(${nav.activeItem.previewSrc})` : "none",
                } : {}}
              />
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
