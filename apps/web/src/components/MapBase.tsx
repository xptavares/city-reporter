import type { ReactNode } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';

/** Leaflet map with OpenStreetMap tiles — the same open map the Urban Planning Dept. uses. */
export function MapBase({
  center,
  zoom,
  children,
}: {
  center: [number, number];
  zoom: number;
  children?: ReactNode;
}) {
  return (
    <MapContainer center={center} zoom={zoom} className="h-full w-full" scrollWheelZoom>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
      {children}
    </MapContainer>
  );
}
