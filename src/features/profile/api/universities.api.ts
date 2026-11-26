export interface UniversitySuggestion {
  id: string;
  name: string;
  acronym: string;
  city: string;
  state: string;
  country: string;
  countryCode: string;
}

interface RorName {
  lang?: string | null;
  types?: string[];
  value?: string;
}

interface RorLocation {
  geonames_details?: {
    name?: string;
    country_subdivision_name?: string;
    country_name?: string;
    country_code?: string;
  };
}

interface RorItem {
  id: string;
  names?: RorName[];
  locations?: RorLocation[];
}

const ROR_API_URL = "https://api.ror.org/v2/organizations";
const CACHE_TTL_MS = 1000 * 60 * 15;

const cache = new Map<
  string,
  { expiresAt: number; data: UniversitySuggestion[] }
>();

function pickBestName(names?: RorName[]): string {
  if (!Array.isArray(names) || names.length === 0) return "";

  const esDisplay = names.find(
    (n) => n.lang === "es" && n.types?.includes("ror_display"),
  );
  if (esDisplay?.value) return esDisplay.value.trim();

  const esLabel = names.find(
    (n) => n.lang === "es" && n.types?.includes("label"),
  );
  if (esLabel?.value) return esLabel.value.trim();

  const rorDisplay = names.find((n) => n.types?.includes("ror_display"));
  if (rorDisplay?.value) return rorDisplay.value.trim();

  const anyLabel = names.find((n) => n.types?.includes("label"));
  if (anyLabel?.value) return anyLabel.value.trim();

  return (names[0]?.value ?? "").trim();
}

function pickAcronym(names?: RorName[]): string {
  if (!Array.isArray(names)) return "";

  const esAcronym = names.find(
    (n) => n.lang === "es" && n.types?.includes("acronym"),
  );
  if (esAcronym?.value) return esAcronym.value.trim();

  const anyAcronym = names.find((n) => n.types?.includes("acronym"));
  return (anyAcronym?.value ?? "").trim();
}

function normalizeOrganization(item: RorItem): UniversitySuggestion | null {
  const name = pickBestName(item.names);
  if (!name) return null;

  const loc = item.locations?.[0]?.geonames_details;
  return {
    id: item.id,
    name,
    acronym: pickAcronym(item.names),
    city: loc?.name ?? "",
    state: loc?.country_subdivision_name ?? "",
    country: loc?.country_name ?? "",
    countryCode: loc?.country_code ?? "",
  };
}

async function queryRor(query: string, mexicoOnly: boolean): Promise<RorItem[]> {
  const filter = mexicoOnly
    ? "types:education,locations.geonames_details.country_code:MX"
    : "types:education";

  const params = new URLSearchParams({ query, filter });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);

  try {
    const res = await fetch(`${ROR_API_URL}?${params.toString()}`, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { items?: RorItem[] };
    return Array.isArray(data.items) ? data.items : [];
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Consulta directa a ROR API v2 (pública, HTTPS, CC0 y sin API key).
 * Prioriza instituciones educativas de México y complementa con resultados globales.
 */
export async function searchUniversities(
  query: string,
): Promise<UniversitySuggestion[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const cacheKey = trimmed.toLowerCase();
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const [mxItems, globalItems] = await Promise.all([
    queryRor(trimmed, true),
    queryRor(trimmed, false),
  ]);

  const seen = new Set<string>();
  const results: UniversitySuggestion[] = [];

  for (const raw of [...mxItems, ...globalItems]) {
    if (!raw?.id || seen.has(raw.id)) continue;
    seen.add(raw.id);

    const normalized = normalizeOrganization(raw);
    if (normalized) {
      results.push(normalized);
    }

    if (results.length >= 8) break;
  }

  cache.set(cacheKey, {
    data: results,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });

  return results;
}
