// Slippy-map tile math (the same z/x/y grid OpenStreetMap uses).
// Caching by tile instead of by exact bbox lets users looking at the same area share cache entries.

export type Tile = { z: number; x: number; y: number };
/** [minLng, minLat, maxLng, maxLat] */
export type Bbox = [number, number, number, number];

const MAX_LAT = 85.0511287798; // Web Mercator limit

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function lngToX(lng: number, z: number): number {
  return clamp(Math.floor(((lng + 180) / 360) * 2 ** z), 0, 2 ** z - 1);
}

function latToY(lat: number, z: number): number {
  const rad = (clamp(lat, -MAX_LAT, MAX_LAT) * Math.PI) / 180;
  const y = ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * 2 ** z;
  return clamp(Math.floor(y), 0, 2 ** z - 1);
}

const xToLng = (x: number, z: number) => (x / 2 ** z) * 360 - 180;
const yToLat = (y: number, z: number) =>
  (Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / 2 ** z))) * 180) / Math.PI;

/** Tiles covering the bbox, or `null` if there would be more than `maxTiles`. */
export function tilesForBbox(bbox: Bbox, z: number, maxTiles: number): Tile[] | null {
  const [minLng, minLat, maxLng, maxLat] = bbox;
  const [x0, x1] = [lngToX(minLng, z), lngToX(maxLng, z)];
  const [y0, y1] = [latToY(maxLat, z), latToY(minLat, z)]; // y grows southwards
  if ((x1 - x0 + 1) * (y1 - y0 + 1) > maxTiles) return null;

  const tiles: Tile[] = [];
  for (let x = x0; x <= x1; x++) {
    for (let y = y0; y <= y1; y++) tiles.push({ z, x, y });
  }
  return tiles;
}

export function tileBbox({ z, x, y }: Tile): Bbox {
  return [xToLng(x, z), yToLat(y + 1, z), xToLng(x + 1, z), yToLat(y, z)];
}

export function bboxContains([minLng, minLat, maxLng, maxLat]: Bbox, lng: number, lat: number) {
  return lng >= minLng && lng <= maxLng && lat >= minLat && lat <= maxLat;
}
