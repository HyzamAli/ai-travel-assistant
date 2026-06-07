import { writeFileSync, mkdirSync } from 'fs';
import { dirname, resolve } from 'path';
import type {
  Bundle,
  DayHighlight,
  HighlightIcon,
  TripType,
} from '../src/types/bundle';

function mulberry32(seed: number): () => number {
  let s = seed;
  return function () {
    let t = (s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(0xc0ffee);
const pick = <T>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)]!;
const pickN = <T>(arr: readonly T[], n: number): T[] => {
  const pool = [...arr];
  const out: T[] = [];
  for (let i = 0; i < n && pool.length; i++) {
    const idx = Math.floor(rand() * pool.length);
    out.push(pool.splice(idx, 1)[0]!);
  }
  return out;
};
const intBetween = (lo: number, hi: number) =>
  lo + Math.floor(rand() * (hi - lo + 1));

const DESTINATIONS: readonly string[] = [
  'Bali, Indonesia',
  'Santorini, Greece',
  'Kyoto, Japan',
  'Reykjavik, Iceland',
  'Lisbon, Portugal',
  'Marrakech, Morocco',
  'Maldives',
  'Prague, Czechia',
  'Hoi An, Vietnam',
  'Cusco, Peru',
  'Cape Town, South Africa',
  'Queenstown, New Zealand',
  'Banff, Canada',
  'Goa, India',
  'Ladakh, India',
  'Kerala, India',
  'Andaman Islands, India',
  'Rishikesh, India',
  'Udaipur, India',
  'Jaipur, India',
  'Pondicherry, India',
  'Coorg, India',
  'Dubai, UAE',
  'Istanbul, Turkey',
  'Phuket, Thailand',
  'Bangkok, Thailand',
  'Sri Lanka',
  'Mauritius',
  'Seychelles',
  'Bhutan',
];

// Curated Unsplash photo IDs (travel-themed). Cycled across bundles.
// If any rot, expo-image placeholder (Story 1.3) covers it.
const UNSPLASH_IDS: readonly string[] = [
  '1507525428034-b723cf961d3e',
  '1499856871958-5b9627545d1a',
  '1502602898657-3e91760cbb34',
  '1519810755548-39cd217da494',
  '1530841377377-3ff06c0ca713',
  '1488646953014-85cb44e25828',
  '1506905925346-21bda4d32df4',
  '1469854523086-cc02fe5d8800',
  '1473625247510-8ceb1760943f',
  '1517760444937-f6397edcbbcd',
  '1504609813442-a8924e83f76e',
  '1476514525535-07fb3b4ae5f1',
  '1467269204594-9661b134dd2b',
  '1504457047772-27faf1c00561',
  '1528127269322-539801943592',
  '1502920917128-1aa500764cbd',
  '1493780474015-ba834fd0ce2f',
  '1493558103817-58b2924bce98',
  '1518684079-3c830dcef090',
  '1507608616759-54f48f0af0ee',
  '1464822759023-fed622ff2c3b',
  '1483721310020-03333e577078',
  '1510414842594-a61c69b5ae57',
  '1500530855697-b586d89ba3ee',
  '1501785888041-af3ef285b470',
  '1493606278519-11aa9f86e40a',
  '1542640244-7e672d6cef4e',
  '1473496169904-658ba7c44d8a',
  '1499678329028-101435549a4e',
  '1505228395891-9a51e7e86bf6',
];

const HIGHLIGHTS: readonly DayHighlight[] = [
  { title: 'Arrival flight', iconName: 'airplane' },
  { title: 'Local food tour', iconName: 'restaurant' },
  { title: 'Boutique stay', iconName: 'bed' },
  { title: 'Old town walking tour', iconName: 'walk' },
  { title: 'Sunset viewpoint', iconName: 'camera' },
  { title: 'Sunset cruise', iconName: 'boat' },
  { title: 'Private beach day', iconName: 'partly-sunny' },
  { title: 'Botanical gardens', iconName: 'leaf' },
  { title: 'Waterfall trek', iconName: 'water' },
  { title: 'Vineyard tasting', iconName: 'wine' },
  { title: 'Café hopping', iconName: 'cafe' },
  { title: 'Cycling trail', iconName: 'bicycle' },
  { title: 'Guided exploration', iconName: 'compass' },
  { title: 'Snorkel session', iconName: 'fish' },
  { title: 'Beach bonfire', iconName: 'flame' },
  { title: 'Stargazing night', iconName: 'star' },
  { title: 'Heritage homestay', iconName: 'home' },
  { title: 'Live music night', iconName: 'musical-notes' },
  { title: 'Welcome hamper', iconName: 'gift' },
  { title: 'Spa & wellness', iconName: 'sparkles' },
];

const TRIP_TYPES: readonly TripType[] = ['flightStay', 'villa', 'experience'];

const PRICE_RANGE: Record<TripType, [number, number]> = {
  flightStay: [35000, 120000],
  villa: [60000, 250000],
  experience: [8000, 35000],
};

const DURATION_RANGE: Record<TripType, [number, number]> = {
  flightStay: [4, 8],
  villa: [3, 7],
  experience: [2, 4],
};

const TOTAL = 105;

const bundles: Bundle[] = Array.from({ length: TOTAL }, (_, i): Bundle => {
  const tripType = TRIP_TYPES[i % TRIP_TYPES.length]!; // keeps 35/35/35 balance
  const destination = pick(DESTINATIONS);
  const photoId = pick(UNSPLASH_IDS);
  const [priceLo, priceHi] = PRICE_RANGE[tripType];
  const [durLo, durHi] = DURATION_RANGE[tripType];
  const nights = intBetween(durLo, durHi);
  const ratingTenths = intBetween(38, 50);
  const highlightCount = intBetween(3, 4);

  return {
    id: `bundle-${String(i + 1).padStart(3, '0')}`,
    destination,
    tripType,
    price: {
      amount: Math.round(intBetween(priceLo, priceHi) / 500) * 500,
      currency: 'INR',
    },
    duration: { days: nights + 1, nights },
    rating: Math.round(ratingTenths) / 10,
    heroImageUrl: `https://images.unsplash.com/photo-${photoId}?w=800&q=70&auto=format`,
    highlights: pickN(HIGHLIGHTS, highlightCount),
  };
});

const outPath = resolve(__dirname, '..', 'src', 'mocks', 'bundles.json');
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(bundles, null, 2) + '\n');
console.log(`Wrote ${bundles.length} bundles → ${outPath}`);
