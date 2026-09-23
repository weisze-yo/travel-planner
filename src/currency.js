// A small, keyless country → currency lookup — no paid API, just ISO 3166-1
// and ISO 4217 baked in as data. This is what lets a new trip's currency
// come from the city typed into "City or area" (by way of the country in
// Nominatim's reverse-geocoded result) instead of silently inheriting
// whatever the demo trip happens to be set to.

/** ISO 3166-1 alpha-2 (lowercase, matching Nominatim's `address.country_code`) to ISO 4217. */
const COUNTRY_CURRENCY = {
  // Europe
  ad: 'EUR', al: 'ALL', at: 'EUR', ba: 'BAM', be: 'EUR', bg: 'BGN', by: 'BYN',
  ch: 'CHF', cy: 'EUR', cz: 'CZK', de: 'EUR', dk: 'DKK', ee: 'EUR', es: 'EUR',
  fi: 'EUR', fr: 'EUR', gb: 'GBP', gg: 'GBP', gi: 'GIP', gr: 'EUR', hr: 'EUR',
  hu: 'HUF', ie: 'EUR', im: 'GBP', is: 'ISK', it: 'EUR', je: 'GBP', li: 'CHF',
  lt: 'EUR', lu: 'EUR', lv: 'EUR', mc: 'EUR', md: 'MDL', me: 'EUR', mk: 'MKD',
  mt: 'EUR', nl: 'EUR', no: 'NOK', pl: 'PLN', pt: 'EUR', ro: 'RON', rs: 'RSD',
  ru: 'RUB', se: 'SEK', si: 'EUR', sk: 'EUR', sm: 'EUR', ua: 'UAH', va: 'EUR',
  xk: 'EUR',

  // North & Central America, Caribbean
  us: 'USD', ca: 'CAD', mx: 'MXN', bz: 'BZD', cr: 'CRC', sv: 'USD', gt: 'GTQ',
  hn: 'HNL', ni: 'NIO', pa: 'PAB', cu: 'CUP', do: 'DOP', ht: 'HTG', jm: 'JMD',
  tt: 'TTD', bs: 'BSD', bb: 'BBD', gl: 'DKK',

  // South America
  ar: 'ARS', bo: 'BOB', br: 'BRL', cl: 'CLP', co: 'COP', ec: 'USD', gy: 'GYD',
  py: 'PYG', pe: 'PEN', sr: 'SRD', uy: 'UYU', ve: 'VES',

  // Middle East
  ae: 'AED', bh: 'BHD', il: 'ILS', ps: 'ILS', iq: 'IQD', ir: 'IRR', jo: 'JOD',
  kw: 'KWD', lb: 'LBP', om: 'OMR', qa: 'QAR', sa: 'SAR', sy: 'SYP', ye: 'YER',
  tr: 'TRY',

  // Africa
  dz: 'DZD', eg: 'EGP', ly: 'LYD', ma: 'MAD', tn: 'TND', sd: 'SDG', ss: 'SSP',
  ng: 'NGN', gh: 'GHS', ci: 'XOF', sn: 'XOF', ml: 'XOF', bf: 'XOF', ne: 'XOF',
  tg: 'XOF', bj: 'XOF', gw: 'XOF', cm: 'XAF', td: 'XAF', cf: 'XAF', cg: 'XAF',
  ga: 'XAF', gq: 'XAF', ke: 'KES', tz: 'TZS', ug: 'UGX', rw: 'RWF', et: 'ETB',
  so: 'SOS', dj: 'DJF', er: 'ERN', za: 'ZAR', na: 'NAD', bw: 'BWP', ls: 'LSL',
  sz: 'SZL', zm: 'ZMW', zw: 'ZWL', mz: 'MZN', mw: 'MWK', ao: 'AOA', mg: 'MGA',
  mu: 'MUR', sc: 'SCR', cv: 'CVE', gm: 'GMD', gn: 'GNF', lr: 'LRD', sl: 'SLE',

  // Asia
  cn: 'CNY', hk: 'HKD', mo: 'MOP', tw: 'TWD', jp: 'JPY', kr: 'KRW', kp: 'KPW',
  mn: 'MNT', in: 'INR', pk: 'PKR', bd: 'BDT', lk: 'LKR', np: 'NPR', bt: 'BTN',
  mv: 'MVR', mm: 'MMK', th: 'THB', la: 'LAK', kh: 'KHR', vn: 'VND', my: 'MYR',
  sg: 'SGD', id: 'IDR', bn: 'BND', ph: 'PHP', tl: 'USD', kz: 'KZT', uz: 'UZS',
  tm: 'TMT', tj: 'TJS', kg: 'KGS', af: 'AFN', am: 'AMD', az: 'AZN', ge: 'GEL',

  // Oceania
  au: 'AUD', nz: 'NZD', fj: 'FJD', pg: 'PGK', ws: 'WST', to: 'TOP', vu: 'VUV',
  sb: 'SBD', nc: 'XPF', pf: 'XPF', ck: 'NZD', ki: 'AUD', nr: 'AUD', tv: 'AUD',
  fm: 'USD', mh: 'USD', pw: 'USD',
};

/** Currencies common enough on a trip to be worth a real symbol; the rest just show their code. */
const SYMBOLS = {
  USD: '$', EUR: '€', GBP: '£', JPY: '¥', CNY: '¥', KRW: '₩', INR: '₹',
  THB: '฿', VND: '₫', PHP: '₱', IDR: 'Rp', MYR: 'RM', SGD: 'S$', HKD: 'HK$',
  TWD: 'NT$', AUD: 'A$', NZD: 'NZ$', CAD: 'C$', CHF: 'CHF', ISK: 'kr',
  DKK: 'kr', SEK: 'kr', NOK: 'kr', PLN: 'zł', CZK: 'Kč', HUF: 'Ft',
  RON: 'lei', TRY: '₺', ILS: '₪', ZAR: 'R', BRL: 'R$', ARS: '$', MXN: '$',
  RUB: '₽', AED: 'د.إ', SAR: '﷼', PKR: '₨', BDT: '৳', LKR: '₨', NGN: '₦',
  EGP: '£', KES: 'KSh',
};

/**
 * The currency a country typically prices in, or null when the country is
 * not recognised (a Nominatim result with no country, or one this small
 * table has no entry for). Never guesses — a null here means the caller
 * should leave currency unset rather than assume anything.
 */
export function currencyForCountry(countryCode) {
  const code = COUNTRY_CURRENCY[String(countryCode || '').toLowerCase()];
  if (!code) return null;
  return { code, symbol: SYMBOLS[code] || code };
}
