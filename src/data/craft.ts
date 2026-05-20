export type CraftItem = {
  id: string;
  src?: string;
  alt?: string;
  // Image aspect ratio expressed as width / height.
  aspect: number;
  label: string;
  date: string;
};

// Deterministic Unsplash photo URLs — UI / product design / app shots.
const u = (id: string, w = 900) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

export const COL_A: CraftItem[] = [
  {
    id: "a1",
    aspect: 3 / 2,
    src: u("1559028012-481c04fa702d"),
    alt: "Mobile UI on phone",
    label: "Onboarding flow",
    date: "2024",
  },
  {
    id: "a2",
    aspect: 4 / 5,
    src: u("1581291518857-4e27b48ff24e", 800),
    alt: "Wireframe sketches",
    label: "Wireframes",
    date: "2024",
  },
  {
    id: "a3",
    aspect: 1,
    src: u("1611224923853-80b023f02d71"),
    alt: "Dashboard UI",
    label: "Dashboard",
    date: "2024",
  },
  {
    id: "a4",
    aspect: 2 / 3,
    src: u("1512941937669-90a1b58e7e9c", 800),
    alt: "Phone mockup",
    label: "Travel app",
    date: "2023",
  },
  {
    id: "a5",
    aspect: 16 / 9,
    src: u("1551650975-87deedd944c3"),
    alt: "App design on screen",
    label: "Web layout",
    date: "2024",
  },
];

export const COL_B: CraftItem[] = [
  {
    id: "b1",
    aspect: 4 / 5,
    src: u("1555421689-491a97ff2040"),
    alt: "Design system tokens",
    label: "Design system",
    date: "2024",
  },
  {
    id: "b2",
    aspect: 3 / 4,
    src: u("1517292987719-0369a794ec0f"),
    alt: "Sketching interface",
    label: "Sketching",
    date: "2023",
  },
  {
    id: "b3",
    aspect: 1,
    src: u("1545235617-9465d2a55698"),
    alt: "Mobile app screens",
    label: "iOS screens",
    date: "2024",
  },
  {
    id: "b4",
    aspect: 1,
    src: u("1572177812156-58036aae439c"),
    alt: "Web UI cards",
    label: "Card grid",
    date: "2024",
  },
  {
    id: "b5",
    aspect: 1,
    src: u("1559028006-448665bd7c7f"),
    alt: "Components on screen",
    label: "Components",
    date: "2023",
  },
];

export const COL_C: CraftItem[] = [
  {
    id: "c1",
    aspect: 2 / 3,
    src: u("1551434678-e076c223a692", 800),
    alt: "Designer at work",
    label: "Workspace",
    date: "2024",
  },
  {
    id: "c2",
    aspect: 4 / 5,
    src: u("1481349518771-20055b2a7b24"),
    alt: "UI on laptop",
    label: "Editor UI",
    date: "2024",
  },
  {
    id: "c3",
    aspect: 4 / 3,
    src: u("1499951360447-b19be8fe80f5"),
    alt: "Code on screen",
    label: "Code view",
    date: "2023",
  },
  {
    id: "c4",
    aspect: 4 / 3,
    src: u("1587620962725-abab7fe55159"),
    alt: "Devtools",
    label: "Devtools",
    date: "2024",
  },
];

// Flattened, ordered list used by the lightbox for navigation
export const CRAFT_ITEMS: CraftItem[] = [...COL_A, ...COL_B, ...COL_C];
