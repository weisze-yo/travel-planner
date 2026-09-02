// The demo trip from the Claude Design prototype, written to Firestore the
// first time an account opens the app. Names are the design's fictional ones;
// coordinates are real central-Tokyo values so real streets sit under the
// route. Mirrors TravelPlanner.swiftpm/Sources/Models/SeedData.swift.

export const TRIP_ID = 'meridian-city';

export const WEATHER = [
  { dayNumber: 1, icon: '☀', high: 21, low: 14, rainChance: 0, summary: 'clear' },
  { dayNumber: 2, icon: '⛅', high: 19, low: 13, rainChance: 10, summary: 'partly cloudy' },
  { dayNumber: 3, icon: '☁', high: 16, low: 13, rainChance: 20, summary: 'overcast' },
  { dayNumber: 4, icon: '🌧', high: 14, low: 11, rainChance: 80, summary: 'rain' },
  { dayNumber: 5, icon: '⛅', high: 18, low: 12, rainChance: 10, summary: 'partly cloudy' },
  { dayNumber: 6, icon: '☀', high: 20, low: 13, rainChance: 0, summary: 'clear' },
];

export const TRIP = {
  id: TRIP_ID,
  name: 'Meridian City · Group Tour',
  code: 'MC',
  dateRange: 'Mar 12–17 · agent itinerary · 6 days',
  dayCount: 6,
  currentDay: 3,
  departsInDays: 11,
  startDate: '2026-03-12',
  currencySymbol: '¥',
  currencyCode: 'JPY',
  homeCurrencyCode: 'MYR',
  homeCurrencyRate: 33.7,
  rateUpdatedAt: null,
  rateSource: '',
  locationName: '',
  hotelName: 'Hotel Meridian',
  stationName: 'Nishi Sta., Exit B',
  latitude: 35.6800,
  longitude: 139.7010,
  weather: WEATHER,
  weatherUpdatedAt: null,
};

const DATE_LABELS = [
  'Mar 12 · Thu', 'Mar 13 · Fri', 'Mar 14 · Sat',
  'Mar 15 · Sun', 'Mar 16 · Mon', 'Mar 17 · Tue',
];

export const NISHI_ESSENTIALS = [
  { key: 'Hours', value: '09:00 – 18:00', detail: 'Closed Wednesdays · south food aisle open to 21:00' },
  { key: 'Phone', value: '+00 2 4471 9820', detail: 'Market office, English 10:00–16:00' },
  { key: 'Website', value: 'nishimarket.example', detail: 'Stall directory and closure notices' },
  { key: 'Tickets', value: 'Free entry', detail: 'Knife-sharpening demo ¥800, 14:00 daily' },
  { key: 'Transport', value: 'Line 3 → Nishi Sta., Exit B', detail: '4 min walk · lift at Exit B · taxi rank on the east side' },
  { key: 'Payment', value: 'Cash preferred', detail: 'IC card at ~40 stalls · one ATM at the north gate' },
  { key: 'Facilities', value: 'Toilets, lockers, seating', detail: 'Coin lockers ¥400 at north gate, cash only' },
  { key: 'Language', value: 'Partial English signs', detail: 'Point-and-pay works; prices per 100 g' },
];

