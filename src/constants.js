// Single source of truth for festival facts. Update these once a year.

export const FESTIVAL = {
  name: 'Portsmouth Porchfest',
  year: 2026,
  // Local festival times. EDT is UTC-4 in September.
  date: new Date('2026-09-19T12:00:00-04:00'),
  end: new Date('2026-09-19T18:00:00-04:00'),
  dateLabel: 'Saturday, September 19, 2026',
  timeLabel: '12:00 – 6:00 PM',
  location: 'Portsmouth, NH',
  email: 'hello@portsmouthporchfest.com',
  instagram: 'https://www.instagram.com/portsmouthporchfest/',
  facebook: 'https://www.facebook.com/portsmouthporchfest/',
  // Live Google Form — musicians, hosts, volunteers, steering committee interest.
  // Same form for all signup paths (SteerCo included).
  interestForm:
    'https://docs.google.com/forms/d/e/1FAIpQLSc3m2paZDEtw5PzQr0APthKPxy1xdv5KQzMos1bKLB38Q74-g/viewform',
  interestFormEmbed:
    'https://docs.google.com/forms/d/e/1FAIpQLSc3m2paZDEtw5PzQr0APthKPxy1xdv5KQzMos1bKLB38Q74-g/viewform?embedded=true',
  // Aliases used by existing links across the site
  signupForm:
    'https://docs.google.com/forms/d/e/1FAIpQLSc3m2paZDEtw5PzQr0APthKPxy1xdv5KQzMos1bKLB38Q74-g/viewform',
  volunteerForm:
    'https://docs.google.com/forms/d/e/1FAIpQLSc3m2paZDEtw5PzQr0APthKPxy1xdv5KQzMos1bKLB38Q74-g/viewform',
  parking:
    'Park at the Masonic Temple lot or use on-street parking. All performance spaces are within a 15-minute walk of one another — we encourage walking or biking between sites.',
  // Next year's tentative date, shown after the event ends.
  nextYearLabel: 'See you next year — September 18, 2027',
};

// Current-year theme metadata. Drives the "This Year" page and makes the yearly
// rollover a one-stop edit: bump the year, swap the asset folder + Adobe kit,
// relabel the nav item. The evergreen base never changes.
export const THEME = {
  year: 2026,
  label: '2026',
  title: 'The Porch Ship',
  tagline: 'A free-sailing music festival washing over Portsmouth’s neighborhoods.',
  // Attendee tips shown as the "How to PorchFest" list.
  howTo: [
    'Take public transit when you can',
    'Plan your porch route ahead of time',
    'Enjoy the non-alcoholic food & drink',
    'Use the sidewalks — keep streets clear for safety',
    'Be considerate of neighbors and their yards',
  ],
  // The organizers' goal for the year (from the Linktree).
  goal: '40 porches and 80+ performances.',
  // Instagram (primary): free Mirror App auto-feed embed. Paste the feed URL from
  // mirror-app.com; it renders the latest posts in an auto-resizing iframe.
  instagramEmbedUrl:
    'https://app.mirror-app.com/feed-instagram/4985d2df-3ac8-49cd-92bf-6d7e5e53017f/preview',
  // Fallback: official, free IG post-embed permalinks (used only if no embed URL).
  // Also overridable from the sheet's "instagram" tab. Empty → a Follow CTA shows.
  instagramPosts: [],
  typekitId: 'tkh3pir', // Adobe Fonts kit → juniper-std
  artist: {
    name: 'Chad Turner',
    handle: '@muzzythewop',
    instagram: 'https://www.instagram.com/muzzythewop/',
  },
  // Map theming for the year. `mapStyle` is the Mapbox Studio style; swap it for
  // a fully maritime/nautical-chart style here next time. `mapWaterTint` is a
  // light, runtime harbor-blue nudge applied to the style's water layers as a
  // proof-of-concept (set to null to disable).
  mapStyle: 'mapbox://styles/adoucett/cm6fvb62v005s01s50vq64sb6',
  mapWaterTint: '#a7c6d6',
};

