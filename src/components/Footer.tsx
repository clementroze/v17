import { useEffect, useState } from "react";
import arrowWhite from "../assets/arrow.svg";
import footerThumb from "../assets/footer-thumbnail.png";
import footerThumbAvif from "../assets/footer-thumbnail.avif";
import footerThumbWebp from "../assets/footer-thumbnail.webp";
import { useReveal } from "../lib/reveal";
import { Link } from "../lib/router";
import work from "../data/work";

function SunIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="7" cy="7" r="3" fill="currentColor" />
      <line x1="7" y1="0.5" x2="7" y2="2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="7" y1="11.5" x2="7" y2="13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="0.5" y1="7" x2="2.5" y2="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="11.5" y1="7" x2="13.5" y2="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="2.4" y1="2.4" x2="3.8" y2="3.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="10.2" y1="10.2" x2="11.6" y2="11.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="11.6" y1="2.4" x2="10.2" y2="3.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="3.8" y1="10.2" x2="2.4" y2="11.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M11 7.5A5 5 0 0 1 5.5 2a5 5 0 1 0 5.5 5.5z" fill="currentColor" />
    </svg>
  );
}

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Work", href: "/work" },
  { label: "Craft", href: "/craft" },
];

function isDaytime(now: Date, tz: string) {
  const h = parseInt(
    now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      hour12: false,
      timeZone: tz,
    }),
    10,
  );
  return h >= 6 && h < 20;
}

function useCurrentTime() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const fmt = (tz: string) =>
    now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone: tz,
    });

  // San Jose, California → Pacific time.
  return {
    local: fmt("America/Los_Angeles"),
    localDaytime: isDaytime(now, "America/Los_Angeles"),
  };
}

export default function Footer() {
  const col0Ref = useReveal(0);
  const col1Ref = useReveal(80);
  const col2Ref = useReveal(160);
  const archiveRef = useReveal<HTMLAnchorElement>(240);
  const bottomRef = useReveal(300);
  const { local, localDaytime } = useCurrentTime();
  const [rainbowOn, setRainbowOn] = useState(() => document.documentElement.classList.contains("konami"));

  const toggleRainbow = () => {
    window.dispatchEvent(new Event("toggle-rainbow"));
    setRainbowOn((r) => !r);
  };

  return (
    <footer className="footer">
      <div className="footer__inner">
        {/* Navigation */}
        <div ref={col0Ref} className="reveal footer__col">
          <p className="footer__col-title">Navigation</p>
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="footer__col-item">
              {l.label}
            </Link>
          ))}
          <button className="footer__rainbow-btn" onClick={toggleRainbow}>
            {rainbowOn ? "Disable rainbow mode" : "Enable rainbow mode"}
          </button>
        </div>

        {/* Work */}
        <div ref={col1Ref} className="reveal footer__col">
          <p className="footer__col-title">Work</p>
          {work.map((item) =>
            item.comingSoon ? (
              <span key={item.slug} className="footer__col-item footer__col-item--disabled">
                {item.name}
                <span className="footer__col-item-soon"> - Coming soon</span>
              </span>
            ) : (
              <Link key={item.slug} href={item.href} className="footer__col-item">
                {item.name}
              </Link>
            ),
          )}
        </div>

        {/* Contact */}
        <div ref={col2Ref} className="reveal footer__col">
          <p className="footer__col-title">Contact</p>
          <a href="mailto:cpr58@cornell.edu" target="_blank" rel="noopener noreferrer" className="footer__col-item">
            Email
          </a>
          <a href="https://x.com/TheBookie0" target="_blank" rel="noopener noreferrer" className="footer__col-item">
            Twitter
          </a>
          <a
            href="https://www.linkedin.com/in/clementroze"
            target="_blank"
            rel="noopener noreferrer"
            className="footer__col-item"
          >
            LinkedIn
          </a>
          <a href="/Clement-Roze-Resume.pdf" target="_blank" rel="noopener noreferrer" className="footer__col-item">
            Résumé
          </a>
        </div>

        {/* Archive */}
        <a
          ref={archiveRef}
          href="https://archive.clementroze.com"
          target="_blank"
          rel="noopener noreferrer"
          className="reveal footer__archive"
        >
          <div className="footer__archive-thumb">
            <picture>
              <source srcSet={footerThumbAvif} type="image/avif" />
              <source srcSet={footerThumbWebp} type="image/webp" />
              <img src={footerThumb} alt="" />
            </picture>
          </div>
          <div className="footer__archive-text">
            <p className="footer__archive-title">Version 17</p>
            <div className="footer__archive-link">
              <p>View archive</p>
              <img src={arrowWhite} alt="" />
            </div>
          </div>
        </a>
      </div>

      {/* Bottom bar */}
      <div ref={bottomRef} className="reveal footer__bottom">
        <p className="footer__copyright">&copy; {new Date().getFullYear()} Cl&eacute;ment Roz&eacute;</p>
        <span className="footer__location-time">
          <span className="footer__local-row">
            <span className="footer__city-name">
              San Jose, CA
              <span className="footer__city-icon" aria-hidden="true">
                {localDaytime ? <SunIcon /> : <MoonIcon />}
              </span>
            </span>
            <span className="footer__city-time">{local}</span>
          </span>
        </span>
      </div>
    </footer>
  );
}