const DAY_THREE_ITEMS = [
  {
    id: 'depart', time: '08:30', durationLabel: '', name: 'Depart Hotel Meridian',
    subtitle: '', note: 'Coach bay 2 · guide Ms. Ren', summary: '', windowLabel: '',
    chips: [], kind: 'main', isSubRouteSummary: false, placeID: null, essentials: [],
    latitude: 35.6900, longitude: 139.6960, archived: false, movedToDay: null,
  },
  {
    id: 'lumen', time: '09:15', durationLabel: '45m', name: 'Lumen Crossing',
    subtitle: 'Scramble crossing · Old Quarter',
    note: 'Crossing sweep every 2 min; guide talks 10 min then free on the plaza.',
    summary: 'A five-way scramble crossing under video walls. The sweep runs about every two minutes; the guide talks for ten and then leaves the group on the plaza.',
    windowLabel: '09:15 – 10:00', chips: ['2 must-see shots'], kind: 'main',
    isSubRouteSummary: false, placeID: null, essentials: [],
    latitude: 35.6918, longitude: 139.7005, archived: false, movedToDay: null,
  },
  {
    id: 'ashgate', time: '10:30', durationLabel: '1h', name: 'Ashgate Shrine',
    subtitle: 'Shrine complex · Old Quarter',
    note: 'Covered shoulders. Stamp book ¥500 at the side office.',
    summary: 'A working shrine with a cedar avenue and a side office selling stamp books. Shoulders must be covered inside the inner gate.',
    windowLabel: '10:30 – 11:30', chips: [], kind: 'main',
    isSubRouteSummary: false, placeID: null, essentials: [],
    latitude: 35.6870, longitude: 139.7030, archived: false, movedToDay: null,
  },
  {
    id: 'harbour', time: '12:00', durationLabel: '1h', name: 'Harbour Steps · set lunch',
    subtitle: 'Group restaurant · Harbourside',
    note: 'Included. Vegetarian on request the night before.',
    summary: 'Set lunch included in the tour price. Vegetarian and no-fish plates need to be requested the night before.',
    windowLabel: '12:00 – 13:00', chips: [], kind: 'main',
    isSubRouteSummary: false, placeID: null, essentials: [],
    latitude: 35.6835, longitude: 139.7060, archived: false, movedToDay: null,
  },
  {
    id: 'nishi', time: '13:30', durationLabel: '2h15', name: 'Nishi Market',
    subtitle: 'Covered market, 4 blocks · Old Quarter',
    note: 'Guide releases the group at the north gate; back at the coach 15:45.',
    summary: 'A 90-year-old covered market of about 180 stalls: produce and dried goods at the north end, kitchenware and knives in the middle aisle, street food and standing bars to the south. Busiest 12:00–14:00; many stalls start closing at 17:00.',
    windowLabel: '13:30 – 15:45', chips: ['4 shopping items', '4 must-see shots'],
    kind: 'main', isSubRouteSummary: false, placeID: 'nishi', essentials: NISHI_ESSENTIALS,
    latitude: 35.6800, longitude: 139.7010, archived: false, movedToDay: null,
  },
  {
    id: 'mysub', time: '13:45', durationLabel: '1h47', name: 'My sub route · 3 stops',
    subtitle: '', note: 'Kōri Dessert Bar → Canal Overlook → Paper & Ink.',
    summary: '', windowLabel: '', chips: ['1.4 km walk'], kind: 'sub',
    isSubRouteSummary: true, placeID: null, essentials: [],
    latitude: 35.6810, longitude: 139.7002, archived: false, movedToDay: null,
  },
  {
    id: 'skyline', time: '16:00', durationLabel: '1h', name: 'Skyline Deck',
    subtitle: 'Observation deck · Skyline',
    note: 'Ticket held by agent. Sunset 18:04 — deck faces west.',
    summary: 'West-facing observation deck on the 41st floor. The agent holds the group ticket; sunset is 18:04 and the deck gets windy after dark.',
    windowLabel: '16:00 – 17:00', chips: ['1 must-see shot'], kind: 'main',
    isSubRouteSummary: false, placeID: null, essentials: [],
    latitude: 35.6845, longitude: 139.6935, archived: false, movedToDay: null,
  },
  {
    id: 'hotel', time: '18:00', durationLabel: '', name: 'Hotel Meridian',
    subtitle: '', note: 'Dinner not included. Two ramen shops within 300 m.',
    summary: '', windowLabel: '', chips: [], kind: 'main',
    isSubRouteSummary: false, placeID: null, essentials: [],
    latitude: 35.6900, longitude: 139.6960, archived: false, movedToDay: null,
  },
];

