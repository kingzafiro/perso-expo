export interface MapCoords {
  lat: number;
  lng: number;
}

export interface InteractiveAddressMapProps {
  coords: MapCoords | null;
  secondaryCoords?: MapCoords | null;
  primaryLabel?: string;
  secondaryLabel?: string;
  distanceBadge?: string;
  showRouteLine?: boolean;
  height?: number;
  readOnly?: boolean;
  isResolving?: boolean;
  isLocating?: boolean;
  onSelectCoords?: (coords: MapCoords) => void;
  onRequestCurrentLocation?: () => void;
  onMapInteractionChange?: (interacting: boolean) => void;
}
