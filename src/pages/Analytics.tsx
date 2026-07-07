import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "../lib/router";
import {
  getStore,
  clearStore,
  type AnalyticsStore,
} from "../lib/analytics";
import {
  fetchGa4Report,
  isGa4Configured,
  type Ga4Report,
  type Ga4Row,
} from "../lib/ga4Api";

// ── primitives ────────────────────────────────────────────────────────────────

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="an-stat">
      <div className="an-stat__value">{value}</div>
      <div className="an-stat__label">{label}</div>
    </div>
  );
}

function BarChart({ rows }: { rows: { label: string; value: number }[] }) {
  const peak = Math.max(...rows.map((r) => r.value), 1);
  return (
    <div className="an-barchart">
      {rows.map((r) => (
        <div key={r.label} className="an-bar-row">
          <div className="an-bar-label" title={r.label}>{r.label}</div>
          <div className="an-bar">
            <div
              className="an-bar__fill"
              style={{ width: `${Math.round((r.value / peak) * 100)}%` }}
            />
          </div>
          <div className="an-bar-value">{r.value.toLocaleString()}</div>
        </div>
      ))}
      {rows.length === 0 && <div className="an-empty">No data yet</div>}
    </div>
  );
}

function HourChart({ data }: { data: { hour: number; sessions: number }[] }) {
  const peak = Math.max(...data.map((d) => d.sessions), 1);
  return (
    <div className="an-hourchart">
      {data.map(({ hour, sessions }) => (
        <div key={hour} className="an-hour-col">
          <div className="an-hour-bar-wrap">
            <div
              className="an-hour-bar"
              style={{ height: `${Math.round((sessions / peak) * 100)}%` }}
              title={`${sessions}`}
            />
          </div>
          <div className="an-hour-label">{hour % 6 === 0 ? `${hour}h` : ""}</div>
        </div>
      ))}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="an-section">
      <h2 className="an-section__title">{title}</h2>
      {children}
    </section>
  );
}

function ga4ToRows(rows: Ga4Row[]): { label: string; value: number }[] {
  return rows.map((r) => ({ label: r.dimension || "(direct)", value: r.metric }));
}

function fmtDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

