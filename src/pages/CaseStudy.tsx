import React, { useRef } from "react";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import { Link, useRouter } from "../lib/router";
import arrowWhite from "../assets/arrow.svg";
import { parseCase, CaseStudy as CaseStudyData, Block } from "../lib/parseCase";
import { Reveal } from "../lib/reveal";
import work from "../data/work";

// ── Vite glob import: every .md in content/work as raw strings ────────────────
const mdFiles = import.meta.glob("../content/work/*.md", {
  as: "raw",
  eager: true,
}) as Record<string, string>;

function loadCase(slug: string): CaseStudyData | null {
  const key = `../content/work/${slug}.md`;
  if (!(key in mdFiles)) return null;
  return parseCase(mdFiles[key]);
}

// ── body block renderer ───────────────────────────────────────────────────────
function renderBlock(block: Block, idx: number): React.ReactNode {
  switch (block.type) {
    case "section":
      return (
        <Reveal key={idx}>
          <div className="cs-section__divider" />
          <div className="cs-section">
            <p className="cs-section__title">{block.title}</p>
            <div className="cs-section__body" />
          </div>
        </Reveal>
      );
    case "paragraph":
      return (
        <Reveal key={idx} delay={40}>
          <p className="cs-paragraph">{block.text}</p>
        </Reveal>
      );
    case "list":
      return (
        <Reveal key={idx} delay={40}>
          <ul className="cs-list">
            {block.items.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </Reveal>
      );
    case "images":
      return (
        <Reveal key={idx}>
          <div className={`cs-images cs-images--${block.srcs.length}`}>
            {block.srcs.map((src, i) => (
              <div key={i} className="cs-images__pic">
                {src && <img src={src} alt="" />}
              </div>
            ))}
          </div>
        </Reveal>
      );
  }
}

// ── section-aware body renderer ───────────────────────────────────────────────
// Groups blocks so paragraphs/lists/images that follow a section heading
// are rendered inside that section's right column.
function renderBody(blocks: Block[]) {
  const out: React.ReactNode[] = [];
  let i = 0;

  while (i < blocks.length) {
    const block = blocks[i];

    if (block.type === "section") {
      // Collect the body blocks until the next section heading or image group
      const bodyBlocks: Block[] = [];
      i++;
      while (i < blocks.length && blocks[i].type !== "section") {
        bodyBlocks.push(blocks[i]);
        i++;
      }

      // Split: inline blocks (paragraphs + lists) go in right col,
      // standalone image blocks go full-width after the section row
      const inlineBlocks: Block[] = [];
      const trailingImages: Block[] = [];
      let seenImage = false;
      for (const b of bodyBlocks) {
        if (b.type === "images") {
          seenImage = true;
          trailingImages.push(b);
        } else if (!seenImage) {
          inlineBlocks.push(b);
        } else {
          trailingImages.push(b);
        }
      }

      out.push(
        <Reveal key={`section-${i}`}>
          <div className="cs-section">
            <p className="cs-section__title">{block.title}</p>
            <div className="cs-section__body">
              {inlineBlocks.map((b, j) => renderInlineBlock(b, j))}
            </div>
          </div>
        </Reveal>,
      );

      // Full-width images after the section
      for (let t = 0; t < trailingImages.length; t++) {
        out.push(renderBlock(trailingImages[t], i * 100 + t));
      }
    } else {
      out.push(renderBlock(block, i));
      i++;
    }
  }

  return out;
}

function renderInlineBlock(block: Block, idx: number): React.ReactNode {
  if (block.type === "paragraph") {
    return (
      <Reveal key={idx} delay={idx * 50}>
        <p className="cs-paragraph">{block.text}</p>
      </Reveal>
    );
  }
  if (block.type === "list") {
    return (
      <Reveal key={idx} delay={idx * 50}>
        <ul className="cs-list">
          {block.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </Reveal>
    );
  }
  return null;
}

// ── page ──────────────────────────────────────────────────────────────────────
export default function CaseStudy({ slug }: { slug: string }) {
  const heroRef = useRef<HTMLDivElement>(null);
  const { previousPath } = useRouter();
  const backHref = previousPath === '/about' ? '/about' : '/work';
  const backLabel = previousPath === '/about' ? 'Back to About' : 'Back';
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
  const heroBg = workItem?.imageSrc || meta.hero || "";

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
              style={
                meta.cover ? { backgroundImage: `url(${meta.cover})` } : {}
              }
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
                      <span className="cs-meta__label">Year</span>
                      <span className="cs-meta__value">{meta.year}</span>
                    </div>
                    <div className="cs-meta__row">
                      <span className="cs-meta__label">Role</span>
                      <span className="cs-meta__value">{meta.role}</span>
                    </div>
                  </div>
                  <div className="cs-meta__col">
                    <span className="cs-meta__label">Type</span>
                    <span className="cs-meta__value">{meta.type}</span>
                  </div>
                </div>
                <div className="cs-meta__about">
                  <span className="cs-meta__label">About</span>
                  {meta.about.map((p, i) => (
                    <p key={i} className="cs-meta__value">
                      {p}
                    </p>
                  ))}
                </div>
              </div>
            </Reveal>

            {/* Sections */}
            {renderBody(blocks)}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
