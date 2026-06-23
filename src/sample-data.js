// Test lineup used ONLY until the live Google Sheet returns rows. The moment the
// published sheet has data, these are ignored automatically (see data.js).
//
// These are REAL confirmed 2026 placements pulled from the Performing Artist
// Committee booking schedule + interest-form responses, geocoded to each host's
// address. Genres/descriptions are used verbatim where the act provided them and
// left blank where the committee is still gathering info. Times are placeholders
// within each zone's window until the final schedule is locked.
//
// Zones (from the official FAQ):
//   Zone 1 · Richards Ave   · 12:00–2:00 PM
//   Zone 2 · Wibird St       · 2:00–4:00 PM
//   Zone 3 · Goodwin Park    · 4:00–6:00 PM
//
// Columns match the Google Sheet exactly so popup/marker code is identical for
// sample and live data: name, address, lat, lng, zone, time_start, time_end,
// genre, description, image, link.
export const SAMPLE_BANDS = [
  // ----- Zone 1 · Richards Ave (12:00–2:00) -----
  {
    name: 'James Parkington & Astrotwin',
    address: '390 Richards Ave, Portsmouth, NH',
    lat: '43.068074',
    lng: '-70.758319',
    zone: '1',
    time_start: '12:00 PM',
    time_end: '1:00 PM',
    genre: 'Singer-songwriter',
    description:
      'James Parkington started writing and performing in the coffee-house and open-mic scene in San Francisco in the early 2000s and has played around the Seacoast ever since returning to New England. He has released seven albums on the Pots & Pans Records label.',
    image: '',
    link: '',
  },
  {
    name: 'KindVolt',
    address: '36 Kent St, Portsmouth, NH',
    lat: '43.070357',
    lng: '-70.756477',
    zone: '1',
    time_start: '12:00 PM',
    time_end: '1:00 PM',
    genre: 'Rock & Roll',
    description: '',
    image: '',
    link: '',
  },
  {
    name: 'Mitch Shuldman',
    address: '247 Richards Ave, Portsmouth, NH',
    lat: '43.070077',
    lng: '-70.759039',
    zone: '1',
    time_start: '12:00 PM',
    time_end: '1:00 PM',
    genre: 'Classical guitar',
    description: '',
    image: '',
    link: '',
  },
  {
    name: 'The Seasmoke Trio',
    address: '247 Richards Ave, Portsmouth, NH',
    lat: '43.070077',
    lng: '-70.759039',
    zone: '1',
    time_start: '1:00 PM',
    time_end: '2:00 PM',
    genre: 'Jazz / Swing / Blues',
    description:
      'The Seasmoke Trio plays jazz, swing, blues, and traditional American songbook tunes — original compositions alongside songs by notable artists. David Graf on finger-style electric guitar, Peter Braddock on drums, and Douglas Green on electric bass.',
    image: '',
    link: '',
  },
  {
    name: 'Caitlin Piper',
    address: '334 Parrott Ave, Portsmouth, NH',
    lat: '43.071155',
    lng: '-70.759317',
    zone: '1',
    time_start: '1:00 PM',
    time_end: '2:00 PM',
    genre: 'Singer-songwriter',
    description: '',
    image: '',
    link: '',
  },

  // ----- Zone 2 · Wibird St (2:00–4:00) -----
  {
    name: 'InUsWeMistrust',
    address: '177 Broad St, Portsmouth, NH',
    lat: '43.067640',
    lng: '-70.760220',
    zone: '2',
    time_start: '2:00 PM',
    time_end: '3:00 PM',
    genre: 'Alternative Rock',
    description:
      'Chris Marcoullier is a solo artist making full-band alternative rock music under the name InUsWeMistrust.',
    image: '',
    link: '',
  },
  {
    name: 'MUGSHOT',
    address: '415 Union St, Portsmouth, NH',
    lat: '43.068068',
    lng: '-70.762620',
    zone: '2',
    time_start: '3:00 PM',
    time_end: '4:00 PM',
    genre: 'Acoustic Pop & Rock',
    description:
      "Considered one of the Seacoast's most fun acoustic rock bar bands.",
    image: '',
    link: '',
  },
  {
    name: 'Jon G',
    address: '60 Wibird St, Portsmouth, NH',
    lat: '43.068310',
    lng: '-70.764710',
    zone: '2',
    time_start: '2:00 PM',
    time_end: '3:00 PM',
    genre: '',
    description: '',
    image: '',
    link: '',
  },
  {
    name: 'Oliver Chag & Angelica Romeu',
    address: '419 Lincoln Ave, Portsmouth, NH',
    lat: '43.067846',
    lng: '-70.761809',
    zone: '2',
    time_start: '3:00 PM',
    time_end: '4:00 PM',
    genre: '',
    description: '',
    image: '',
    link: '',
  },

  // ----- Zone 3 · Goodwin Park (4:00–6:00) -----
  {
    name: 'The Desperate Strings',
    address: '306 Austin St, Portsmouth, NH',
    lat: '43.070531',
    lng: '-70.765979',
    zone: '3',
    time_start: '4:00 PM',
    time_end: '5:00 PM',
    genre: 'Acoustic Pop',
    description:
      'An acoustic quartet that reimagines famous hits through the rich textures of mandolin, ukulele, cello, and percussion — legendary songs re-arranged into purely acoustic, string-driven performances.',
    image: '',
    link: '',
  },
  {
    name: "Linnet's Wing",
    address: '306 Austin St, Portsmouth, NH',
    lat: '43.070531',
    lng: '-70.765979',
    zone: '3',
    time_start: '5:00 PM',
    time_end: '6:00 PM',
    genre: 'Traditional Irish',
    description:
      "Traditional Irish tunes and Celtic songs from the Seacoast. Linnet's Wing is Lisa Carey (flute, tin whistle), Sarah Reynolds (fiddle), Mike Prendergast (concertina), Chuck Carey (bouzouki, guitar, vocals), and John Carew (guitar, vocals).",
    image: '',
    link: '',
  },
  {
    name: 'Ben & Joolz',
    address: '781 State St, Portsmouth, NH',
    lat: '43.072952',
    lng: '-70.765177',
    zone: '3',
    time_start: '4:00 PM',
    time_end: '5:00 PM',
    genre: '',
    description: '',
    image: '',
    link: '',
  },
  {
    name: 'Kong Moon',
    address: '953 State St, Portsmouth, NH',
    lat: '43.071035',
    lng: '-70.768078',
    zone: '3',
    time_start: '5:00 PM',
    time_end: '6:00 PM',
    genre: '',
    description: '',
    image: '',
    link: '',
  },
];
