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
  /** Optional external link shown next to the label in the lightbox as a
   *  small "{linkLabel} →" affordance. The arrow nudges right on hover. */
  link?: string;
  /** Label shown next to the title for the link. Defaults to "Visit". */
  linkLabel?: string;
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
const ITEMS: Omit<CraftItem, "id">[] = [
  { src: c("ebb-insights.png"), label: "Ebb & Flow (design-a-thon project) Insights page", date: "2026" },
  { src: c("ebb-river.mov"), label: "Ebb & Flow (design-a-thon project) river visualization", date: "2026" },
  { src: c("ebb-home.png"), label: "Ebb & Flow (design-a-thon project) account selection page", date: "2026" },
  { src: c("ebb-login.mov"), label: "Ebb & Flow (design-a-thon project) login animation", date: "2026" },
  { src: c("ebb-settings.png"), label: "Ebb & Flow (design-a-thon project) Settings page", date: "2026" },

  {
    src: c("iwater-pair.png"),
    label: "iWater and Apple Cup",
    date: "2022",
    link: "https://iwater.clementroze.com",
    linkLabel: "Visit iWater",
  },
  {
    src: c("iwater-sizes.png"),
    label: "iWater sizes",
    date: "2022",
    link: "https://iwater.clementroze.com",
    linkLabel: "Visit iWater",
  },
  {
    src: c("iwater-touch.png"),
    label: "iWater TouchID",
    date: "2022",
    link: "https://iwater.clementroze.com",
    linkLabel: "Visit iWater",
  },
  {
    src: c("iwater-landing.png"),
    label: "iWater branding",
    date: "2022",
    link: "https://iwater.clementroze.com",
    linkLabel: "Visit iWater",
  },
  {
    src: c("iwater-cups.png"),
    label: "iWater Apple Cup",
    date: "2022",
    link: "https://iwater.clementroze.com",
    linkLabel: "Visit iWater",
  },
  {
    src: c("iwater-w1.png"),
    label: "iWater W1 Chip",
    date: "2022",
    link: "https://iwater.clementroze.com",
    linkLabel: "Visit iWater",
  },

  {
    src: c("deadline-promo.png"),
    label: "Deadline wordmark",
    date: "2024",
    link: "https://www.roblox.com/games/12144402492/Deadline",
    linkLabel: "Play Deadline",
  },
  {
    src: c("deadline-grid.png"),
    label: "Deadline interface",
    date: "2024",
    link: "https://www.roblox.com/games/12144402492/Deadline",
    linkLabel: "Play Deadline",
  },
  {
    src: c("deadline-stats.png"),
    label: "Deadline match stats screen",
    date: "2024",
    link: "https://www.roblox.com/games/12144402492/Deadline",
    linkLabel: "Play Deadline",
  },
  {
    src: c("deadline-picker.png"),
    label: "Deadline gamemode picker",
    date: "2024",
    link: "https://www.roblox.com/games/12144402492/Deadline",
    linkLabel: "Play Deadline",
  },
  {
    src: c("deadline-won.png"),
    label: "Deadline results screen",
    date: "2024",
    link: "https://www.roblox.com/games/12144402492/Deadline",
    linkLabel: "Play Deadline",
  },
  {
    src: c("deadline-quests.png"),
    label: "Deadline quests",
    date: "2024",
    link: "https://www.roblox.com/games/12144402492/Deadline",
    linkLabel: "Play Deadline",
  },
  {
    src: c("deadline-editor.png"),
    label: "Deadline editor",
    date: "2024",
    link: "https://www.roblox.com/games/12144402492/Deadline",
    linkLabel: "Play Deadline",
  },

  {
    src: c("erased.png"),
    label: "Erased",
    date: "2026",
    link: "https://erased.clementroze.com",
    linkLabel: "Visit website",
  },

  {
    src: c("archive.png"),
    label: "Website Archive",
    date: "2026",
    link: "https://archive.clementroze.com",
    linkLabel: "Visit website",
  },

  { src: c("hyperform-design.png"), label: "Hyperform design system", date: "2023" },
  { src: c("hyperform-login.png"), label: "Hyperform login", date: "2023" },
  { src: c("hyperform-listing.png"), label: "Hyperform listing flow", date: "2023" },

  { src: c("souvenir-nav.png"), label: "Souvenir button components", date: "2025" },
  { src: c("souvenir-trio.png"), label: "Souvenir trio", date: "2025" },
  { src: c("souvenir-duo.png"), label: "Souvenir duo", date: "2025" },
  { src: c("souvenir-buttons.png"), label: "Souvenir more buttons", date: "2025" },
  { src: c("souvenir-login.png"), label: "Souvenir login", date: "2025" },
  { src: c("souvenir-cam.png"), label: "Souvenir camera", date: "2025" },
  { src: c("souvenir-list.png"), label: "Souvenir homepage", date: "2025" },

  { src: c("dti-cta.png"), label: "DTI footer", date: "2025" },
  { src: c("dti-team.png"), label: "DTI team hero section", date: "2025" },
  { src: c("dti-role.png"), label: "DTI roles section", date: "2025" },
  { src: c("dti-404.png"), label: "DTI 404 page", date: "2025" },

  { src: c("roze-team.png"), label: "Dr. Roze team page", date: "2024" },
  { src: c("roze-slide1.png"), label: "Roze BioHealth branding slide", date: "2024" },
  { src: c("roze-faq.png"), label: "Dr. Roze FAQ page", date: "2024" },
  { src: c("roze-checkout.png"), label: "Dr. Roze checkout page", date: "2024" },
  { src: c("roze-slide2.png"), label: "Roze BioHealth branding slide", date: "2024" },
  { src: c("roze-slide3.png"), label: "Roze BioHealth branding slide", date: "2024" },
  { src: c("roze-slide4.png"), label: "Roze BioHealth branding slide", date: "2024" },

  { src: c("replit-ide.png"), label: "Replit IDE marketing page", date: "2024" },
  { src: c("replit-simple.png"), label: "Replit IDE marketing page", date: "2024" },
  { src: c("replit-blog.png"), label: "Replit Blog", date: "2024" },
  { src: c("replit-community.png"), label: "Replit community marketing page", date: "2024" },
  { src: c("replit-stay.png"), label: "Replit community marketing page", date: "2024" },

  { src: c("ebr.png"), label: "Electric Buffalo Records", date: "2026" ,  
       link: "https://www.electricbuffalorecords.com/",
 linkLabel: "Visit website",},
  { src: c("wvbr-home.png"), label: "Cornell Media Guild home", date: "2025" ,   link: "https://www.electricbuffalorecords.com/",
 linkLabel: "Visit website",},
  { src: c("wvbr-shows.png"), label: "Cornell Media Guild shows", date: "2025" ,   link: "https://www.electricbuffalorecords.com/",
 linkLabel: "Visit website",},
  { src: c("wvbr-support.png"), label: "Cornell Media Guild donate", date: "2025" ,   link: "https://www.electricbuffalorecords.com/",
 linkLabel: "Visit website",},
  { src: c("wvbr-about.png"), label: "Cornell Media Guild about dialog", date: "2025" ,   link: "https://www.electricbuffalorecords.com/",
 linkLabel: "Visit website",},

  { src: c("monarcha.png"), label: "Monarcha website", date: "2025" },
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
