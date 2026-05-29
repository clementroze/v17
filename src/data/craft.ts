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
// Supported: images (.png/.png/.webp/.gif) and videos (.mp4/.mov/.webm/.ogg).
const c = (filename: string) => `/craft/${filename}`;

export const COL_A: CraftItem[] = [
  {
    id: "a1",
    src: c("ebb-insights.png"),
    label: "Onboarding flow",
    date: "2024",
  },
  { id: "a2", src: c("ebb-login.mov"), label: "Wireframes", date: "2024" },
  { id: "a3", src: c("iwater-sizes.png"), label: "Dashboard", date: "2024" },
  { id: "a4", src: c("iwater-cups.png"), label: "Travel app", date: "2023" },
  { id: "a5", src: c("deadline-grid.png"), label: "Web layout", date: "2024" },
  { id: "a6", src: c("deadline-won.png"), label: "Web layout", date: "2024" },
  {
    id: "a7",
    src: c("deadline-editor.png"),
    label: "Web layout",
    date: "2024",
  },
  {
    id: "a8",
    src: c("hyperform-listing.png"),
    label: "Web layout",
    date: "2024",
  },
  { id: "a9", src: c("souvenir-duo.png"), label: "Components", date: "2023" },
  { id: "a10", src: c("souvenir-cam.png"), label: "Components", date: "2023" },
];

export const COL_B: CraftItem[] = [
  {
    id: "b1",
    src: c("ebb-river.mov"),
    label: "Design system",
    date: "2024",
  },
  { id: "b2", src: c("iwater-pair.png"), label: "Sketching", date: "2023" },
  { id: "b3", src: c("iwater-touch.png"), label: "iOS screens", date: "2024" },
  { id: "b4", src: c("deadline-promo.png"), label: "Card grid", date: "2024" },
  { id: "b5", src: c("deadline-stats.png"), label: "Components", date: "2023" },
  {
    id: "b6",
    src: c("hyperform-design.png"),
    label: "Components",
    date: "2023",
  },
  {
    id: "b7",
    src: c("souvenir-buttons.png"),
    label: "Components",
    date: "2023",
  },
  { id: "b8", src: c("souvenir-nav.png"), label: "Components", date: "2023" },
  { id: "b9", src: c("souvenir-duo.png"), label: "Components", date: "2023" },
];

export const COL_C: CraftItem[] = [
  { id: "c1", src: c("ebb-home.png"), label: "Workspace", date: "2024" },
  { id: "c2", src: c("ebb-settings.png"), label: "Editor UI", date: "2024" },
  { id: "c3", src: c("iwater-landing.png"), label: "Code view", date: "2023" },
  { id: "c4", src: c("iwater-w1.png"), label: "Devtools", date: "2024" },
  { id: "c5", src: c("deadline-picker.png"), label: "Devtools", date: "2024" },
  { id: "c6", src: c("deadline-quests.png"), label: "Devtools", date: "2024" },
  { id: "c7", src: c("hyperform-login.png"), label: "Devtools", date: "2024" },
  { id: "c8", src: c("souvenir-trio.png"), label: "Devtools", date: "2024" },
  { id: "c9", src: c("souvenir-login.png"), label: "Devtools", date: "2024" },
  { id: "c10", src: c("souvenir-list.png"), label: "Devtools", date: "2024" },
];

// Flattened, ordered list used by the lightbox for navigation
export const CRAFT_ITEMS: CraftItem[] = [...COL_A, ...COL_B, ...COL_C];
