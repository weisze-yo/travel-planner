// The three outside services this app uses. All free, none needs a key or a
// billing account, and every one of them is optional: if the request fails —
// which offline it always will — the caller keeps whatever it had and the
// screen says how old that is.

const TIMEOUT_MS = 8000;

/** fetch with a deadline, so a dead network fails fast instead of hanging. */
async function get(url, { headers = {} } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json', ...headers },
    });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

export const online = () => (typeof navigator === 'undefined' ? true : navigator.onLine !== false);

// ------------------------------------------------------------------ weather

/** Open-Meteo publishes about 16 days ahead; past dates need its archive. */
export const FORECAST_HORIZON_DAYS = 16;

const WEATHER_CODES = [
  [[0], '☀', 'clear'],
  [[1, 2], '⛅', 'partly cloudy'],
  [[3], '☁', 'overcast'],
  [[45, 48], '🌫', 'fog'],
  [[51, 53, 55, 56, 57], '🌦', 'drizzle'],
  [[61, 63, 65, 66, 67, 80, 81, 82], '🌧', 'rain'],
  [[71, 73, 75, 77, 85, 86], '🌨', 'snow'],
  [[95, 96, 99], '⛈', 'thunderstorms'],
];

function describe(code) {
  for (const [codes, icon, summary] of WEATHER_CODES) {
    if (codes.includes(code)) return { icon, summary };
  }
  return { icon: '⛅', summary: 'mixed' };
}

const iso = (date) => new Date(date).toISOString().slice(0, 10);

/** How the trip's dates sit relative to what a forecast can cover. */
export function forecastCoverage(startDate, dayCount) {
  if (!startDate) return { covered: false, reason: 'no dates set for this trip' };
  const start = new Date(startDate);
  if (Number.isNaN(start.getTime())) return { covered: false, reason: 'trip dates are not readable' };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + Math.max(0, dayCount - 1));

  if (end < today) return { covered: false, reason: 'this trip is in the past' };
  const daysAhead = Math.round((start - today) / 86400000);
  if (daysAhead > FORECAST_HORIZON_DAYS) {
    return { covered: false, reason: `forecasts only reach ${FORECAST_HORIZON_DAYS} days out` };
  }
  return { covered: true, reason: '' };
}

/**
 * Daily forecast for the trip's location and dates, as DayWeather rows keyed
 * by the trip's own day numbers.
 */
export async function fetchForecast({ latitude, longitude, startDate, dayCount }) {
  const start = new Date(startDate);
  const end = new Date(start);
  end.setDate(end.getDate() + Math.max(0, dayCount - 1));

  const url = 'https://api.open-meteo.com/v1/forecast'
    + `?latitude=${latitude}&longitude=${longitude}`
    + '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max'
    + `&timezone=auto&start_date=${iso(start)}&end_date=${iso(end)}`;

  const data = await get(url);
  const daily = data?.daily;
  if (!daily?.time?.length) throw new Error('the forecast came back empty');

  // Open-Meteo renamed this field between API versions and still answers to
  // both, so read whichever came back.
  const codes = daily.weather_code || daily.weathercode || [];

  return daily.time.map((date, i) => {
    const { icon, summary } = describe(codes[i]);
    return {
      dayNumber: i + 1,
      date,
      icon,
      summary,
      high: Math.round(daily.temperature_2m_max?.[i] ?? 0),
      low: Math.round(daily.temperature_2m_min?.[i] ?? 0),
      rainChance: Math.round(daily.precipitation_probability_max?.[i] ?? 0),
    };
  });
}

// ---------------------------------------------------------------- geocoding

/**
 * Nominatim (OpenStreetMap). Free and keyless; its usage policy asks for low
 * volume and no bulk work, which is exactly one lookup when you add a place.
 * Results are biased towards the trip's own area so "Green Cross Pharmacy"
 * resolves near your hotel rather than in another country.
 */
export async function geocode(query, { latitude, longitude } = {}) {
  const box = (latitude && longitude)
    ? `&viewbox=${longitude - 0.15},${latitude + 0.15},${longitude + 0.15},${latitude - 0.15}&bounded=0`
    : '';
  const url = 'https://nominatim.openstreetmap.org/search'
    + `?format=jsonv2&limit=1&q=${encodeURIComponent(query)}${box}`;

  const results = await get(url);
  const hit = Array.isArray(results) ? results[0] : null;
  if (!hit) return null;
  return {
    latitude: Number(hit.lat),
    longitude: Number(hit.lon),
    label: hit.display_name,
  };
}

