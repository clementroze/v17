export type CraftItem = {
  id: string;
  src?: string;
  alt?: string;
  // Optional initial aspect ratio (width / height) used only as a placeholder
  // to reserve layout space before the asset loads. Once the image or video
  // loads, the real natural dimensions take over, so this is just a hint.
  // Defaults to 1 (square) when omitted.
  aspect?: number;
  label: string;
  date: string;
};

// All craft assets live in `public/craft/`. Drop a file (image or video) named
// to match the `src` path below and it will appear in the grid automatically.
// Supported: images (.png/.webp/.gif) and videos (.mp4/.mov/.webm/.ogg).
const c = (filename: string) => `/craft/${filename}`;

// ── Single source of truth ──────────────────────────────────────────────────
// This is the ONLY list to maintain. Items appear in this exact order, read
// left-to-right across the grid: the page deals them out round-robin into the
// responsive columns (3 on desktop, 1 on mobile), and this same order drives
// the mobile stacking AND the lightbox prev/next navigation. To add, remove or
// reorder a card, just edit this array — no columns to balance by hand.
//
// `id` is generated automatically from the position, so you never have to set
// or keep it unique yourself.
const ITEMS: Omit<CraftItem, 'id'>[] = [
  { src: c("ebb-insights.png"), label: "Onboarding flow", date: "2024" },
  { src: c("ebb-river.mov"), label: "Design system", date: "2024" },
  { src: c("ebb-home.png"), label: "Workspace", date: "2024" },
  { src: c("ebb-login.mov"), label: "Wireframes", date: "2024" },
  { src: c("iwater-pair.png"), label: "Sketching", date: "2023" },
  { src: c("ebb-settings.png"), label: "Editor UI", date: "2024" },
  { src: c("iwater-sizes.png"), label: "Dashboard", date: "2024" },
  { src: c("iwater-touch.png"), label: "iOS screens", date: "2024" },
  { src: c("iwater-landing.png"), label: "Code view", date: "2023" },
  { src: c("iwater-cups.png"), label: "Travel app", date: "2023" },
  { src: c("deadline-promo.png"), label: "Card grid", date: "2024" },
  { src: c("iwater-w1.png"), label: "Devtools", date: "2024" },
  { src: c("deadline-grid.png"), label: "Web layout", date: "2024" },
  { src: c("deadline-stats.png"), label: "Components", date: "2023" },
  { src: c("deadline-picker.png"), label: "Devtools", date: "2024" },
  { src: c("deadline-won.png"), label: "Web layout", date: "2024" },
  { src: c("hyperform-design.png"), label: "Components", date: "2023" },
  { src: c("deadline-quests.png"), label: "Devtools", date: "2024" },
  { src: c("deadline-editor.png"), label: "Web layout", date: "2024" },
  { src: c("souvenir-buttons.png"), label: "Components", date: "2023" },
  { src: c("hyperform-login.png"), label: "Devtools", date: "2024" },
  { src: c("hyperform-listing.png"), label: "Web layout", date: "2024" },
  { src: c("souvenir-nav.png"), label: "Components", date: "2023" },
  { src: c("souvenir-trio.png"), label: "Devtools", date: "2024" },
  { src: c("souvenir-duo.png"), label: "Components", date: "2023" },
  { src: c("dti-cta.png"), label: "Components", date: "2023" },
  { src: c("souvenir-login.png"), label: "Devtools", date: "2024" },
  { src: c("souvenir-cam.png"), label: "Components", date: "2023" },
  { src: c("roze-faq.png"), label: "Components", date: "2023" },
  { src: c("souvenir-list.png"), label: "Devtools", date: "2024" },
  { src: c("dti-team.png"), label: "Components", date: "2023" },
  { src: c("roze-checkout.png"), label: "Components", date: "2023" },
  { src: c("dti-role.png"), label: "Devtools", date: "2024" },
  { src: c("dti-404.png"), label: "Components", date: "2023" },
  { src: c("replit-ide.png"), label: "Components", date: "2023" },
  { src: c("roze-team.png"), label: "Devtools", date: "2024" },
  { src: c("roze-slide1.png"), label: "Components", date: "2023" },
  { src: c("replit-simple.png"), label: "Components", date: "2023" },
  { src: c("replit-blog.png"), label: "Devtools", date: "2024" },
  { src: c("roze-slide2.png"), label: "Components", date: "2023" },
  { src: c("ebr.png"), label: "Components", date: "2023" },
  { src: c("wvbr-home.png"), label: "Devtools", date: "2024" },
  { src: c("roze-slide3.png"), label: "Components", date: "2023" },
  { src: c("wvbr-shows.png"), label: "Components", date: "2023" },
  { src: c("wvbr-support.png"), label: "Devtools", date: "2024" },
  { src: c("roze-slide4.png"), label: "Components", date: "2023" },
  { src: c("monarcha.png"), label: "Components", date: "2023" },
  { src: c("replit-community.png"), label: "Components", date: "2023" },
  { src: c("replit-stay.png"), label: "Components", date: "2023" },
  { src: c("wvbr-shows.png"), label: "Components", date: "2023" },
  { src: c("wvbr-shows.png"), label: "Components", date: "2023" },
  { src: c("wvbr-about.png"), label: "Components", date: "2023" },
];

// Ordered list used everywhere (grid distribution, mobile stacking, lightbox).
export const CRAFT_ITEMS: CraftItem[] = ITEMS.map((item, i) => ({
  id: `craft-${i + 1}`,
  ...item,
}));

// Deal the ordered items out across `columnCount` masonry columns, round-robin
// (item 0 → col 0, item 1 → col 1, … wrapping around). With one column you get
// the flat order back, so mobile and the lightbox stay in sync with the grid.
export function distributeIntoColumns(
  items: CraftItem[],
  columnCount: number,
): CraftItem[][] {
  const cols: CraftItem[][] = Array.from({ length: columnCount }, () => []);
  items.forEach((item, i) => {
    cols[i % columnCount].push(item);
  });
  return cols;
}
