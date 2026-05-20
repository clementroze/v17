import { useState, useEffect } from "react";
import arrowWhite from "../assets/arrow.svg";
import Button from "./Button";
import { Link } from "../lib/router";

type Segment = string | { label: string; href: string };
export type DescriptionPara = string | Segment[];

export type AccordionRowProps = {
  dotColor: string;
  company: string;
  role: string;
  period: string;
  description?: DescriptionPara | DescriptionPara[];
  hasBorderTop?: boolean;
  caseStudyHref?: string;
  caseStudyLabel?: string;
  defaultOpen?: boolean;
};

export default function AccordionRow({
  dotColor,
  company,
  role,
  period,
  description,
  hasBorderTop = true,
  caseStudyHref,
  caseStudyLabel = "View case study",
  defaultOpen = false,
}: AccordionRowProps) {
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    if (defaultOpen) setOpen(true);
  }, [defaultOpen]);

  const hasContent = Boolean(description) || Boolean(caseStudyHref);

  const saveScrollState = () => {
    sessionStorage.setItem("about_scroll", String(window.scrollY));
    sessionStorage.setItem("about_open", company);
  };

  return (
    <div
      className={`accordion-row${hasBorderTop ? " accordion-row--border" : " accordion-row--border-first"}`}
      style={{ "--accent": dotColor } as React.CSSProperties}
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
              className={`accordion-row__chevron${open ? " accordion-row__chevron--open" : ""}`}
            >
              <img src={arrowWhite} alt="" />
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
                  variant="outline-gray"
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
