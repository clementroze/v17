export type CraftItem = {
  id: string;
  src?: string;
  alt?: string;
  // Image aspect ratio expressed as width / height.
  // This is only used as a placeholder until the real image loads — the actual
  // rendered aspect ratio is taken from the image's natural dimensions.
  aspect: number;
  label: string;
  date: string;
};

// All craft images live in `public/craft/`. Drop a file named to match the
// `src` path below and it will appear in the grid automatically (no rebuild
// needed in dev). Any extension works — just update the path here to match.
const c = (filename: string) => `/craft/${filename}`;

export const COL_A: CraftItem[] = [
  {
    id: "a1",
    aspect: 3 / 2,
    src: c("onboarding-flow.jpg"),
    alt: "Onboarding flow",
    label: "Onboarding flow",
    date: "2024",
  },
  {
    id: "a2",
    aspect: 4 / 5,
    src: c("wireframes.jpg"),
    alt: "Wireframe sketches",
    label: "Wireframes",
    date: "2024",
  },
  {
    id: "a3",
    aspect: 1,
    src: c("dashboard.jpg"),
    alt: "Dashboard UI",
    label: "Dashboard",
    date: "2024",
  },
  {
    id: "a4",
    aspect: 2 / 3,
    src: c("travel-app.jpg"),
    alt: "Travel app",
    label: "Travel app",
    date: "2023",
  },
  {
    id: "a5",
    aspect: 16 / 9,
    src: c("web-layout.jpg"),
    alt: "Web layout",
    label: "Web layout",
    date: "2024",
  },
];

export const COL_B: CraftItem[] = [
  {
    id: "b1",
    aspect: 4 / 5,
    src: c("design-system.jpg"),
    alt: "Design system",
    label: "Design system",
    date: "2024",
  },
  {
    id: "b2",
    aspect: 3 / 4,
    src: c("sketching.jpg"),
    alt: "Sketching",
    label: "Sketching",
    date: "2023",
  },
  {
    id: "b3",
    aspect: 1,
    src: c("ios-screens.jpg"),
    alt: "iOS screens",
    label: "iOS screens",
    date: "2024",
  },
  {
    id: "b4",
    aspect: 1,
    src: c("card-grid.jpg"),
    alt: "Card grid",
    label: "Card grid",
    date: "2024",
  },
  {
    id: "b5",
    aspect: 1,
    src: c("components.jpg"),
    alt: "Components",
    label: "Components",
    date: "2023",
  },
];

export const COL_C: CraftItem[] = [
  {
    id: "c1",
    aspect: 2 / 3,
    src: c("workspace.jpg"),
    alt: "Workspace",
    label: "Workspace",
    date: "2024",
  },
  {
    id: "c2",
    aspect: 4 / 5,
    src: c("editor-ui.jpg"),
    alt: "Editor UI",
    label: "Editor UI",
    date: "2024",
  },
  {
    id: "c3",
    aspect: 4 / 3,
    src: c("code-view.jpg"),
    alt: "Code view",
    label: "Code view",
    date: "2023",
  },
  {
    id: "c4",
    aspect: 4 / 3,
    src: c("devtools.jpg"),
    alt: "Devtools",
    label: "Devtools",
    date: "2024",
  },
];

// Flattened, ordered list used by the lightbox for navigation
export const CRAFT_ITEMS: CraftItem[] = [...COL_A, ...COL_B, ...COL_C];
