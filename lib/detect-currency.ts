import { CURRENCIES } from "./currencies";

// ISO-3166 region → currency, derived from the dataset (first listing wins).
const REGION_TO_CURRENCY: Record<string, string> = {};
for (const c of CURRENCIES) {
  for (const r of c.regions) if (!REGION_TO_CURRENCY[r]) REGION_TO_CURRENCY[r] = c.code;
}

// IANA timezone → ISO-3166 country. Covers major population centres; anything
// missing falls through to locale-based detection below.
const TIMEZONE_TO_COUNTRY: Record<string, string> = {
  "Africa/Lagos": "NG",
  "Africa/Accra": "GH",
  "Africa/Nairobi": "KE",
  "Africa/Dar_es_Salaam": "TZ",
  "Africa/Kampala": "UG",
  "Africa/Johannesburg": "ZA",
  "Africa/Cairo": "EG",
  "Africa/Casablanca": "MA",
  "Africa/Algiers": "DZ",
  "Africa/Tunis": "TN",
  "Africa/Addis_Ababa": "ET",
  "Africa/Abidjan": "CI",
  "Africa/Dakar": "SN",
  "Africa/Khartoum": "SD",
  "Africa/Tripoli": "LY",
  "Africa/Kinshasa": "CD",
  "Africa/Luanda": "AO",
  "Africa/Lusaka": "ZM",
  "Africa/Harare": "ZW",
  "Africa/Maputo": "MZ",
  "America/New_York": "US",
  "America/Detroit": "US",
  "America/Chicago": "US",
  "America/Denver": "US",
  "America/Phoenix": "US",
  "America/Los_Angeles": "US",
  "America/Anchorage": "US",
  "Pacific/Honolulu": "US",
  "America/Toronto": "CA",
  "America/Vancouver": "CA",
  "America/Edmonton": "CA",
  "America/Winnipeg": "CA",
  "America/Mexico_City": "MX",
  "America/Tijuana": "MX",
  "America/Monterrey": "MX",
  "America/Sao_Paulo": "BR",
  "America/Bahia": "BR",
  "America/Fortaleza": "BR",
  "America/Manaus": "BR",
  "America/Buenos_Aires": "AR",
  "America/Argentina/Buenos_Aires": "AR",
  "America/Santiago": "CL",
  "America/Bogota": "CO",
  "America/Lima": "PE",
  "America/Caracas": "VE",
  "America/Montevideo": "UY",
  "America/La_Paz": "BO",
  "America/Asuncion": "PY",
  "America/Guayaquil": "EC",
  "America/Guatemala": "GT",
  "America/Costa_Rica": "CR",
  "America/Panama": "PA",
  "America/Santo_Domingo": "DO",
  "America/Jamaica": "JM",
  "America/Port_of_Spain": "TT",
  "America/Havana": "CU",
  "Asia/Tokyo": "JP",
  "Asia/Shanghai": "CN",
  "Asia/Hong_Kong": "HK",
  "Asia/Macau": "MO",
  "Asia/Taipei": "TW",
  "Asia/Seoul": "KR",
  "Asia/Singapore": "SG",
  "Asia/Kuala_Lumpur": "MY",
  "Asia/Bangkok": "TH",
  "Asia/Jakarta": "ID",
  "Asia/Manila": "PH",
  "Asia/Ho_Chi_Minh": "VN",
  "Asia/Yangon": "MM",
  "Asia/Phnom_Penh": "KH",
  "Asia/Vientiane": "LA",
  "Asia/Kolkata": "IN",
  "Asia/Calcutta": "IN",
  "Asia/Karachi": "PK",
  "Asia/Dhaka": "BD",
  "Asia/Colombo": "LK",
  "Asia/Kathmandu": "NP",
  "Asia/Thimphu": "BT",
  "Asia/Dubai": "AE",
  "Asia/Riyadh": "SA",
  "Asia/Qatar": "QA",
  "Asia/Kuwait": "KW",
  "Asia/Bahrain": "BH",
  "Asia/Muscat": "OM",
  "Asia/Amman": "JO",
  "Asia/Beirut": "LB",
  "Asia/Jerusalem": "IL",
  "Asia/Baghdad": "IQ",
  "Asia/Tehran": "IR",
  "Asia/Kabul": "AF",
  "Asia/Tashkent": "UZ",
  "Asia/Almaty": "KZ",
  "Asia/Baku": "AZ",
  "Asia/Tbilisi": "GE",
  "Asia/Yerevan": "AM",
  "Asia/Ulaanbaatar": "MN",
  "Europe/London": "GB",
  "Europe/Dublin": "IE",
  "Europe/Paris": "FR",
  "Europe/Berlin": "DE",
  "Europe/Madrid": "ES",
  "Europe/Rome": "IT",
  "Europe/Amsterdam": "NL",
  "Europe/Brussels": "BE",
  "Europe/Lisbon": "PT",
  "Europe/Vienna": "AT",
  "Europe/Zurich": "CH",
  "Europe/Athens": "GR",
  "Europe/Helsinki": "FI",
  "Europe/Stockholm": "SE",
  "Europe/Oslo": "NO",
  "Europe/Copenhagen": "DK",
  "Europe/Warsaw": "PL",
  "Europe/Prague": "CZ",
  "Europe/Budapest": "HU",
  "Europe/Bucharest": "RO",
  "Europe/Sofia": "BG",
  "Europe/Kyiv": "UA",
  "Europe/Kiev": "UA",
  "Europe/Moscow": "RU",
  "Europe/Istanbul": "TR",
  "Europe/Belgrade": "RS",
  "Europe/Zagreb": "HR",
  "Europe/Reykjavik": "IS",
  "Europe/Minsk": "BY",
  "Australia/Sydney": "AU",
  "Australia/Melbourne": "AU",
  "Australia/Brisbane": "AU",
  "Australia/Perth": "AU",
  "Pacific/Auckland": "NZ",
  "Pacific/Fiji": "FJ",
  "Pacific/Port_Moresby": "PG",
};

/**
 * Best-effort guess of the visitor's currency from their browser — no network,
 * no permission. Timezone (location) first, then explicit locale region, then
 * the language's likely region, falling back to USD.
 */
export function detectCurrency(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const country = tz ? TIMEZONE_TO_COUNTRY[tz] : undefined;
    if (country && REGION_TO_CURRENCY[country]) return REGION_TO_CURRENCY[country];

    const lang = (typeof navigator !== "undefined" && navigator.language) || "";
    if (lang) {
      const region = new Intl.Locale(lang).region;
      if (region && REGION_TO_CURRENCY[region]) return REGION_TO_CURRENCY[region];
      const likely = new Intl.Locale(lang).maximize().region;
      if (likely && REGION_TO_CURRENCY[likely]) return REGION_TO_CURRENCY[likely];
    }
  } catch {
    /* fall through */
  }
  return "USD";
}
