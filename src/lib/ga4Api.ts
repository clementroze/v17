// GA4 Data API client. Uses a service account key stored in localStorage
// (never in source code) to sign a JWT and exchange it for a short-lived
// OAuth token, then queries the GA4 Data API runReport endpoint.

const LS_GA4_KEY = "ga4-key";
const LS_GA4_PROPERTY = "ga4-property";

// ── types ─────────────────────────────────────────────────────────────────────

type ServiceAccountKey = {
  private_key: string;
  client_email: string;
};

export type Ga4Row = { dimension: string; metric: number };

export type Ga4Report = {
  totalUsers: number;
  totalSessions: number;
  totalPageViews: number;
  newVsReturning: { new: number; returning: number };
  pageViewsByPath: Ga4Row[];
  topSources: Ga4Row[];
  deviceSplit: Ga4Row[];
  topCountries: Ga4Row[];
  caseStudyViews: Ga4Row[];
  avgEngagementByPath: { path: string; seconds: number }[];
  eventCounts: Ga4Row[];
  hourlyDistribution: { hour: number; sessions: number }[];
  landingPages: Ga4Row[];
  landingBounceRates: { page: string; bounceRate: number; sessions: number }[];
};

// ── config check ──────────────────────────────────────────────────────────────

export function isGa4Configured(): boolean {
  try {
    return (
      !!localStorage.getItem(LS_GA4_KEY) && !!localStorage.getItem(LS_GA4_PROPERTY)
    );
  } catch {
    return false;
  }
}

function getConfig(): { key: ServiceAccountKey; property: string } | null {
  try {
    const rawKey = localStorage.getItem(LS_GA4_KEY);
    const property = localStorage.getItem(LS_GA4_PROPERTY);
    if (!rawKey || !property) return null;
    const key = JSON.parse(rawKey) as ServiceAccountKey;
    return { key, property };
  } catch {
    return null;
  }
}

// ── JWT / OAuth ───────────────────────────────────────────────────────────────

function base64url(data: Uint8Array): string {
  let str = "";
  for (let i = 0; i < data.length; i++) str += String.fromCharCode(data[i]);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function encodeBase64url(obj: unknown): string {
  const json = JSON.stringify(obj);
  const bytes = new TextEncoder().encode(json);
  return base64url(bytes);
}

async function makeJwt(key: ServiceAccountKey): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = encodeBase64url({ alg: "RS256", typ: "JWT" });
  const claim = encodeBase64url({
    iss: key.client_email,
    scope: "https://www.googleapis.com/auth/analytics.readonly",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  });

  const signingInput = `${header}.${claim}`;

  // Parse the PEM private key
  const pemBody = key.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s/g, "");
  const derBytes = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    derBytes,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const sigBytes = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(signingInput),
  );

  const sig = base64url(new Uint8Array(sigBytes));
  return `${signingInput}.${sig}`;
}

