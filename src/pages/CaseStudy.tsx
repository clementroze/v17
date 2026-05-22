import React, { useRef, useState, useCallback, useEffect } from "react"; // useCallback/useEffect used by NavPreview
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import Button from "../components/Button";
import ProjectsNav from "../components/ProjectsNav";
import ProjectsNavMobile from "../components/ProjectsNavMobile";
import { Link, useRouter } from "../lib/router";
import arrowWhite from "../assets/arrow.svg";
import arrowBlack from "../assets/arrow-black.svg";
import {
  parseCase,
  CaseStudy as CaseStudyData,
  Block,
  Col,
} from "../lib/parseCase";
import { Reveal } from "../lib/reveal";
import work from "../data/work";
import { bySlug } from "../data/data";

// Pick black or white for legible text on top of a given hex background, using
// the W3C relative-luminance threshold. Used for the per-case ::selection color.
function contrastText(hex?: string): string {
  if (!hex) return "#fff";
  const m = hex.replace("#", "").match(/^([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!m) return "#fff";
  let h = m[1];
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  const toLin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const r = toLin(parseInt(h.slice(0, 2), 16));
  const g = toLin(parseInt(h.slice(2, 4), 16));
  const b = toLin(parseInt(h.slice(4, 6), 16));
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.5 ? "#000" : "#fff";
}

function renderInlineLinks(text: string): React.ReactNode {
  const parts = text.split(/(\[[^\]]+\]\([^)]+\))/g);
  return parts.map((part, i) => {
    const m = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (m)
      return (
        <a
          key={i}
          href={m[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="cs-link"
        >
          {m[1]}
        </a>
      );
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
function renderBlock(
  block: Block,
  idx: number,
  prevBlock?: Block,
): React.ReactNode {
  switch (block.type) {
    case "section":
      return (
        <Reveal key={idx}>
          <div className="cs-section__divider" />
          <section className="cs-section">
            <h2 className="cs-section__title">{block.title}</h2>
            <div className="cs-section__body" />
          </section>
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
          <blockquote className="cs-quote">
            {renderInlineLinks(block.text)}
          </blockquote>
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
          <div
            className={`cs-cols${afterImage ? " cs-cols--after-image" : ""}`}
          >
            {block.columns.map((col: Col, j: number) => (
              <div key={j} className="cs-cols__col">
                {col.heading && (
                  <h3 className="cs-cols__heading">
                    {renderInlineLinks(col.heading)}
                  </h3>
                )}
                {col.body && (
                  <p className="cs-cols__body">{renderInlineLinks(col.body)}</p>
                )}
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
            style={
              block.width ? { maxWidth: block.width, width: "100%" } : undefined
            }
          >
            {block.srcs.map((src, i) => {
              const isVideo = /\.(mp4|mov|webm|ogg)$/i.test(src);
              return (
                <figure key={i} className="cs-figure">
                  <div className="cs-images__pic">
                    {src &&
                      (isVideo ? (
                        <video src={src} autoPlay loop muted playsInline />
                      ) : (
                        <img src={src} alt={block.alts?.[i] ?? ""} />
                      ))}
                  </div>
                  {block.captions?.[i] && (
                    <figcaption className="cs-figcaption">
                      {block.captions[i]}
                    </figcaption>
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
function renderBody(
  blocks: Block[],
  setSectionRef?: (idx: number, el: HTMLHeadingElement | null) => void,
) {
  const out: React.ReactNode[] = [];
  let i = 0;
  let sectionIdx = 0;

  while (i < blocks.length) {
    const block = blocks[i];

    if (block.type === "section") {
      const thisSectionIdx = sectionIdx++;
      const titleRef = (el: HTMLHeadingElement | null) =>
        setSectionRef?.(thisSectionIdx, el);
      const bodyBlocks: Block[] = [];
      i++;
      while (i < blocks.length && blocks[i].type !== "section") {
        bodyBlocks.push(blocks[i]);
        i++;
      }

      // Partition into alternating runs: inline (paragraphs/lists) and images.
      // Each run is rendered in order: inline runs go in a cs-section row,
      // image runs go full-width between rows.
      type Run =
        | { kind: "inline"; items: Block[] }
        | { kind: "image"; block: Block };
      const runs: Run[] = [];
      for (const b of bodyBlocks) {
        if (b.type === "images" || b.type === "hmw" || b.type === "cols") {
          runs.push({ kind: "image", block: b });
        } else {
          const last = runs[runs.length - 1];
          if (last?.kind === "inline") {
            last.items.push(b);
          } else {
            runs.push({ kind: "inline", items: [b] });
          }
        }
      }

      // First inline run shares the section title row; subsequent inline runs
      // get their own title-less section row (right-column aligned).
      let firstInline = true;
      runs.forEach((run, r) => {
        if (run.kind === "inline") {
          if (firstInline) {
            firstInline = false;
            out.push(
              <Reveal key={`section-${i}-${r}`}>
                <section className="cs-section">
                  <h2 ref={titleRef} className="cs-section__title">
                    {block.title}
                  </h2>
                  <div className="cs-section__body">
                    {run.items.map((b, j) => renderInlineBlock(b, j))}
                  </div>
                </section>
              </Reveal>,
            );
          } else {
            out.push(
              <Reveal key={`section-${i}-${r}`}>
                <section className="cs-section cs-section--no-border">
                  <div className="cs-section__title" />
                  <div className="cs-section__body">
                    {run.items.map((b, j) => renderInlineBlock(b, j))}
                  </div>
                </section>
              </Reveal>,
            );
          }
        } else {
          const prevRun = runs[r - 1];
          const prev = prevRun?.kind === "image" ? prevRun.block : undefined;
          out.push(renderBlock(run.block, i * 100 + r, prev));
        }
      });

      // Section with no inline content at all (only images or empty)
      if (firstInline) {
        out.push(
          <Reveal key={`section-${i}-title`}>
            <section className="cs-section">
              <h2 ref={titleRef} className="cs-section__title">
                {block.title}
              </h2>
              <div className="cs-section__body" />
            </section>
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
        <blockquote className="cs-quote">
          {renderInlineLinks(block.text)}
        </blockquote>
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

  const activeItem = activeSlug
    ? items.find((w) => w.slug === activeSlug)
    : null;

  return { onMouseMove, handleEnter, handleLeave, previewRef, activeItem };
}

// ── page ──────────────────────────────────────────────────────────────────────
export default function CaseStudy({ slug }: { slug: string }) {
  const heroRef = useRef<HTMLDivElement>(null);
  const nav = NavPreview({ items: work });
  const { previousPath } = useRouter();
  const backHref = previousPath === "/about" ? "/about" : "/work";
  const backLabel = previousPath === "/about" ? "Back to about" : "Back";
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
  // Meta "About" links use the light variant of the case's text accent,
  // defaulting to its `accent` color (the case study page is light mode).
  const metaLinkColor =
    workItem?.textAccentColor?.light ?? workItem?.accent;
  // "Year" comes from the global registry (shared with About), not frontmatter.
  const entityDate = bySlug(slug)?.date ?? "";
  const heroBg = workItem?.imageSrc || "";
  // Cover image follows the slug convention, served from /public.
  const coverBg = `/images/${slug}/cover.png`;

  const currentIdx = work.findIndex((w) => w.slug === slug);
  const prevItem = work[(currentIdx - 1 + work.length) % work.length];
  const nextItem = work[(currentIdx + 1) % work.length];

  const docSectionTitles = blocks
    .filter(
      (b): b is Extract<Block, { type: "section" }> => b.type === "section",
    )
    .map((b) => b.title);
  // The pill nav gets one extra leading step for the meta/info block — labelled
  // "Info" — that scrolls to `cs-meta` instead of an h2.
  const metaRef = useRef<HTMLDivElement>(null);
  const sectionTitles = ["Info", ...docSectionTitles];
  const docSectionCount = docSectionTitles.length;
  const sectionCount = sectionTitles.length;
  // ProjectsNav only reads getBoundingClientRect on these — any HTMLElement works,
  // but the prop type wants HTMLDivElement so we cast at the boundary.
  // Index 0 is the meta block (`metaRef`); indices 1..N are the section h2 refs.
  const docSectionTitleRefs = useRef<React.RefObject<HTMLDivElement>[]>(
    Array.from(
      { length: docSectionCount },
      () => ({ current: null }) as React.RefObject<HTMLDivElement>,
    ),
  );
  if (docSectionTitleRefs.current.length !== docSectionCount) {
    docSectionTitleRefs.current = Array.from(
      { length: docSectionCount },
      () => ({ current: null }) as React.RefObject<HTMLDivElement>,
    );
  }
  const setSectionTitleRef = useCallback(
    (idx: number, el: HTMLHeadingElement | null) => {
      const ref = docSectionTitleRefs.current[
        idx
      ] as React.MutableRefObject<HTMLDivElement | null>;
      if (ref) ref.current = el as unknown as HTMLDivElement | null;
    },
    [],
  );
  const sectionTitleRefs = [metaRef, ...docSectionTitleRefs.current];

  // "View final designs" button (opt-in via `finalDesigns:` frontmatter). The
  // value matches a `## ` section heading; clicking scrolls to that section,
  // clearing the sticky navbar with the same offset the pill nav uses.
  const finalDesignsIdx = meta.finalDesigns
    ? docSectionTitles.findIndex((t) => t === meta.finalDesigns)
    : -1;
  const hasFinalDesigns = finalDesignsIdx !== -1;
  const scrollToFinalDesigns = useCallback(() => {
    const el = docSectionTitleRefs.current[finalDesignsIdx]?.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 110;
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  }, [finalDesignsIdx]);

  // Show ProjectsNav once the cs-meta block has scrolled into view; hide before
  // it AND hide again once the prev/next cards (.cs-nav) enter the viewport so
  // the side rail doesn't overlap the footer navigation.
  const csNavRef = useRef<HTMLDivElement>(null);
  const [navVisible, setNavVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => {
      const meta = metaRef.current;
      if (!meta) return;
      const metaRect = meta.getBoundingClientRect();
      const vh = window.innerHeight;
      const pastMeta = metaRect.top <= vh * 0.7;

      // Hide the pill nav once the prev/next cards' top rises past 60% of the
      // viewport (i.e. the cards are clearly approaching the vertical center
      // where the side rail sits). This makes the exit fire well before the
      // cards overlap with the rail, instead of only when they reach the
      // bottom edge.
      const csNav = csNavRef.current;
      const beforeCsNav = csNav
        ? csNav.getBoundingClientRect().top > vh * 0.9
        : true;

      const shouldShow = pastMeta && beforeCsNav;
      setNavVisible((cur) => (cur === shouldShow ? cur : shouldShow));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className="page cs-page"
      style={
        metaLinkColor
          ? ({
              "--cs-accent": metaLinkColor,
              "--cs-on-accent": contrastText(metaLinkColor),
            } as React.CSSProperties)
          : undefined
      }
    >
      <Navbar watchShowRef={heroRef} activeLink="work" />
      {sectionCount > 0 && (
        <>
          <ProjectsNav
            count={sectionCount}
            sectionRefs={sectionTitleRefs}
            variant="dark"
            alwaysVisible
            visible={navVisible}
            snapOnRelease={false}
            labels={sectionTitles}
            scrollOffset={110}
          />
          <ProjectsNavMobile
            count={sectionCount}
            sectionRefs={sectionTitleRefs}
            variant="dark"
            alwaysVisible
            visible={navVisible}
            scrollOffset={88}
          />
        </>
      )}

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
              <div ref={metaRef} className="cs-meta">
                <div className="cs-meta__left">
                  <div className="cs-meta__col">
                    <div className="cs-meta__row">
                      <p className="cs-meta__label">Year</p>
                      <p className="cs-meta__value">{entityDate}</p>
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
                  {hasFinalDesigns && (
                    <div className="cs-meta__cta cs-meta__cta--down">
                      <Button
                        variant="outline-black"
                        iconSrc={arrowBlack}
                        onClick={scrollToFinalDesigns}
                      >
                        View final designs
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Reveal>

            {/* Sections */}
            {renderBody(blocks, setSectionTitleRef)}

            {/* Prev / Next nav */}
            <div
              ref={csNavRef}
              className="cs-nav"
              onMouseMove={nav.onMouseMove}
            >
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
                    <img
                      src={arrowBlack}
                      alt=""
                      className="cs-nav__arrow cs-nav__arrow--left"
                    />
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
                style={
                  nav.activeItem
                    ? {
                        backgroundColor: nav.activeItem.accent,
                        backgroundImage: nav.activeItem.previewSrc
                          ? `url(${nav.activeItem.previewSrc})`
                          : "none",
                      }
                    : {}
                }
              />
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
