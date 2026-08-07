import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Button from "../components/Button";

// Rendered for any client-side route the SPA doesn't recognise (and for direct
// hits to unknown URLs, which the static host serves via dist/404.html, a copy
// of the SPA shell). Shows a real not-found page instead of silently landing the
// visitor on the homepage; the router also marks these routes noindex so search
// engines don't index typo or expired URLs (see src/main.tsx).
export default function NotFound() {
  // Mirror the live rainbow state (the `html.konami` class, owned by main.tsx) so
  // the toggle label stays correct however rainbow mode is changed — this button,
  // the Footer button, the toast, Esc, or the Konami code. Same pattern as Footer.
  const [rainbowOn, setRainbowOn] = useState(() => document.documentElement.classList.contains("konami"));
  useEffect(() => {
    const html = document.documentElement;
    const sync = () => setRainbowOn(html.classList.contains("konami"));
    const observer = new MutationObserver(sync);
    observer.observe(html, { attributes: true, attributeFilter: ["class"] });
    sync();
    return () => observer.disconnect();
  }, []);

  return (
    <div className="page">
      <Navbar />
      <main id="main-content" className="page__main">
        <div className="container cs-not-found">
          <h1 className="cs-not-found__message">Oops, this page doesn't exist!</h1>

          <p>
            Sorry about that! If you think this is an error, please{" "}
            <a href="mailto:cpr58@cornell.edu" className="link">
              let me know
            </a>{" "}
            :)
          </p>
          <div className="cs-not-found__actions">
            <Button href="/" variant="black">
              Back to home
            </Button>
            <Button
              variant="light-gray"
              className="btn--rainbow-hover"
              onClick={() => window.dispatchEvent(new Event("toggle-rainbow"))}
              ariaLabel={rainbowOn ? "Disable rainbow mode" : "Enable rainbow mode"}
            >
              {rainbowOn ? "Turn off the fun" : "Have some fun"}
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