async function getAccessToken(key: ServiceAccountKey): Promise<string> {
  const jwt = await makeJwt(key);
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OAuth token error: ${err}`);
  }
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

// ── GA4 Data API calls ────────────────────────────────────────────────────────

type RunReportBody = {
  dateRanges: { startDate: string; endDate: string }[];
  dimensions?: { name: string }[];
  metrics: { name: string }[];
  dimensionFilter?: unknown;
  limit?: number;
  orderBys?: unknown[];
};

async function runReport(
  property: string,
  token: string,
  body: RunReportBody,
): Promise<{ rows?: { dimensionValues?: { value: string }[]; metricValues?: { value: string }[] }[] }> {
  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/${property}:runReport`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GA4 API error: ${err}`);
  }
  return res.json() as Promise<{ rows?: { dimensionValues?: { value: string }[]; metricValues?: { value: string }[] }[] }>;
}

function rows(
  data: { rows?: { dimensionValues?: { value: string }[]; metricValues?: { value: string }[] }[] },
  dimIdx = 0,
  metricIdx = 0,
): Ga4Row[] {
  return (data.rows ?? []).map((r) => ({
    dimension: r.dimensionValues?.[dimIdx]?.value ?? "",
    metric: Number(r.metricValues?.[metricIdx]?.value ?? 0),
  }));
}

// ── main export ───────────────────────────────────────────────────────────────

export async function fetchGa4Report(days = 30): Promise<Ga4Report> {
  const config = getConfig();
  if (!config) throw new Error("GA4 not configured");

  const token = await getAccessToken(config.key);
  const { property } = config;
  const dateRange = { startDate: `${days}daysAgo`, endDate: "today" };

  // Fire all reports in parallel
  const [
    overviewData,
    pageViewsData,
    sourcesData,
    devicesData,
    countriesData,
    engagementData,
    eventsData,
    hourlyData,
    newReturnData,
    landingPagesData,
    pageFlowData,
  ] = await Promise.all([
    // Overview totals
    runReport(property, token, {
      dateRanges: [dateRange],
      metrics: [
        { name: "totalUsers" },
        { name: "sessions" },
        { name: "screenPageViews" },
      ],
    }),
    // Page views by path
    runReport(property, token, {
      dateRanges: [dateRange],
      dimensions: [{ name: "pagePath" }],
      metrics: [{ name: "screenPageViews" }],
      limit: 20,
      orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
    }),
    // Traffic sources
    runReport(property, token, {
      dateRanges: [dateRange],
      dimensions: [{ name: "sessionSource" }],
      metrics: [{ name: "sessions" }],
      limit: 10,
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
    }),
    // Device breakdown
    runReport(property, token, {
      dateRanges: [dateRange],
      dimensions: [{ name: "deviceCategory" }],
      metrics: [{ name: "sessions" }],
    }),
    // Countries
    runReport(property, token, {
      dateRanges: [dateRange],
      dimensions: [{ name: "country" }],
      metrics: [{ name: "sessions" }],
      limit: 8,
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
    }),
    // Avg engagement time per page
    runReport(property, token, {
      dateRanges: [dateRange],
      dimensions: [{ name: "pagePath" }],
      metrics: [{ name: "averageSessionDuration" }],
      limit: 15,
      orderBys: [{ metric: { metricName: "averageSessionDuration" }, desc: true }],
    }),
    // Custom event counts
    runReport(property, token, {
      dateRanges: [dateRange],
      dimensions: [{ name: "eventName" }],
      metrics: [{ name: "eventCount" }],
      limit: 20,
      orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
    }),
    // Hourly distribution (hour of day)
    runReport(property, token, {
      dateRanges: [dateRange],
      dimensions: [{ name: "hour" }],
      metrics: [{ name: "sessions" }],
    }),
    // New vs returning
    runReport(property, token, {
      dateRanges: [dateRange],
      dimensions: [{ name: "newVsReturning" }],
      metrics: [{ name: "sessions" }],
    }),
    // Landing pages (first page of each session)
    runReport(property, token, {
      dateRanges: [dateRange],
      dimensions: [{ name: "landingPage" }],
      metrics: [{ name: "sessions" }],
      limit: 15,
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
    }),
    // Bounce rate by landing page
    runReport(property, token, {
      dateRanges: [dateRange],
      dimensions: [{ name: "landingPage" }],
      metrics: [{ name: "bounceRate" }, { name: "sessions" }],
      limit: 15,
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
    }),
  ]);

  // Parse overview row
  const overviewRow = overviewData.rows?.[0];
  const totalUsers = Number(overviewRow?.metricValues?.[0]?.value ?? 0);
  const totalSessions = Number(overviewRow?.metricValues?.[1]?.value ?? 0);
  const totalPageViews = Number(overviewRow?.metricValues?.[2]?.value ?? 0);

  // New vs returning
  const nvr = { new: 0, returning: 0 };
  for (const r of newReturnData.rows ?? []) {
    const dim = r.dimensionValues?.[0]?.value ?? "";
    const val = Number(r.metricValues?.[0]?.value ?? 0);
    if (dim === "new") nvr.new = val;
    else nvr.returning = val;
  }

  // Case study views (paths starting with /work/)
  const allPageViews = rows(pageViewsData);
  const caseStudyViews = allPageViews.filter((r) =>
    r.dimension.startsWith("/work/") && r.dimension !== "/work/",
  );

  // Hourly distribution
  const hourlyDistribution: { hour: number; sessions: number }[] = Array.from(
    { length: 24 },
    (_, i) => ({ hour: i, sessions: 0 }),
  );
  for (const r of hourlyData.rows ?? []) {
    const hour = Number(r.dimensionValues?.[0]?.value ?? 0);
    hourlyDistribution[hour].sessions = Number(r.metricValues?.[0]?.value ?? 0);
  }

  // Avg engagement
  const avgEngagementByPath = (engagementData.rows ?? []).map((r) => ({
    path: r.dimensionValues?.[0]?.value ?? "",
    seconds: Math.round(Number(r.metricValues?.[0]?.value ?? 0)),
  }));

  const landingBounceRates = (pageFlowData.rows ?? []).map((r) => ({
    page: r.dimensionValues?.[0]?.value ?? "",
    bounceRate: Math.round(Number(r.metricValues?.[0]?.value ?? 0) * 100),
    sessions: Number(r.metricValues?.[1]?.value ?? 0),
  }));

  return {
    totalUsers,
    totalSessions,
    totalPageViews,
    newVsReturning: nvr,
    pageViewsByPath: allPageViews,
    topSources: rows(sourcesData),
    deviceSplit: rows(devicesData),
    topCountries: rows(countriesData),
    caseStudyViews,
    avgEngagementByPath,
    eventCounts: rows(eventsData),
    hourlyDistribution,
    landingPages: rows(landingPagesData),
    landingBounceRates,
  };
}