// "Latest updates" microposts on the This Year page (newest first).
//
// PUBLISHING (no code): in the master sheet, add a tab named exactly "updates"
// with the column headers: date, headline, body. New rows appear on the site on
// next load. Read live by tab name via the gviz CSV endpoint (the doc just needs
// link-sharing = "Anyone with the link: Viewer"). Until the tab exists, the
// fetch returns no usable rows and the static ANNOUNCEMENTS fallback is shown.
export const SHEET_ANNOUNCEMENTS_CSV_URL =
  'https://docs.google.com/spreadsheets/d/1y9lyzBSTLm2IMGUn0z2x9ZGi900ndmdzkX7X52jogeg/gviz/tq?tqx=out:csv&sheet=updates';

// Instagram post embeds (no-code): add a tab named "instagram" with a column
// "url" and paste post permalinks (https://www.instagram.com/p/XXXX/), one per
// row. They render as official IG embeds. Falls back to THEME.instagramPosts,
// then to a Follow CTA. Add the tab to the master doc; until then, nothing breaks.
export const SHEET_INSTAGRAM_CSV_URL =
  'https://docs.google.com/spreadsheets/d/1y9lyzBSTLm2IMGUn0z2x9ZGi900ndmdzkX7X52jogeg/gviz/tq?tqx=out:csv&sheet=instagram';

export const ANNOUNCEMENTS = [
  {
    date: 'Save the date',
    headline: 'Saturday, September 19, 2026',
    body: 'Noon to 6 PM across three Portsmouth neighborhoods — Richards Ave, Wibird St, and Goodwin Park.',
  },
  {
    date: 'Artwork',
    headline: 'The 2026 poster has landed',
    body: 'Original art by Chad Turner (@muzzythewop) — the Porch Ship sets the tone for the year.',
  },
  {
    date: 'Signups open',
    headline: 'Play, host, or volunteer',
    body: 'Musician, porch-host, and volunteer signups are open — one quick form covers all three.',
  },
  {
    date: 'Lineup',
    headline: 'Performers rolling in',
    body: 'Acts are being confirmed and added to the live map as they come in. Check back often.',
  },
];

// Zone definitions drive the schedule, the filter pills, and marker colors.
// `color` should match the Mapbox style if you build a custom one in Studio.
export const ZONES = [
  {
    id: '1',
    name: 'Zone 1',
    neighborhood: 'Richards Ave',
    time: '12:00 – 2:00 PM',
    color: '#C4622D', // warm terracotta
  },
  {
    id: '2',
    name: 'Zone 2',
    neighborhood: 'Wibird St',
    time: '2:00 – 4:00 PM',
    color: '#3D6B4F', // sage green
  },
  {
    id: '3',
    name: 'Zone 3',
    neighborhood: 'Goodwin Park',
    time: '4:00 – 6:00 PM',
    color: '#2B4A7A', // deep blue
  },
];

export const ZONE_COLORS = ZONES.reduce((acc, z) => {
  acc[z.id] = z.color;
  return acc;
}, {});

// Fallback color for rows whose `zone` value doesn't match a known zone.
export const DEFAULT_MARKER_COLOR = '#8C8577';

// Static info-booth markers (not pulled from the sheet). Tentative locations
// from the 2026 FAQ — confirm before launch.
export const INFO_BOOTHS = [
  { name: 'Zone 1 Info Booth', coords: [-70.759317, 43.071155], note: 'Richards Ave · 334 Parrott Ave · 11:30am–2pm' },
  { name: 'Zone 2 Info Booth', coords: [-70.763342, 43.067063], note: 'Wibird St · 496 Lincoln Ave · 1:30–4pm' },
  { name: 'Zone 3 Info Booth', coords: [-70.765177, 43.072952], note: 'Goodwin Park · 781 State St · 3:30–6pm' },
];

// Map defaults centered on Portsmouth, NH.
export const MAP_DEFAULTS = {
  center: [-70.760873, 43.071629],
  zoom: 14.71,
  minZoom: 13,
  maxZoom: 18,
  // Lock panning to a box around Portsmouth so the map can never wander off
  // to another part of the world. [ [swLng, swLat], [neLng, neLat] ].
  maxBounds: [
    [-70.82, 43.03],
    [-70.69, 43.11],
  ],
  style: THEME.mapStyle,
};

