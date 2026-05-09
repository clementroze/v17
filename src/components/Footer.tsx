import { useEffect, useState } from "react";
import arrowWhite from "../assets/arrow.svg";
import footerThumb from "../assets/footer-thumbnail.png";
import { useReveal } from "../lib/reveal";
import { Link } from "../lib/router";
import work from "../data/work";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Work", href: "/work" },
  { label: "Craft", href: "/craft" },
];

function useCurrentTime() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const fmt = () =>
      new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZone: "America/New_York",
      });
    setTime(fmt());
    const id = setInterval(() => setTime(fmt()), 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

export default function Footer() {
  const col0Ref = useReveal(0);
  const col1Ref = useReveal(60);
  const col2Ref = useReveal(120);
  const archiveRef = useReveal<HTMLAnchorElement>(180);
  const bottomRef = useReveal(240);
  const time = useCurrentTime();

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
        </div>

        {/* Work */}
        <div ref={col1Ref} className="reveal footer__col">
          <p className="footer__col-title">Work</p>
          {work.map((item) => (
            <Link key={item.slug} href={item.href} className="footer__col-item">
              {item.name}
            </Link>
          ))}
        </div>

        {/* Contact */}
        <div ref={col2Ref} className="reveal footer__col">
          <p className="footer__col-title">Contact</p>
          <a
            href="mailto:clementproze@gmail.com"
            target="_blank"
            rel="noopener noreferrer"
            className="footer__col-item"
          >
            Email
          </a>
          <a
            href="https://x.com/TheBookie0"
            target="_blank"
            rel="noopener noreferrer"
            className="footer__col-item"
          >
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
          <a
            href="/Clement-Roze-Resume.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="footer__col-item"
          >
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
            <img src={footerThumb} alt="Version 17 thumbnail" />
          </div>
          <div className="footer__archive-text">
            <span className="footer__archive-title">Version 17</span>
            <div className="footer__archive-link">
              <p>View archive</p>
              <img src={arrowWhite} alt="Arrow" />
            </div>
          </div>
        </a>
      </div>

      {/* Bottom bar */}
      <div ref={bottomRef} className="reveal footer__bottom">
        <p className="footer__copyright">
          © {new Date().getFullYear()} Clément Rozé
        </p>
        <p className="footer__location-time">{time} • Ithaca, NY</p>
      </div>
    </footer>
  );
}
