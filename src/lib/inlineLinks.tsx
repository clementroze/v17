import React from "react";

// Turn heading text into a URL-fragment id, e.g. "Loading states" →
// "loading-states". Used so in-page `[label](#anchor)` links can target a
// subheading by its slug.
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

// Smooth-scroll to an in-page anchor, clearing the sticky navbar with the same
// 110px offset the pill nav uses.
export function scrollToAnchor(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - 110;
  window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
}

// Inline tokenizer for body text. Splits on three token kinds and leaves the
// rest as plain strings:
//   [label](href)  → an accent-underlined link (in-page #anchor or external)
//   #rrggbb / #rgb → a syntax-highlighted hex code chip with a color swatch
//   `token`        → a plain monospace chip (same styling, no swatch) for
//                     literal UI symbols/abbreviations, e.g. `*` or `Chg`
const INLINE_RE = /(\[[^\]]+\]\([^)]+\))|(#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b)|(`[^`]+`)/g;

/**
 * @param onAnchorClick called instead of the default immediate scroll when an
 * in-page anchor is clicked — e.g. to close a modal/drawer first and scroll
 * only once its exit animation (and scroll lock) has actually finished.
 * Receives the target id; it's responsible for scrolling itself.
 */
export function renderInlineLinks(text: string, onAnchorClick?: (id: string) => void): React.ReactNode {
  const parts = text.split(INLINE_RE).filter((p) => p !== undefined);
  return parts.map((part, i) => {
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) {
      const href = link[2];
      // In-page anchor: scroll smoothly within the page (same tab), accounting
      // for the sticky navbar — rather than opening a new tab like external links.
      if (href.startsWith("#")) {
        const id = href.slice(1);
        return (
          <a
            key={i}
            href={href}
            className="cs-link"
            onClick={(e) => {
              e.preventDefault();
              history.replaceState(null, "", href);
              if (onAnchorClick) {
                onAnchorClick(id);
              } else {
                scrollToAnchor(id);
              }
            }}
          >
            {link[1]}
          </a>
        );
      }
      return (
        <a key={i} href={href} target="_blank" rel="noopener noreferrer" className="cs-link">
          {link[1]}
        </a>
      );
    }
    const hex = part.match(/^#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/);
    if (hex)
      return (
        <code key={i} className="cs-hex">
          <span className="cs-hex__swatch" style={{ backgroundColor: part }} aria-hidden="true" />
          {part}
        </code>
      );
    const token = part.match(/^`([^`]+)`$/);
    if (token)
      return (
        <code key={i} className="cs-token">
          {token[1]}
        </code>
      );
    return part;
  });
}
