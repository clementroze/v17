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
// Supported: images (.jpg/.png/.webp/.gif) and videos (.mp4/.mov/.webm/.ogg).
const c = (filename: string) => `/craft/${filename}`;

export const COL_A: CraftItem[] = [
  {
    id: "a1",
    src: c("ebb-insights.png"),

    label: "Onboarding flow",
    date: "2024",
  },
  { id: "a2", src: c("ebb-login.mov"), label: "Wireframes", date: "2024" },
  { id: "a3", src: c("dashboard.jpg"), label: "Dashboard", date: "2024" },
  { id: "a4", src: c("travel-app.jpg"), label: "Travel app", date: "2023" },
  { id: "a5", src: c("web-layout.jpg"), label: "Web layout", date: "2024" },
];

export const COL_B: CraftItem[] = [
  {
    id: "b1",
    src: c("ebb-river.mov"),
    label: "Design system",
    date: "2024",
  },
  { id: "b2", src: c("sketching.jpg"), label: "Sketching", date: "2023" },
  { id: "b3", src: c("ios-screens.jpg"), label: "iOS screens", date: "2024" },
  { id: "b4", src: c("card-grid.jpg"), label: "Card grid", date: "2024" },
  { id: "b5", src: c("components.jpg"), label: "Components", date: "2023" },
];

export const COL_C: CraftItem[] = [
  { id: "c1", src: c("ebb-home.png"), label: "Workspace", date: "2024" },
  { id: "c2", src: c("ebb-settings.png"), label: "Editor UI", date: "2024" },
  { id: "c3", src: c("code-view.jpg"), label: "Code view", date: "2023" },
  { id: "c4", src: c("devtools.jpg"), label: "Devtools", date: "2024" },
];

// Flattened, ordered list used by the lightbox for navigation
export const CRAFT_ITEMS: CraftItem[] = [...COL_A, ...COL_B, ...COL_C];
