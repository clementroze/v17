// Client-side analytics: local session tracking + GA4 event forwarding.
// All localStorage/window access is guarded for SSR safety and wrapped in try/catch.

const LS_KEY = "portfolio-analytics";
const SS_KEY = "portfolio-session-id";

// ── types ─────────────────────────────────────────────────────────────────────

export type SessionRecord = {
  id: string;
  startedAt: number;
  endedAt: number | null;
  paths: string[];
  device: "mobile" | "desktop";
  viewportW: number;
  viewportH: number;
  colorScheme: "dark" | "light";
  isReturn: boolean;
  referrer: string;
  source: string;
};

export type PageViewRecord = {
  path: string;
  timestamp: number;
  duration: number;
  scrollDepth: number;
  sessionId: string;
};

export type EngagementEvent = {
  type: "lightbox-open" | "bio-modal-open" | "konami-trigger" | "external-click";
  payload: Record<string, string | number | boolean>;
  timestamp: number;
  path: string;
};

export type AnalyticsStore = {
  version: 1;
  firstVisit: number;
  totalSessions: number;
  sessions: SessionRecord[];
  pageViews: PageViewRecord[];
  events: EngagementEvent[];
  craftViews: Record<string, number>;
};

// ── module state ──────────────────────────────────────────────────────────────

type CurrentPV = {
  path: string;
  startedAt: number;
  maxScrollDepth: number;
  sessionId: string;
};

let _currentPV: CurrentPV | null = null;
let _scrollRafId: number | null = null;
let _currentPath = "";

// ── helpers ───────────────────────────────────────────────────────────────────

function canUse(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function genId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
  }
}

function parseSource(referrer: string): string {
  if (!referrer) return "direct";
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, "");
    if (host.includes("google")) return "google";
    if (host.includes("linkedin")) return "linkedin";
    if (host.includes("twitter") || host.includes("x.com")) return "twitter";
    if (host.includes("github")) return "github";
    if (host.includes("dribbble")) return "dribbble";
    if (host.includes("behance")) return "behance";
    return host;
  } catch {
    return "direct";
  }
}

function readStore(): AnalyticsStore {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AnalyticsStore;
      if (parsed.version === 1) return parsed;
    }
  } catch {}
  return {
    version: 1,
    firstVisit: Date.now(),
    totalSessions: 0,
    sessions: [],
    pageViews: [],
    events: [],
    craftViews: {},
  };
}

function writeStore(store: AnalyticsStore): void {
  try {
    // Trim oldest entries to stay well under localStorage limits
    if (store.pageViews.length > 1000) store.pageViews = store.pageViews.slice(-800);
    if (store.events.length > 2000) store.events = store.events.slice(-1800);
    if (store.sessions.length > 200) store.sessions = store.sessions.slice(-180);
    localStorage.setItem(LS_KEY, JSON.stringify(store));
  } catch {}
}

function getSessionId(): string | null {
  try {
    return sessionStorage.getItem(SS_KEY);
  } catch {
    return null;
  }
}

function setSessionId(id: string): void {
  try {
    sessionStorage.setItem(SS_KEY, id);
  } catch {}
}

function updateSession(updater: (s: SessionRecord) => SessionRecord): void {
  try {
    const id = getSessionId();
    if (!id) return;
    const store = readStore();
    const idx = store.sessions.findIndex((s) => s.id === id);
    if (idx >= 0) {
      store.sessions[idx] = updater(store.sessions[idx]);
      writeStore(store);
    }
  } catch {}
}

// ── scroll tracking ───────────────────────────────────────────────────────────

function getScrollDepth(): number {
  try {
    const scrolled = window.scrollY + window.innerHeight;
    const total = document.documentElement.scrollHeight;
    return total > 0 ? Math.min(100, Math.round((scrolled / total) * 100)) : 0;
  } catch {
    return 0;
  }
}

