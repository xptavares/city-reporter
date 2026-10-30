import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Marker, useMap, useMapEvents } from 'react-leaflet';
import type { LatLngBounds } from 'leaflet';
import { useTranslation } from 'react-i18next';
import { REPORT_STATUSES } from '@city-reporter/shared';
import { useMapPins } from '../api/hooks';
import { useAuth } from '../auth/AuthContext';
import { MapBase } from '../components/MapBase';
import { ReportPanel } from '../components/ReportPanel';
import { PELOTAS_CENTER, pinIcon } from '../lib/reports';

/** "minLng,minLat,maxLng,maxLat", rounded so tiny pans reuse the same query key. */
function toBbox(bounds: LatLngBounds): string {
  const clampLng = (lng: number) => Math.max(-180, Math.min(180, lng));
  return [
    clampLng(bounds.getWest()),
    bounds.getSouth(),
    clampLng(bounds.getEast()),
    bounds.getNorth(),
  ]
    .map((n) => n.toFixed(4))
    .join(',');
}

/** Reports the visible area on load and after every pan/zoom. */
function BboxWatcher({ onChange }: { onChange: (bbox: string) => void }) {
  const map = useMap();
  useMapEvents({ moveend: () => onChange(toBbox(map.getBounds())) });
  useEffect(() => onChange(toBbox(map.getBounds())), [map, onChange]);
  return null;
}

export function MapPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const selectedId = params.get('report');
  const [bbox, setBbox] = useState<string | null>(null);
  const pins = useMapPins(bbox);

  // Deep links (?report=…&lat=…&lng=…) from the agent list or a new report open centered on it.
  const lat = Number(params.get('lat'));
  const lng = Number(params.get('lng'));
  const hasTarget = params.has('lat') && Number.isFinite(lat) && Number.isFinite(lng);
  const [initialCenter] = useState<[number, number]>(hasTarget ? [lat, lng] : PELOTAS_CENTER);

  const select = (id: string | null) =>
    setParams(id ? { report: id } : {}, { replace: true });

  return (
    <div className="relative h-full">
      <MapBase center={initialCenter} zoom={hasTarget ? 17 : 15}>
        <BboxWatcher onChange={setBbox} />
        {pins.data?.map((pin) => (
          <Marker
            key={pin.id}
            position={[pin.lat, pin.lng]}
            icon={pinIcon(pin.category, pin.status, pin.id === selectedId)}
            title={`${t(`category.${pin.category}`)} — ${t(`status.${pin.status}`)}`}
            alt={t(`category.${pin.category}`)}
            eventHandlers={{ click: () => select(pin.id) }}
          />
        ))}
      </MapBase>

      <div className="pointer-events-none absolute top-3 left-14 z-[1000] flex flex-col gap-2">
        <p className="rounded-full bg-white/95 px-3 py-1 text-sm font-medium text-slate-700 shadow">
          {pins.isPending ? t('map.loading') : t('map.count', { count: pins.data?.length ?? 0 })}
        </p>
        <ul
          aria-label={t('map.legend')}
          className="flex gap-3 rounded-full bg-white/95 px-3 py-1 text-xs text-slate-700 shadow"
        >
          {REPORT_STATUSES.map((status) => (
            <li key={status} className="flex items-center gap-1">
              <span className={`pin pin-${status} !h-3 !w-3 !border-2`} aria-hidden="true" />
              {t(`status.${status}`)}
            </li>
          ))}
        </ul>
      </div>

      {selectedId ? (
        <ReportPanel id={selectedId} onClose={() => select(null)} />
      ) : (
        user && (
          <Link
            to="/report/new"
            className="absolute right-4 bottom-6 z-[1000] rounded-full bg-tactile px-5 py-3 font-bold text-navy shadow-lg hover:brightness-95 focus:ring-4 focus:ring-navy/40 focus:outline-none"
          >
            ＋ {t('nav.report')}
          </Link>
        )
      )}
    </div>
  );
}