export const DAYS = Array.from({ length: 6 }, (_, i) => {
  const n = i + 1;
  return {
    id: `day-${n}`,
    dayNumber: n,
    dateLabel: DATE_LABELS[i],
    shortDate: DATE_LABELS[i].split(' · ')[0],
    areaSpan: n === 3 ? 'Old Quarter to Skyline' : '',
    items: n === 3 ? DAY_THREE_ITEMS : [],
  };
});

const leg = (mode, minutes) => ({ mode, minutes });

export const PLACES = [
  { id: 'ramen', anchorPlaceID: 'nishi', name: 'Standing Ramen No.7', category: 'food', priceTier: '¥', stayMinutes: 20, legs: [leg('walk', 3)], note: 'Six seats, no queue after 14:00', isUserAdded: false, latitude: 35.6806, longitude: 139.7016 },
  { id: 'kori', anchorPlaceID: 'nishi', name: 'Kōri Dessert Bar', category: 'food', priceTier: '¥¥', stayMinutes: 25, legs: [leg('walk', 4)], note: 'Shaved ice with seasonal fruit', isUserAdded: false, latitude: 35.6810, longitude: 139.7002 },
  { id: 'canal', anchorPlaceID: 'nishi', name: 'Canal Overlook', category: 'sight', priceTier: 'Free', stayMinutes: 15, legs: [leg('walk', 5)], note: 'Bridge 2 north rail', isUserAdded: false, latitude: 35.6788, longitude: 139.7024 },
  { id: 'pharm', anchorPlaceID: 'nishi', name: 'Green Cross Pharmacy', category: 'cosme', priceTier: '¥', stayMinutes: 20, legs: [leg('walk', 2)], note: 'Sunscreen, plasters, eye drops', isUserAdded: false, latitude: 35.6803, longitude: 139.7005 },
  { id: 'cosme', anchorPlaceID: 'nishi', name: 'Cosme Lab flagship', category: 'cosme', priceTier: '¥¥', stayMinutes: 35, legs: [leg('walk', 4), leg('train', 6)], note: 'Tax-free counter on level 2', isUserAdded: false, latitude: 35.6852, longitude: 139.7100 },
  { id: 'paper', anchorPlaceID: 'nishi', name: 'Paper & Ink Stationery', category: 'shopping', priceTier: '¥', stayMinutes: 20, legs: [leg('walk', 6)], note: 'Letterpress cards, brush pens', isUserAdded: false, latitude: 35.6784, longitude: 139.6996 },
  { id: 'garden', anchorPlaceID: 'nishi', name: 'Stone Lantern Garden', category: 'sight', priceTier: '¥', stayMinutes: 30, legs: [leg('walk', 7)], note: 'Quiet pond loop, free toilets', isUserAdded: false, latitude: 35.6820, longitude: 139.7038 },
  { id: 'aoi', anchorPlaceID: 'nishi', name: 'Aoi Camera Alley', category: 'shopping', priceTier: '¥¥¥', stayMinutes: 35, legs: [leg('walk', 8)], note: 'Eleven used-gear shops in one lane', isUserAdded: false, latitude: 35.6776, longitude: 139.7042 },
  { id: 'bath', anchorPlaceID: 'nishi', name: 'Old Quarter Bathhouse', category: 'rest', priceTier: '¥', stayMinutes: 60, legs: [leg('walk', 9)], note: 'Towel rental ¥200', isUserAdded: false, latitude: 35.6772, longitude: 139.6982 },
  { id: 'kimono', anchorPlaceID: 'nishi', name: 'Indigo Kimono Rental', category: 'cloth', priceTier: '¥¥', stayMinutes: 45, legs: [leg('walk', 7)], note: 'Two-hour rental, dressing included', isUserAdded: false, latitude: 35.6818, longitude: 139.6975 },
  { id: 'arcade', anchorPlaceID: 'nishi', name: 'Nishi Craft Arcade', category: 'shopping', priceTier: '¥¥', stayMinutes: 40, legs: [leg('walk', 11)], note: 'Ceramics and indigo cloth', isUserAdded: false, latitude: 35.6836, longitude: 139.7052 },
  { id: 'dept', anchorPlaceID: 'nishi', name: 'Kaede Department Store', category: 'cloth', priceTier: '¥¥¥', stayMinutes: 60, legs: [leg('walk', 5), leg('train', 8), leg('walk', 3)], note: 'Six floors, basement food hall', isUserAdded: false, latitude: 35.6905, longitude: 139.7005 },
  { id: 'outlet', anchorPlaceID: 'nishi', name: 'Riverside Outlet', category: 'cloth', priceTier: '¥¥', stayMinutes: 75, legs: [leg('walk', 3), leg('bus', 22)], note: 'Last-season stock, 40–60% off', isUserAdded: false, latitude: 35.6680, longitude: 139.7180 },
  { id: 'tower', anchorPlaceID: 'nishi', name: 'Hillside Tower', category: 'sight', priceTier: '¥¥', stayMinutes: 50, legs: [leg('walk', 6), leg('train', 14), leg('bus', 9)], note: 'Observation deck, faces west', isUserAdded: false, latitude: 35.6586, longitude: 139.7454 },
];