function startScrollTracking(): void {
  stopScrollTracking();
  const onScroll = () => {
    if (_scrollRafId !== null) return;
    _scrollRafId = requestAnimationFrame(() => {
      _scrollRafId = null;
      if (_currentPV) {
        const depth = getScrollDepth();
        if (depth > _currentPV.maxScrollDepth) _currentPV.maxScrollDepth = depth;
      }
    });
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  // Store cleanup fn on module-level var — replaced each page view
  _stopScrollFn = () => window.removeEventListener("scroll", onScroll);
}

let _stopScrollFn: (() => void) | null = null;

function stopScrollTracking(): void {
  if (_stopScrollFn) {
    _stopScrollFn();
    _stopScrollFn = null;
  }
  if (_scrollRafId !== null) {
    cancelAnimationFrame(_scrollRafId);
    _scrollRafId = null;
  }
}

// ── public API ────────────────────────────────────────────────────────────────

export function initAnalytics(): void {
  if (!canUse()) return;
  try {
    const store = readStore();
    const existingSessionId = getSessionId();

    if (!existingSessionId) {
      // New session
      const id = genId();
      const isReturn = store.totalSessions > 0;
      const session: SessionRecord = {
        id,
        startedAt: Date.now(),
        endedAt: null,
        paths: [],
        device: window.innerWidth <= 768 ? "mobile" : "desktop",
        viewportW: window.innerWidth,
        viewportH: window.innerHeight,
        colorScheme: window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
        isReturn,
        referrer: document.referrer || "",
        source: parseSource(document.referrer),
      };
      store.sessions.push(session);
      store.totalSessions += 1;
      writeStore(store);
      setSessionId(id);
    }

    // Finalize session on tab close
    window.addEventListener("beforeunload", () => {
      finalizeCurrentPageView();
      updateSession((s) => ({ ...s, endedAt: Date.now() }));
    });
  } catch {}
}

export function trackPageView(path: string): void {
  if (!canUse()) return;
  try {
    // Finalize the previous page view
    finalizeCurrentPageView();

    _currentPath = path;
    const sessionId = getSessionId() ?? "";
    _currentPV = {
      path,
      startedAt: Date.now(),
      maxScrollDepth: getScrollDepth(),
      sessionId,
    };

    // Append path to session
    updateSession((s) => ({
      ...s,
      paths: [...s.paths, path],
    }));

    startScrollTracking();

    // Send page_view to GA4 (gtag auto-tracks on config, but we call manually for SPA navigations)
    sendGtag("event", "page_view", { page_path: path });
  } catch {}
}

function finalizeCurrentPageView(): void {
  if (!_currentPV) return;
  try {
    const pv = _currentPV;
    _currentPV = null;
    stopScrollTracking();

    const duration = Math.round((Date.now() - pv.startedAt) / 1000);
    const record: PageViewRecord = {
      path: pv.path,
      timestamp: pv.startedAt,
      duration,
      scrollDepth: pv.maxScrollDepth,
      sessionId: pv.sessionId,
    };
    const store = readStore();
    store.pageViews.push(record);
    writeStore(store);
  } catch {}
}

export function trackEvent(
  type: EngagementEvent["type"],
  payload: Record<string, string | number | boolean>,
): void {
  if (!canUse()) return;
  try {
    const event: EngagementEvent = {
      type,
      payload,
      timestamp: Date.now(),
      path: _currentPath,
    };
    const store = readStore();
    store.events.push(event);
    writeStore(store);

    // Forward to GA4
    const ga4EventName = type.replace(/-/g, "_");
    sendGtag("event", ga4EventName, payload);
  } catch {}
}

export function incrementCraftView(id: string): void {
  if (!canUse()) return;
  try {
    const store = readStore();
    store.craftViews[id] = (store.craftViews[id] ?? 0) + 1;
    writeStore(store);
  } catch {}
}

export function getStore(): AnalyticsStore {
  if (!canUse()) {
    return {
      version: 1,
      firstVisit: Date.now(),
      totalSessions: 0,
      sessions: [],
      pageViews: [],
      events: [],
      craftViews: {},
    };
  }
  return readStore();
}

export function clearStore(): void {
  if (!canUse()) return;
  try {
    localStorage.removeItem(LS_KEY);
  } catch {}
}

// ── gtag helper ───────────────────────────────────────────────────────────────

type GtagArgs =
  | ["event", string, Record<string, string | number | boolean>]
  | ["config", string]
  | ["js", Date];

function sendGtag(...args: GtagArgs): void {
  try {
    const w = window as unknown as { gtag?: (...a: GtagArgs) => void; dataLayer?: unknown[] };
    if (typeof w.gtag === "function") {
      w.gtag(...args);
    } else if (Array.isArray(w.dataLayer)) {
      // gtag script not yet loaded — push directly to dataLayer
      (w.dataLayer as unknown[]).push(args);
    }
  } catch {}
}