function fmtDate(ts: number): string {
  return new Date(ts).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function fmtDateShort(ts: number): string {
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ── date range filter ─────────────────────────────────────────────────────────

type DateRange = 7 | 30 | 90 | 365;

const DATE_RANGE_OPTIONS: { label: string; value: DateRange }[] = [
  { label: "7 days", value: 7 },
  { label: "30 days", value: 30 },
  { label: "90 days", value: 90 },
  { label: "1 year", value: 365 },
];

// ── GA4 setup card ────────────────────────────────────────────────────────────

function Ga4SetupCard() {
  return (
    <div className="an-setup">
      <h3 className="an-setup__title">Connect Google Analytics</h3>
      <p className="an-setup__desc">
        Paste your service account credentials into localStorage once to enable real visitor data from all browsers.
      </p>
      <ol className="an-setup__steps">
        <li>
          Go to <strong>analytics.google.com</strong> → create a GA4 property for{" "}
          <code>clementroze.com</code> → note your <strong>Measurement ID</strong> (<code>G-XXXXXXXXXX</code>)
        </li>
        <li>
          Go to <strong>console.cloud.google.com</strong> → create a project → enable{" "}
          <em>Google Analytics Data API</em> → create a Service Account → download JSON key
        </li>
        <li>
          In GA4 Admin → Property Access Management → add the service account email as{" "}
          <strong>Viewer</strong>
        </li>
        <li>
          Open DevTools console on this site and run:
          <pre className="an-setup__code">{`// Paste the contents of the downloaded JSON key file:
localStorage.setItem('ga4-key', JSON.stringify({ /* key JSON here */ }));
// Your numeric property ID (from GA4 Admin → Property Settings):
localStorage.setItem('ga4-property', 'properties/XXXXXXXXX');`}</pre>
        </li>
        <li>Refresh this page — GA4 data will load automatically.</li>
      </ol>
    </div>
  );
}

// ── GA4 panel ─────────────────────────────────────────────────────────────────

type Ga4State =
  | { status: "unconfigured" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "done"; report: Ga4Report };

function Ga4Panel({ dateRange }: { dateRange: DateRange }) {
  const [state, setState] = useState<Ga4State>(
    isGa4Configured() ? { status: "loading" } : { status: "unconfigured" },
  );

  const load = useCallback(() => {
    if (!isGa4Configured()) { setState({ status: "unconfigured" }); return; }
    setState({ status: "loading" });
    fetchGa4Report(dateRange)
      .then((report) => setState({ status: "done", report }))
      .catch((err: unknown) =>
        setState({ status: "error", message: String(err instanceof Error ? err.message : err) }),
      );
  }, [dateRange]);

  useEffect(() => { load(); }, [load]);

  if (state.status === "unconfigured") return <Ga4SetupCard />;
  if (state.status === "loading") return <div className="an-loading">Loading GA4 data…</div>;
  if (state.status === "error")
    return (
      <div className="an-error">
        <strong>Error:</strong> {state.message}
        <button className="an-btn" onClick={load} style={{ marginLeft: 12 }}>Retry</button>
      </div>
    );

  const { report } = state;
  const totalNvr = report.newVsReturning.new + report.newVsReturning.returning;
  const returnPct = totalNvr > 0
    ? Math.round((report.newVsReturning.returning / totalNvr) * 100)
    : 0;

  const visibleEvents = report.eventCounts.filter(
    (r) => !["session_start", "first_visit", "page_view", "user_engagement"].includes(r.dimension),
  );

  return (
    <>
      <Section title="Overview">
        <div className="an-stat-grid">
          <Stat value={report.totalUsers.toLocaleString()} label="Total users" />
          <Stat value={report.totalSessions.toLocaleString()} label="Sessions" />
          <Stat value={report.totalPageViews.toLocaleString()} label="Page views" />
          <Stat value={`${returnPct}%`} label="Return visitors" />
          <Stat value={report.newVsReturning.new.toLocaleString()} label="New visitors" />
        </div>
      </Section>

      <Section title="Most viewed pages">
        <BarChart rows={ga4ToRows(report.pageViewsByPath)} />
      </Section>

      <Section title="Landing pages · where visitors enter first">
        <BarChart rows={ga4ToRows(report.landingPages)} />
      </Section>

      {report.landingBounceRates.length > 0 && (
        <Section title="Bounce rate by landing page · % who leave without clicking">
          <div className="an-flow">
            <div className="an-flow-row an-flow-row--head">
              <span>Page</span>
              <span />
              <span>Bounce rate</span>
              <span>Sessions</span>
            </div>
            {report.landingBounceRates.map((r, i) => (
              <div key={i} className="an-flow-row">
                <span className="an-flow-from" style={{ gridColumn: "1 / 3" }}>{r.page}</span>
                <span className="an-flow-to">{r.bounceRate}%</span>
                <span className="an-flow-count">{r.sessions}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {report.caseStudyViews.length > 0 && (
        <Section title="Case study views">
          <BarChart rows={ga4ToRows(report.caseStudyViews)} />
        </Section>
      )}

      {visibleEvents.length > 0 && (
        <Section title="Custom events">
          <BarChart rows={ga4ToRows(visibleEvents)} />
        </Section>
      )}

      <Section title="Avg. engagement time by page">
        <BarChart
          rows={report.avgEngagementByPath
            .filter((r) => r.seconds > 0)
            .map((r) => ({ label: r.path, value: r.seconds }))}
        />
      </Section>

      <Section title="Traffic sources">
        <BarChart rows={ga4ToRows(report.topSources)} />
      </Section>

      <div className="an-two-col">
        <Section title="Devices">
          <BarChart rows={ga4ToRows(report.deviceSplit)} />
        </Section>
        <Section title="Countries">
          <BarChart rows={ga4ToRows(report.topCountries)} />
        </Section>
      </div>

      <Section title="Sessions by hour of day">
        <HourChart data={report.hourlyDistribution} />
      </Section>

      <div className="an-action-row">
        <button className="an-btn" onClick={load}>Refresh</button>
      </div>
    </>
  );
}

// ── local panel ───────────────────────────────────────────────────────────────

function LocalPanel({ sortField }: { sortField: SortField }) {
  const [store, setStore] = useState<AnalyticsStore>(getStore);
  const [confirmClear, setConfirmClear] = useState(false);

  const refresh = () => setStore(getStore());

  const handleClear = () => {
    if (confirmClear) {
      clearStore();
      setStore(getStore());
      setConfirmClear(false);
    } else {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 4000);
    }
  };

  const handleExport = () => {
    try {
      const blob = new Blob([JSON.stringify(store, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `analytics-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {}
  };

  // Page view stats aggregated by path
  const pvByPath: Record<string, { count: number; totalDuration: number; maxScroll: number }> = {};
  for (const pv of store.pageViews) {
    const e = (pvByPath[pv.path] ??= { count: 0, totalDuration: 0, maxScroll: 0 });
    e.count += 1;
    e.totalDuration += pv.duration;
    e.maxScroll = Math.max(e.maxScroll, pv.scrollDepth);
  }
  const pvRows = Object.entries(pvByPath)
    .map(([path, d]) => ({
      path,
      count: d.count,
      avgDuration: Math.round(d.totalDuration / d.count),
      maxScroll: d.maxScroll,
    }))
    .sort((a, b) =>
      sortField === "duration"
        ? b.avgDuration - a.avgDuration
        : sortField === "scroll"
        ? b.maxScroll - a.maxScroll
        : b.count - a.count,
    );

  // Event counts
  const eventCounts: Record<string, number> = {};
  for (const ev of store.events) eventCounts[ev.type] = (eventCounts[ev.type] ?? 0) + 1;

  // External links
  const extMap: Record<string, { label: string; count: number }> = {};
  for (const ev of store.events) {
    if (ev.type === "external-click" && typeof ev.payload.href === "string") {
      const href = ev.payload.href;
      const e = (extMap[href] ??= { label: typeof ev.payload.label === "string" ? ev.payload.label : href, count: 0 });
      e.count += 1;
    }
  }
  const externalLinks = Object.entries(extMap)
    .map(([href, { label, count }]) => ({ href, label, count }))
    .sort((a, b) => b.count - a.count);

  // Craft views
  const craftRows = Object.entries(store.craftViews)
    .map(([id, value]) => ({ label: id, value }))
    .sort((a, b) => b.value - a.value);

  // Hourly histogram of your own page views
  const hourBuckets: number[] = Array(24).fill(0);
  for (const pv of store.pageViews) hourBuckets[new Date(pv.timestamp).getHours()] += 1;
  const hourlyData = hourBuckets.map((sessions, hour) => ({ hour, sessions }));

  const avgDuration = store.pageViews.length > 0
    ? Math.round(store.pageViews.reduce((s, pv) => s + pv.duration, 0) / store.pageViews.length)
    : 0;

  const returnSessions = store.sessions.filter((s) => s.isReturn).length;
  const returnPct = store.totalSessions > 0
    ? Math.round((returnSessions / store.totalSessions) * 100)
    : 0;

  const recentSessions = [...store.sessions].reverse().slice(0, 10);

  return (
    <>
      <Section title="This browser · all time">
        <div className="an-stat-grid">
          <Stat value={store.totalSessions} label="Sessions" />
          <Stat value={store.pageViews.length} label="Page views" />
          <Stat value={fmtDuration(avgDuration)} label="Avg page duration" />
          <Stat value={`${returnPct}%`} label="Return rate" />
          <Stat value={fmtDateShort(store.firstVisit)} label="First visit" />
        </div>
      </Section>

      <Section title="Engagement events">
        <div className="an-stat-grid">
          <Stat value={eventCounts["konami-trigger"] ?? 0} label="Konami triggers" />
          <Stat value={eventCounts["bio-modal-open"] ?? 0} label="Bio modal opens" />
          <Stat value={eventCounts["lightbox-open"] ?? 0} label="Craft lightbox opens" />
          <Stat value={eventCounts["external-click"] ?? 0} label="External link clicks" />
        </div>
      </Section>

      <Section title="Page views by route">
        <div className="an-pv-table">
          <div className="an-pv-row an-pv-row--head">
            <span>Route</span>
            <span>Views</span>
            <span>Avg time</span>
            <span>Max scroll</span>
          </div>
          {pvRows.map((r) => (
            <div key={r.path} className="an-pv-row">
              <span className="an-pv-path">{r.path}</span>
              <span>{r.count}</span>
              <span>{fmtDuration(r.avgDuration)}</span>
              <span>{r.maxScroll}%</span>
            </div>
          ))}
          {pvRows.length === 0 && <div className="an-empty">No page views yet</div>}
        </div>
      </Section>

      {craftRows.length > 0 && (
        <Section title="Craft lightbox opens by item">
          <BarChart rows={craftRows} />
        </Section>
      )}

      {externalLinks.length > 0 && (
        <Section title="External links clicked">
          <div className="an-pv-table">
            {externalLinks.map((l) => (
              <div key={l.href} className="an-pv-row">
                <span className="an-pv-path">{l.label || l.href}</span>
                <span>{l.count}×</span>
                <span />
                <span />
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section title="Your visits by hour of day">
        <HourChart data={hourlyData} />
      </Section>

      <Section title="Recent sessions">
        <div className="an-sessions">
          {recentSessions.map((s) => (
            <div key={s.id} className="an-session">
              <div className="an-session__meta">
                <span>{fmtDate(s.startedAt)}</span>
                <span className="an-session__pill">{s.device}</span>
                <span className="an-session__pill">{s.colorScheme}</span>
                <span className="an-session__pill">{s.isReturn ? "return" : "new"}</span>
                <span className="an-session__pill">{s.source || "direct"}</span>
                <span className="an-session__viewport">{s.viewportW}×{s.viewportH}</span>
              </div>
              <div className="an-session__paths">
                {s.paths.join(" → ") || <span className="an-faint">(no navigation)</span>}
              </div>
            </div>
          ))}
          {recentSessions.length === 0 && <div className="an-empty">No sessions recorded yet</div>}
        </div>
      </Section>

      <div className="an-action-row">
        <button className="an-btn" onClick={refresh}>Refresh</button>
        <button className="an-btn" onClick={handleExport}>Export JSON</button>
        <button
          className={`an-btn an-btn--danger${confirmClear ? " an-btn--confirm" : ""}`}
          onClick={handleClear}
        >
          {confirmClear ? "Confirm clear" : "Clear data"}
        </button>
      </div>
      <p className="an-note">Data stored in this browser only · not shared</p>
    </>
  );
}

// ── page ──────────────────────────────────────────────────────────────────────

type Tab = "ga4" | "local";
type SortField = "views" | "duration" | "scroll";

export default function Analytics() {
  const { navigate } = useRouter();
  const [tab, setTab] = useState<Tab>("ga4");
  const [dateRange, setDateRange] = useState<DateRange>(30);
  const [sortField, setSortField] = useState<SortField>("views");

  return (
    <div className="an-page">
      <header className="an-header">
        <div className="an-header__inner">
          <div className="an-header__top">
            <button className="an-back" onClick={() => navigate("/")} aria-label="Back to site">
              ← clementroze.com
            </button>
            <span className="an-header__title">Analytics</span>
          </div>

          <div className="an-controls">
            {/* Tab switcher */}
            <div className="an-tab-group" role="tablist">
              <button
                role="tab"
                aria-selected={tab === "ga4"}
                className={`an-tab${tab === "ga4" ? " an-tab--active" : ""}`}
                onClick={() => setTab("ga4")}
              >
                All visitors
                <span className="an-tab__sub">via GA4</span>
              </button>
              <button
                role="tab"
                aria-selected={tab === "local"}
                className={`an-tab${tab === "local" ? " an-tab--active" : ""}`}
                onClick={() => setTab("local")}
              >
                This browser
                <span className="an-tab__sub">localStorage</span>
              </button>
            </div>

            {/* Date range filter (GA4 only) */}
            {tab === "ga4" && (
              <div className="an-filter-group">
                {DATE_RANGE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    className={`an-filter${dateRange === opt.value ? " an-filter--active" : ""}`}
                    onClick={() => setDateRange(opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}

            {/* Sort filter (local only) */}
            {tab === "local" && (
              <div className="an-filter-group">
                {(["views", "duration", "scroll"] as SortField[]).map((f) => (
                  <button
                    key={f}
                    className={`an-filter${sortField === f ? " an-filter--active" : ""}`}
                    onClick={() => setSortField(f)}
                  >
                    {f === "views" ? "By views" : f === "duration" ? "By time" : "By scroll"}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="an-main">
        <div className="an-content">
          {tab === "ga4" ? (
            <Ga4Panel key={dateRange} dateRange={dateRange} />
          ) : (
            <LocalPanel key={sortField} sortField={sortField} />
          )}
        </div>
      </main>
    </div>
  );
}
