import { env } from "@/config/env";
import { apiClient } from "@/lib/api/client";

export interface PlacePrediction {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

export interface ResolvedMapAddress {
  estado: string;
  municipio: string;
  colonia: string;
  calle: string;
  numero: string;
  cp: string;
  formattedAddress: string;
  lat: number | null;
  lng: number | null;
}

export async function searchAddressPredictions(
  query: string,
  coords?: { lat: number; lng: number } | null,
  mode?: "all" | "cities",
): Promise<PlacePrediction[]> {
  const params: Record<string, string | number> = { q: query };
  if (coords) {
    params.lat = coords.lat;
    params.lng = coords.lng;
  }
  if (mode) {
    params.mode = mode;
  }

  const { data } = await apiClient.get<{
    ok: boolean;
    predictions?: PlacePrediction[];
  }>("/autocomplete", {
    baseURL: env.mapsApiUrl,
    params,
  });

  return data.predictions ?? [];
}

export async function fetchPlaceDetails(
  placeId: string,
): Promise<ResolvedMapAddress> {
  const { data } = await apiClient.get<{
    ok: boolean;
    address: ResolvedMapAddress;
  }>("/place", {
    baseURL: env.mapsApiUrl,
    params: { placeId },
  });

  return data.address;
}

export async function reverseGeocodeCoords(
  lat: number,
  lng: number,
): Promise<ResolvedMapAddress | null> {
  const { data } = await apiClient.get<{
    ok: boolean;
    address: ResolvedMapAddress | null;
  }>("/reverse", {
    baseURL: env.mapsApiUrl,
    params: { lat, lng },
  });

  return data.address ?? null;
}

export async function forwardGeocodeAddress(
  address: string,
): Promise<ResolvedMapAddress | null> {
  const { data } = await apiClient.get<{
    ok: boolean;
    address: ResolvedMapAddress | null;
  }>("/geocode", {
    baseURL: env.mapsApiUrl,
    params: { address },
  });

  return data.address ?? null;
}