export const SUB_ROUTES = [
  {
    id: 'day-3',
    dayNumber: 3,
    anchorPlanItemID: 'nishi',
    anchorName: 'Nishi Market',
    startMinutes: 13 * 60 + 45,
    deadlineMinutes: 15 * 60 + 45,
    placeIDs: ['kori', 'canal', 'paper'],
    returnTarget: 'coach',
    returnMinutes: 8,
  },
];

const NISHI_WHEN = 'Day 3 · today, 13:30 – 15:45';
const AOI_WHEN = 'Day 3 · sub route, optional';
const AIR_WHEN = 'Day 6 · 3 h layover';

export const SHOPPING = [
  { id: 'k1', name: 'Kitchen knife', detail: 'Middle aisle, stall 44', placeLabel: 'Nishi Market', placeWhen: NISHI_WHEN, badge: 'none', groupOrder: 0, order: 0, estimate: 5000, paidAmount: null, payment: 'cash', bought: false, boughtOn: null, isUnplanned: false },
  { id: 'k2', name: 'Dried scallop', detail: 'North end · sold per 100 g', placeLabel: 'Nishi Market', placeWhen: NISHI_WHEN, badge: 'none', groupOrder: 0, order: 1, estimate: 1800, paidAmount: null, payment: 'cash', bought: false, boughtOn: null, isUnplanned: false },
  { id: 'k3', name: 'Ceramic cups ×4', detail: 'Craft arcade, 11 min walk', placeLabel: 'Nishi Market', placeWhen: NISHI_WHEN, badge: 'none', groupOrder: 0, order: 2, estimate: 3200, paidAmount: null, payment: 'cash', bought: false, boughtOn: null, isUnplanned: false },
  { id: 'k4', name: 'Yuzu pepper', detail: 'Any dried-goods stall', placeLabel: 'Nishi Market', placeWhen: NISHI_WHEN, badge: 'none', groupOrder: 0, order: 3, estimate: null, paidAmount: null, payment: 'cash', bought: false, boughtOn: null, isUnplanned: false },
  { id: 'k5', name: '35mm prime lens, used', detail: 'Compare 3 shops before buying', placeLabel: 'Aoi Camera Alley', placeWhen: AOI_WHEN, badge: 'ifTime', groupOrder: 1, order: 0, estimate: 20000, paidAmount: null, payment: 'cash', bought: false, boughtOn: null, isUnplanned: false },
  { id: 'k6', name: 'Camera strap', detail: 'Leather, second lane', placeLabel: 'Aoi Camera Alley', placeWhen: AOI_WHEN, badge: 'ifTime', groupOrder: 1, order: 1, estimate: null, paidAmount: null, payment: 'cash', bought: false, boughtOn: null, isUnplanned: false },
  { id: 'k7', name: 'Gift boxes ×3', detail: 'Cheaper in town, but safe fallback', placeLabel: 'Airport, before security', placeWhen: AIR_WHEN, badge: 'lastChance', groupOrder: 2, order: 0, estimate: 4500, paidAmount: null, payment: 'cash', bought: false, boughtOn: null, isUnplanned: false },
  { id: 'k8', name: 'Matcha tin', detail: 'Duty-free counter B', placeLabel: 'Airport, before security', placeWhen: AIR_WHEN, badge: 'lastChance', groupOrder: 2, order: 1, estimate: 2600, paidAmount: 2400, payment: 'card', bought: true, boughtOn: '2026-03-11', isUnplanned: false },
];

