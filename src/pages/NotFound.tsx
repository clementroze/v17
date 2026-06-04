import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Link } from "../lib/router";

// Rendered for any client-side route the SPA doesn't recognise (and for direct
// hits to unknown URLs, which the static host serves via dist/404.html, a copy
// of the SPA shell). Shows a real not-found page instead of silently landing the
// visitor on the homepage; the router also marks these routes noindex so search
// engines don't index typo or expired URLs (see src/main.tsx).
export default function NotFound() {
  return (
    <div className="page">
      <Navbar />
      <main id="main-content" className="page__main">
        <div className="cs-not-found">
          <p className="cs-not-found__message">This page could not be found.</p>
          <Link href="/" className="cs-not-found__back">
            ← Back to home
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
