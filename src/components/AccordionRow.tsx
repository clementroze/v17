import { useState } from 'react';
import arrowWhite from '../assets/arrow.svg';
import { Link, useRouter } from '../lib/router';

type Segment = string | { label: string; href: string };
export type DescriptionPara = string | Segment[];

export type AccordionRowProps = {
  dotColor: string;
  company: string;
  role: string;
  period: string;
  description?: DescriptionPara | DescriptionPara[];
  hasBorderTop?: boolean;
  caseStudyHref?: string; // shows a "See more" link inside the accordion body
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
  defaultOpen = false,
}: AccordionRowProps) {
  const [open, setOpen] = useState(defaultOpen);
  const { navigate } = useRouter();

  const hasContent = Boolean(description) || Boolean(caseStudyHref);

  const handleCaseStudyClick = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    sessionStorage.setItem('about_scroll', String(window.scrollY));
    sessionStorage.setItem('about_open', company);
    navigate(href);
  };

  return (
    <div
      className={`accordion-row${hasBorderTop ? ' accordion-row--border' : ' accordion-row--border-first'}`}
      style={{ '--accent': dotColor } as React.CSSProperties}
    >
      <button
        className={`accordion-row__header${hasContent ? ' accordion-row__header--interactive' : ''}`}
        onClick={() => hasContent && setOpen(o => !o)}
        aria-expanded={open}
        style={{ cursor: hasContent ? 'pointer' : 'default' }}
      >
        <div className="accordion-row__name">
          <span className="accordion-row__dot" style={{ background: dotColor }} />
          <span className="accordion-row__company">{company}</span>
        </div>
        <span className="accordion-row__role">{role}</span>
        <div className="accordion-row__period">
          <span>{period}</span>
          {hasContent ? (
            <span className={`accordion-row__chevron${open ? ' accordion-row__chevron--open' : ''}`}>
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
        <div className={`accordion-row__body${open ? ' accordion-row__body--open' : ''}`}>
          <div className="accordion-row__body-inner">
            {(Array.isArray(description) ? description : description ? [description] : [])
              .filter((p): p is DescriptionPara => Boolean(p))
              .map((para, i) =>
                typeof para === 'string' ? (
                  <p key={i} className="accordion-row__description">{para}</p>
                ) : (
                  <p key={i} className="accordion-row__description">
                    {(para as Segment[]).map((seg, j) =>
                      typeof seg === 'string' ? seg : (
                        <a key={j} href={seg.href} target="_blank" rel="noopener noreferrer" className="accordion-row__link">
                          {seg.label}
                        </a>
                      )
                    )}
                  </p>
                )
              )}
            {caseStudyHref && (
              <a
                href={caseStudyHref}
                className="accordion-row__see-more"
                onClick={(e) => handleCaseStudyClick(e, caseStudyHref)}
              >
                See case study
                <img src={arrowWhite} alt="" />
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
