// Design-time fallback lineup for the map. The LIVE published Google Sheet
// (SHEET_CSV_URL) is the source of truth in production; this is only used when
// the sheet returns no rows (e.g. local design, or before the sheet is filled).
//
// One row = one performance/SET. Multiple bands at the same porch = multiple
// rows sharing an address (the map fans them out + the side panel lists them).
// Venues with no confirmed act yet use name "Lineup TBD" and blank zone/time so
// they render as neutral "porch confirmed, lineup coming" pins.
//
// Columns mirror the sheet exactly:
//   name, address, lat, lng, zone, time_start, time_end, genre, description, image, link
export const SAMPLE_BANDS = [
  // ----- Confirmed (Zone 1 · Richards Ave · 12–2) -----
  {
    name: 'James Parkington & Astrotwin',
    address: '390 Richards Ave, Portsmouth, NH',
    lat: '43.068074', lng: '-70.758319', zone: '1',
    time_start: '12:00 PM', time_end: '1:00 PM', genre: 'Singer-songwriter',
    description:
      'James Parkington came up in the San Francisco coffee-house and open-mic scene and has played the Seacoast for years — seven albums on Pots & Pans Records.',
    image: '', link: '',
  },
  {
    name: 'KindVolt',
    address: '36 Kent St, Portsmouth, NH',
    lat: '43.070357', lng: '-70.756477', zone: '1',
    time_start: '12:00 PM', time_end: '1:00 PM', genre: 'Rock & Roll',
    description: '', image: '', link: '',
  },
  {
    name: 'Mitch Shuldman',
    address: '247 Richards Ave, Portsmouth, NH',
    lat: '43.070077', lng: '-70.759039', zone: '1',
    time_start: '12:00 PM', time_end: '1:00 PM', genre: 'Classical guitar',
    description: '', image: '', link: '',
  },
  {
    name: 'The Seasmoke Trio',
    address: '247 Richards Ave, Portsmouth, NH',
    lat: '43.070077', lng: '-70.759039', zone: '1',
    time_start: '1:00 PM', time_end: '2:00 PM', genre: 'Jazz / Swing / Blues',
    description:
      'Jazz, swing, blues, and American songbook standards — David Graf (guitar), Peter Braddock (drums), Douglas Green (bass).',
    image: '', link: '',
  },
  {
    name: 'Caitlin Piper',
    address: '334 Parrott Ave, Portsmouth, NH',
    lat: '43.071155', lng: '-70.759317', zone: '1',
    time_start: '1:00 PM', time_end: '2:00 PM', genre: 'Singer-songwriter',
    description: '', image: '', link: '',
  },

  // ----- Confirmed (Zone 2 · Wibird St · 2–4) -----
  {
    name: 'InUsWeMistrust',
    address: '177 Broad St, Portsmouth, NH',
    lat: '43.067640', lng: '-70.760220', zone: '2',
    time_start: '2:00 PM', time_end: '3:00 PM', genre: 'Alternative Rock',
    description: "Chris Marcoullier's solo project making full-band alternative rock.",
    image: '', link: '',
  },
  {
    name: 'MUGSHOT',
    address: '415 Union St, Portsmouth, NH',
    lat: '43.068068', lng: '-70.762620', zone: '2',
    time_start: '3:00 PM', time_end: '4:00 PM', genre: 'Acoustic Pop & Rock',
    description: "One of the Seacoast's most fun acoustic rock bar bands.",
    image: '', link: '',
  },
  {
    name: 'Jon G',
    address: '60 Wibird St, Portsmouth, NH',
    lat: '43.068310', lng: '-70.764710', zone: '2',
    time_start: '2:00 PM', time_end: '3:00 PM', genre: '',
    description: '', image: '', link: '',
  },
  {
    name: 'Oliver Chag & Angelica Romeu',
    address: '419 Lincoln Ave, Portsmouth, NH',
    lat: '43.067846', lng: '-70.761809', zone: '2',
    time_start: '3:00 PM', time_end: '4:00 PM', genre: '',
    description: '', image: '', link: '',
  },

  // ----- Confirmed (Zone 3 · Goodwin Park · 4–6) -----
  {
    name: 'The Desperate Strings',
    address: '306 Austin St, Portsmouth, NH',
    lat: '43.070531', lng: '-70.765979', zone: '3',
    time_start: '4:00 PM', time_end: '5:00 PM', genre: 'Acoustic Pop',
    description:
      'An acoustic quartet reimagining hits through mandolin, ukulele, cello, and percussion.',
    image: '', link: '',
  },
  {
    name: "Linnet's Wing",
    address: '306 Austin St, Portsmouth, NH',
    lat: '43.070531', lng: '-70.765979', zone: '3',
    time_start: '5:00 PM', time_end: '6:00 PM', genre: 'Traditional Irish',
    description: 'Traditional Irish tunes and Celtic songs from the Seacoast.',
    image: '', link: '',
  },
  {
    name: 'Kong Moon',
    address: '953 State St, Portsmouth, NH',
    lat: '43.071035', lng: '-70.768078', zone: '3',
    time_start: '5:00 PM', time_end: '6:00 PM', genre: '',
    description: '', image: '', link: '',
  },

  // ----- Special: PorchFest Art Market -----
  {
    name: 'PorchFest Art Market',
    address: '827 State St, Portsmouth, NH',
    lat: '43.072210', lng: '-70.766410', zone: '3',
    time_start: '4:00 PM', time_end: '6:00 PM', genre: 'Art Market',
    description: 'Local makers and artists — a pop-up art market, 4–6 PM.',
    image: '', link: '',
  },

  // ----- Confirmed venues, lineup TBD (organizers fill band + time + zone) -----
  vTBD('91 Spring St', '43.067344', '-70.760950'),
  vTBD('89 Brewery Ln', '43.069590', '-70.768240'),
  vTBD('843 State St', '43.072065', '-70.766627'),
  vTBD('70 Highland St', '43.069347', '-70.763000'),
  vTBD('668 Middle St', '43.068303', '-70.767608'),
  vTBD('496 Lincoln Ave', '43.067063', '-70.763342'),
  vTBD('40 Summer St', '43.071986', '-70.762961'),
  vTBD('39 Richards Ave', '43.072567', '-70.760869'),
  vTBD('373 Lincoln Ave', '43.067998', '-70.761018'),
  vTBD('351 Union St', '43.068776', '-70.763030'),
  vTBD('346 Richards Ave', '43.068626', '-70.758709'),
  vTBD('282 Rockland St', '43.069206', '-70.760998'),
  vTBD('238 Willard Ave', '43.063196', '-70.766967'),
  vTBD('168 Wibird St', '43.066834', '-70.764129'),
  vTBD('136 Cabot St', '43.071860', '-70.765220'),
  vTBD('68 Cabot St', '43.071108', '-70.764339'),
  vTBD('517 Middle St', '43.069486', '-70.764405'),
  vTBD('419 Richards Ave', '43.068007', '-70.757420'),
];

// Helper for a confirmed porch whose lineup isn't announced yet.
function vTBD(address, lat, lng) {
  return {
    name: 'Lineup TBD',
    address: `${address}, Portsmouth, NH`,
    lat, lng, zone: '',
    time_start: '', time_end: '', genre: '',
    description: '', image: '', link: '',
  };
}
