import { useState, useEffect } from "react";
import arrowWhite from "../assets/arrow.svg";
import Button from "./Button";
import { Link } from "../lib/router";
import { bySlug, darkAccent, aboutRole } from "../data/data";

type Segment = string | { label: string; href: string };
export type DescriptionPara = string | Segment[];

export type AccordionRowProps = {
  /** Registry key (data.ts). Supplies the dot/link color, name, role, date, link. */
  slug: string;
  /** Override the registry name if About wants a different label. */
  company?: string;
  description?: DescriptionPara | DescriptionPara[];
  hasBorderTop?: boolean;
  /**
   * Link target for the row's CTA. Defaults to the registry `href` (the case
   * study). About entries with no case study set an external link here.
   */
  caseStudyHref?: string;
  caseStudyLabel?: string;
  defaultOpen?: boolean;
};

export default function AccordionRow({
  slug,
  company: companyOverride,
  description,
  hasBorderTop = true,
  caseStudyHref: caseStudyHrefOverride,
  caseStudyLabel = "View case study",
  defaultOpen = false,
}: AccordionRowProps) {
  const entity = bySlug(slug);
  // The dot and inline-link color: dark variant of the entity's text accent,
  // falling back to its accent. (About renders dark.)
  const dotColor = entity?.accent ?? "#000";
  const linkColor = entity ? darkAccent(entity) : dotColor;
  const company = companyOverride ?? entity?.name ?? slug;
  // Role + date/period come from the registry (role allows an About-only
  // override via aboutRole). Date is shared verbatim with the case study.
  const role = entity ? aboutRole(entity) : "";
  const period = entity?.date ?? "";
  // Fall back to the registry case-study href only when one actually exists.
  // Entities still marked "coming soon" (hasCaseStudy: false) show no CTA, so
  // the accordion just ends after the description. An explicit override (e.g.
  // an external link) is always honored.
  const caseStudyHref =
    caseStudyHrefOverride ?? (entity?.hasCaseStudy ? entity.href : undefined);
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    if (defaultOpen) setOpen(true);
  }, [defaultOpen]);

  const hasContent = Boolean(description) || Boolean(caseStudyHref);

  const saveScrollState = () => {
    sessionStorage.setItem("about_scroll", String(window.scrollY));
    sessionStorage.setItem("about_open", slug);
  };

  return (
    <div
      className={`accordion-row${hasBorderTop ? " accordion-row--border" : " accordion-row--border-first"}`}
      style={
        { "--accent": dotColor, "--link-accent": linkColor } as React.CSSProperties
      }
    >
      <button
        className={`accordion-row__header${hasContent ? " accordion-row__header--interactive" : ""}`}
        onClick={() => hasContent && setOpen((o) => !o)}
        aria-expanded={open}
        style={{ cursor: hasContent ? "pointer" : "default" }}
      >
        <div className="accordion-row__name">
          <span
            className="accordion-row__dot"
            style={{ background: dotColor }}
          />
          <span className="accordion-row__company">{company}</span>
        </div>
        <span className="accordion-row__role">{role}</span>
        <div className="accordion-row__period">
          <span>{period}</span>
          {hasContent ? (
            <span
              className={`accordion-row__toggle${open ? " accordion-row__toggle--open" : ""}`}
              aria-hidden="true"
            >
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <line
                  className="accordion-row__toggle-bar accordion-row__toggle-bar--h"
                  x1="5" y1="12" x2="19" y2="12"
                />
                <line
                  className="accordion-row__toggle-bar accordion-row__toggle-bar--v"
                  x1="12" y1="5" x2="12" y2="19"
                />
              </svg>
            </span>
          ) : (
            <span className="accordion-row__arrow">
              <img src={arrowWhite} alt="" />
            </span>
          )}
        </div>
      </button>

      {hasContent && (
        <div
          className={`accordion-row__body${open ? " accordion-row__body--open" : ""}`}
        >
          <div className="accordion-row__body-inner">
            {(Array.isArray(description)
              ? description
              : description
                ? [description]
                : []
            )
              .filter((p): p is DescriptionPara => Boolean(p))
              .map((para, i) =>
                typeof para === "string" ? (
                  <p key={i} className="accordion-row__description">
                    {para}
                  </p>
                ) : (
                  <p key={i} className="accordion-row__description">
                    {(para as Segment[]).map((seg, j) =>
                      typeof seg === "string" ? (
                        seg
                      ) : seg.href.startsWith("/") ? (
                        <Link
                          key={j}
                          href={seg.href}
                          className="accordion-row__link"
                          tabIndex={open ? 0 : -1}
                          onClick={saveScrollState}
                        >
                          {seg.label}
                        </Link>
                      ) : (
                        <a
                          key={j}
                          href={seg.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="accordion-row__link"
                          tabIndex={open ? 0 : -1}
                        >
                          {seg.label}
                        </a>
                      ),
                    )}
                  </p>
                ),
              )}
            {caseStudyHref && (
              <div tabIndex={-1} style={{ paddingLeft: 16, marginTop: 12 }}>
                <Button
                  href={caseStudyHref}
                  iconSrc={arrowWhite}
                  variant="dark-gray"
                  onClick={
                    caseStudyHref.startsWith("/") ? saveScrollState : undefined
                  }
                >
                  {caseStudyLabel}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
