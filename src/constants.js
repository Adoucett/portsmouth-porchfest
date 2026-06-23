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
  email: 'portsmouthporchfest@gmail.com',
  instagram: 'https://www.instagram.com/portsmouthporchfest/',
  facebook: 'https://www.facebook.com/portsmouthporchfest/',
  signupForm:
    'https://docs.google.com/forms/d/e/1FAIpQLSc3m2paZDEtw5PzQr0APthKPxy1xdv5KQzMos1bKLB38Q74-g/viewform',
  volunteerForm:
    'https://www.signupgenius.com/go/10C0E4EA4AB2BA0FAC52-57534585-porchfest#/',
  parking:
    'On-street parking throughout the neighborhoods. All venues are within a short walk of one another.',
  // Next year's tentative date, shown after the event ends.
  nextYearLabel: 'See you next year — September 18, 2027',
};

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

// Static info-booth markers (not pulled from the sheet). Coordinates are
// placeholders — update with real booth locations before launch.
export const INFO_BOOTHS = [
  { name: 'Zone 1 Info Booth', coords: [-70.7644, 43.0731], note: 'Richards Ave · 11:30–2pm' },
  { name: 'Zone 2 Info Booth', coords: [-70.7598, 43.0754], note: 'Wibird St · 1:30–4pm' },
  { name: 'Zone 3 Info Booth', coords: [-70.7621, 43.0712], note: 'Goodwin Park · 3:30–6pm' },
];

// Map defaults centered on Portsmouth, NH.
export const MAP_DEFAULTS = {
  center: [-70.760873, 43.071629],
  zoom: 14.71,
  minZoom: 12,
  maxZoom: 18,
  // Lock panning to a box around Portsmouth so the map can never wander off
  // to another part of the world. [ [swLng, swLat], [neLng, neLat] ].
  maxBounds: [
    [-70.82, 43.03],
    [-70.69, 43.11],
  ],
  style: 'mapbox://styles/adoucett/cm6fvb62v005s01s50vq64sb6',
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

// Public Google Sheet — published CSV export URL.
// Julia updates the sheet; the map auto-refreshes on next page load. No deploys needed.
export const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ8iEZ_CcqThjS2ty2-BQMIjpSpMmFTF31A71dKzlIj6C2h85cPHWsQcZtWP1bEZ5ansx889225qXxi/pub?output=csv';

// FAQ content. Replace/expand with the organizers' real answers.
export const FAQ = [
  {
    q: 'What is Porchfest?',
    a: 'A free, community-run music festival where local bands perform on porches, lawns, and stoops across Portsmouth neighborhoods. Wander, listen, and discover new music.',
  },
  {
    q: 'When and where is it?',
    a: 'Saturday, September 19, 2026, from 12:00 to 6:00 PM across three neighborhood zones in Portsmouth, NH. Use the live map to find performers.',
  },
  {
    q: 'How much does it cost?',
    a: 'Nothing. Porchfest is free and open to everyone. Donations help keep it going, but admission is always free.',
  },
  {
    q: 'How do the zones and times work?',
    a: 'Performances are grouped into three zones, each with its own time block, so you can walk from porch to porch as the afternoon unfolds.',
  },
  {
    q: 'Where do I park?',
    a: 'On-street parking is available throughout the neighborhoods. Everything is within a short walk, so park once and explore on foot.',
  },
  {
    q: 'Is it family- and dog-friendly?',
    a: 'Yes! Bring the kids, bring the dog, bring a folding chair. Please be respectful of porches, lawns, and neighbors.',
  },
  {
    q: 'What if it rains?',
    a: 'Porchfest happens rain or shine. Check our Instagram for any weather updates close to the day.',
  },
  {
    q: 'How can my band play?',
    a: 'Performer signups happen through our online form. Spots are limited and fill up — sign up early.',
  },
  {
    q: 'How can I volunteer?',
    a: 'We rely on volunteers for setup, info booths, and zone hosting. Sign up through our volunteer link and we will be in touch.',
  },
];