// Homepage copy (from the organizers). Edit freely.
export const ABOUT = {
  whatWeAre:
    'Portsmouth Porchfest is a free grassroots music festival that takes place in our neighborhoods once a year and features music by a diverse array of local musicians performing in many genres.',
  mission:
    'To strengthen the Portsmouth community, build connections between neighbors, and provide exposure for local artists from a diverse array of backgrounds.',
  vision:
    'To create a community that is connected, inspired, and transformed by the music shared and the fellowship enjoyed by every one of us.',
};

// Mapbox access token, injected at build time from VITE_MAPBOX_TOKEN (Vercel
// env var for deploys, local .env for dev). NOTE: GitHub push-protection blocks
// committing the literal token, so it must stay in env vars — keep it set for
// Production + Preview in Vercel. `pk.*` tokens are publishable; secure with URL
// restrictions in the Mapbox dashboard rather than secrecy.
export const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';

// Master Google Sheet (doc 1y9ly...). Read the "live" tab BY NAME via the gviz
// CSV endpoint so we always pull live (never the "draft" tab) from the one doc
// the organizers edit. The map auto-refreshes on next page load — no deploys.
// Requires the doc to be link-shared as Viewer ("Anyone with the link").
export const SHEET_CSV_URL =
  'https://docs.google.com/spreadsheets/d/1y9lyzBSTLm2IMGUn0z2x9ZGi900ndmdzkX7X52jogeg/gviz/tq?tqx=out:csv&sheet=live';

// FAQ content drawn from the organizers' 2026 FAQ. Keep answers in sync with the
// committee's master doc.
export const FAQ = [
  {
    q: 'What is Porchfest?',
    a: 'Porchfest is an outdoor music festival that places bands in unconventional performance spaces — porches, backyards, and driveways. Attendees walk the neighborhoods and hear a variety of local and regional performers.',
  },
  {
    q: 'When and where is it?',
    a: 'Saturday, September 19, 2026, from 12:00 to 6:00 PM. We have about 30 performance spaces across three neighborhoods in Portsmouth, NH. Use the live map to find performers.',
  },
  {
    q: 'How do the zones and times work?',
    a: 'Performances are grouped into three neighborhood zones, each with its own time block — Zone 1 (Richards Ave) 12–2pm, Zone 2 (Wibird St) 2–4pm, Zone 3 (Goodwin Park) 4–6pm — so you can walk from porch to porch as the afternoon unfolds.',
  },
  {
    q: 'Do I need a ticket or pay to attend?',
    a: 'No. The event is free and open to the public. Everyone — organizers, hosts, and musicians — volunteers their time. Donations are welcome: you can show appreciation for the artists with cash or, in some cases, Venmo.',
  },
  {
    q: 'What kinds of music will I hear?',
    a: 'Local musicians and bands across a wide range of genres — folk, electronica, jazz, indie, pop rock, a cappella, soul, blues, swing, and more.',
  },
  {
    q: 'Where do I park?',
    a: 'If you must drive, park at the Masonic Temple lot or use on-street parking. All performance spaces are within a 15-minute walk of one another, so we strongly encourage walking or biking between sites.',
  },
  {
    q: 'Is there info on-site?',
    a: 'Yes — volunteers staff an information table in each neighborhood with printed schedules and maps.',
  },
  {
    q: 'Are there bathrooms?',
    a: 'Public bathrooms are available at the Portsmouth Public Library.',
  },
  {
    q: 'Will there be food or alcohol?',
    a: 'We are not selling food — please support local coffee shops and restaurants. Note that drinking alcohol on public streets is illegal in Portsmouth.',
  },
  {
    q: 'What if it rains?',
    a: 'This is a rain-or-shine event, so let’s hope for a beautiful fall day. Check our Instagram for any updates close to the day.',
  },
  {
    q: 'How can I perform or host?',
    a: 'If you live in one of our three performance zones and want to host on your porch or yard, or if you are a musician who would like to perform, fill out the Porchfest Interest Form on our Get Involved page.',
  },
  {
    q: 'How can I volunteer?',
    a: 'We rely on volunteers to serve as ushers at performance sites and to staff info booths, setup, and cleanup. Use the interest form on our Get Involved page — the same form as musicians and porch hosts.',
  },
];