export const MUST_SEE = [
  { id: 'm1', placeID: 'nishi', title: 'Red lantern run, north gate', tag: 'ICONIC', summary: 'A full row of old lanterns from the north gate down the middle aisle — the shot this market is known for.', whereToFind: '20 m inside the north gate', imagePath: null, captured: false, order: 0, latitude: 35.6804, longitude: 139.7012 },
  { id: 'm2', placeID: 'nishi', title: 'Canal from Bridge 2', tag: 'EVENING', summary: 'The market’s steel roofs reflected in the water; quieter towards evening.', whereToFind: 'Bridge 2, north rail', imagePath: null, captured: false, order: 1, latitude: 35.6788, longitude: 139.7024 },
  { id: 'm3', placeID: 'nishi', title: 'The knife sharpener’s bench', tag: '14:00 DAILY', summary: 'Sparks and spray during the demo. Shoot from the side, not the front.', whereToFind: 'Middle aisle, stall 44', imagePath: null, captured: false, order: 2, latitude: 35.6800, longitude: 139.7009 },
  { id: 'm4', placeID: 'nishi', title: 'South standing bars', tag: 'NIGHT', summary: 'Lights come on after 17:00 — steam, crowd and signage all in one frame.', whereToFind: 'South exit', imagePath: null, captured: false, order: 3, latitude: 35.6795, longitude: 139.7008 },
];

export const OUTFIT_SUGGESTION = '16 °C and overcast on this day, so a mid-weight layer works. The market is grey stone and steel, so one solid warm tone reads best — rust, cream or mustard. Flat shoes: the aisles are wet near the fish stalls.';
export const OUTFIT_SUGGESTION_CHIPS = ['rust coat', 'cream knit', 'flat shoes'];
export const OUTFIT_PICKS = ['Rust coat', 'Cream knit', 'Flat shoes', 'Shawl'];

export const PREP_CATEGORIES = ['Documents', 'Outfits', 'Carry-on', 'Electronics'];

export const PREP = [
  { id: 'p1', category: 'Documents', categoryOrder: 0, order: 0, name: 'Passport + 2 copies', why: '', packed: true, packedIn: 'notPacked' },
  { id: 'p2', category: 'Documents', categoryOrder: 0, order: 1, name: 'Agent voucher, printed', why: 'Coach driver checks paper only', packed: true, packedIn: 'notPacked' },
  { id: 'p3', category: 'Documents', categoryOrder: 0, order: 2, name: 'Travel insurance card', why: '', packed: false, packedIn: 'notPacked' },
  { id: 'p4', category: 'Outfits', categoryOrder: 1, order: 0, name: 'Rust coat', why: 'Must-see shots: Canal Overlook, Skyline Deck', packed: false, packedIn: 'notPacked' },
  { id: 'p5', category: 'Outfits', categoryOrder: 1, order: 1, name: 'Cream knit', why: '', packed: false, packedIn: 'notPacked' },
  { id: 'p6', category: 'Outfits', categoryOrder: 1, order: 2, name: 'Shawl for covered shoulders', why: 'Ashgate Shrine, Day 3', packed: false, packedIn: 'notPacked' },
  { id: 'p7', category: 'Outfits', categoryOrder: 1, order: 3, name: 'Flat shoes, broken in', why: '12 km walking on Day 2', packed: true, packedIn: 'suitcase' },
  { id: 'p8', category: 'Carry-on', categoryOrder: 2, order: 0, name: 'Folding umbrella', why: 'Day 4: 80% rain', packed: false, packedIn: 'notPacked' },
  { id: 'p9', category: 'Carry-on', categoryOrder: 2, order: 1, name: 'Coin purse for cash stalls', why: 'Nishi Market is cash-first', packed: false, packedIn: 'notPacked' },
  { id: 'p10', category: 'Carry-on', categoryOrder: 2, order: 2, name: 'Foldable tote for shopping', why: '', packed: false, packedIn: 'notPacked' },
  { id: 'p11', category: 'Carry-on', categoryOrder: 2, order: 3, name: 'Painkillers, plasters', why: '', packed: true, packedIn: 'carryOn' },
  { id: 'p12', category: 'Electronics', categoryOrder: 3, order: 0, name: 'Type-A plug adapter ×2', why: '', packed: true, packedIn: 'suitcase' },
  { id: 'p13', category: 'Electronics', categoryOrder: 3, order: 1, name: 'Power bank 10,000 mAh', why: 'Carry-on only', packed: true, packedIn: 'carryOn' },
  { id: 'p14', category: 'Electronics', categoryOrder: 3, order: 2, name: 'Camera + 2 batteries', why: '', packed: false, packedIn: 'notPacked' },
  { id: 'p15', category: 'Electronics', categoryOrder: 3, order: 3, name: 'Offline map pack downloaded', why: '', packed: false, packedIn: 'notPacked' },
];