// ------------------------------------------------------------ exchange rate

/**
 * Frankfurter serves the European Central Bank's daily rates — free, keyless,
 * no card. Returns how many units of `from` make one unit of `to`, matching
 * how the app stores its rate (¥33.7 to the ringgit).
 */
export async function fetchRate(from, to) {
  if (!from || !to || from === to) return null;
  const url = `https://api.frankfurter.app/latest?from=${encodeURIComponent(to)}&to=${encodeURIComponent(from)}`;
  const data = await get(url);
  const rate = data?.rates?.[from];
  if (!rate) throw new Error(`no published rate for ${from} to ${to}`);
  return { rate: Number(rate), date: data.date };
}


// ------------------------------------------------------- pasted map links

/**
 * Pulls what it can out of a map URL without any paid API.
 *
 * A full Google Maps URL carries the place name and the coordinates in its
 * path, and Apple Maps puts them in the query — so both can be read here,
 * offline, for nothing. Short links (maps.app.goo.gl, goo.gl/maps) cannot:
 * resolving the redirect needs a server, and the browser is not allowed to
 * read where it points. The form says so rather than failing quietly.
 */
export function parseMapLink(text) {
  const raw = String(text || '').trim();
  if (!raw) return null;

  let url;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./, '');
  const shortHosts = ['maps.app.goo.gl', 'goo.gl', 'maps.google.app', 'g.co'];
  if (shortHosts.includes(host)) {
    return { kind: 'short', name: null, latitude: null, longitude: null };
  }

  const decode = (value) => {
    try {
      return decodeURIComponent(value.replace(/\+/g, ' ')).trim();
    } catch {
      return value.replace(/\+/g, ' ').trim();
    }
  };

  let name = null;
  let latitude = null;
  let longitude = null;

  // .../maps/place/Tsukiji+Outer+Market/@35.6654,139.7707,17z/...
  const place = /\/maps\/place\/([^/@]+)/.exec(url.pathname);
  if (place) name = decode(place[1]);

  const at = /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/.exec(url.pathname + url.hash);
  if (at) {
    latitude = Number(at[1]);
    longitude = Number(at[2]);
  }

  // Both Google and Apple accept ?q= and ?ll=/?daddr= in various shapes.
  const params = url.searchParams;
  const pair = (value) => {
    const hit = /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/.exec(value || '');
    return hit ? { latitude: Number(hit[1]), longitude: Number(hit[2]) } : null;
  };

  for (const key of ['ll', 'sll', 'daddr', 'destination', 'q', 'query']) {
    const value = params.get(key);
    if (!value) continue;
    const coords = pair(value);
    if (coords && latitude == null) {
      latitude = coords.latitude;
      longitude = coords.longitude;
    } else if (!coords && !name && !/^https?:/.test(value)) {
      name = decode(value);
    }
  }

  if (!name && !params.get('q')) {
    const apple = params.get('name') || params.get('address');
    if (apple) name = decode(apple);
  }

  const valid = latitude != null && Number.isFinite(latitude)
    && longitude != null && Number.isFinite(longitude)
    && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180;

  if (!name && !valid) return { kind: 'unknown', name: null, latitude: null, longitude: null };

  return {
    kind: 'link',
    name: name || null,
    latitude: valid ? latitude : null,
    longitude: valid ? longitude : null,
  };
}

/**
 * Whatever OpenStreetMap knows about a place beyond its position: opening
 * hours, a phone number, a website. Coverage is patchy — this is volunteer
 * data, not a commercial places database — so every field is optional.
 */
export async function placeDetails({ latitude, longitude, query }) {
  const url = latitude != null && longitude != null
    ? `https://nominatim.openstreetmap.org/reverse?format=jsonv2&extratags=1&lat=${latitude}&lon=${longitude}`
    : `https://nominatim.openstreetmap.org/search?format=jsonv2&extratags=1&limit=1&q=${encodeURIComponent(query)}`;

  const data = await get(url);
  const hit = Array.isArray(data) ? data[0] : data;
  if (!hit) return null;

  const tags = hit.extratags || {};
  return {
    name: hit.name || hit.namedetails?.name || null,
    latitude: hit.lat ? Number(hit.lat) : null,
    longitude: hit.lon ? Number(hit.lon) : null,
    address: hit.display_name || null,
    openingHours: tags.opening_hours || null,
    phone: tags.phone || tags['contact:phone'] || null,
    website: tags.website || tags['contact:website'] || null,
    category: hit.category || hit.type || null,
  };
}