export const LOG = [
  {
    id: 'day-2', dayNumber: 2, dayLabel: 'Day 2', dateLabel: 'Mar 13',
    meta: '6 stops · 12.4 km', metaIsLive: false,
    destinationLabel: 'Ashgate Shrine · Harbour Steps · Hillside Tower',
    destinationPlaceID: null,
    text: 'Hill walk was steeper than the note said. Got the shrine gate shot at 07:40 with nobody in frame. Missed the dessert bar — closed on Fridays.',
    photoCount: 0, photoPaths: [],
    chips: [
      { label: '2 of 3 must-see ✓', tone: 'jade' },
      { label: '¥8,150 spent', tone: 'neutral' },
      { label: '1 sub route walked', tone: 'neutral' },
    ],
  },
  {
    id: 'day-3', dayNumber: 3, dayLabel: 'Day 3', dateLabel: 'Today',
    meta: 'in progress', metaIsLive: true,
    destinationLabel: 'Nishi Market', destinationPlaceID: 'nishi',
    text: '3 stops done, 3 to go. Add today’s note from the place screen.',
    photoCount: 0, photoPaths: [],
    chips: [{ label: 'note pending', tone: 'amber' }],
  },
];

export const RECAP_TEXT = 'Route map, all photos, what you bought and what you paid, plus the places you saved but never reached — carried into your next trip.';

export const CATEGORY_LABELS = {
  food: 'Food',
  cosme: 'Cosmetic & health',
  cloth: 'Clothing',
  shopping: 'Shopping',
  sight: 'Sights',
  rest: 'Rest',
};

export const MODE_ICONS = { walk: '🚶', train: '🚆', bus: '🚌' };
export const MODE_LABELS = { walk: 'walk', train: 'train', bus: 'bus' };

export const PAYMENTS = [
  { id: 'cash', label: 'Cash' },
  { id: 'card', label: 'Card' },
  { id: 'ic', label: 'IC card' },
  { id: 'ewallet', label: 'E-wallet' },
];

export const PACKED_LOCATIONS = [
  { id: 'notPacked', label: 'Not packed' },
  { id: 'suitcase', label: 'Suitcase' },
  { id: 'carryOn', label: 'Carry-on' },
  { id: 'backpack', label: 'Backpack' },
];

export const RETURN_TARGETS = [
  { id: 'coach', label: 'Coach · Nishi Market gate' },
  { id: 'nextStop', label: 'Next stop · Skyline Deck' },
  { id: 'hotel', label: 'Hotel Meridian' },
  { id: 'station', label: 'Nishi Sta., Exit B' },
];

export const BADGES = {
  none: null,
  ifTime: 'IF TIME',
  lastChance: 'LAST CHANCE',
};
