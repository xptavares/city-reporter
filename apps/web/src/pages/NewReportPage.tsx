import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Marker, useMap, useMapEvents } from 'react-leaflet';
import { useTranslation } from 'react-i18next';
import { REPORT_CATEGORIES, type ReportCategory } from '@city-reporter/shared';
import { useCreateReport } from '../api/hooks';
import { MapBase } from '../components/MapBase';
import { CATEGORY_ICON, PELOTAS_CENTER, pinIcon } from '../lib/reports';

type Point = { lat: number; lng: number };

/** Flow C1, location step: tap the map to place the pin. */
function TapToPlace({ onPick }: { onPick: (p: Point) => void }) {
  useMapEvents({ click: (e) => onPick({ lat: e.latlng.lat, lng: e.latlng.lng }) });
  return null;
}

/** Moves the map when the point comes from GPS. */
function FlyTo({ point }: { point: Point | null }) {
  const map = useMap();
  useEffect(() => {
    if (point) map.flyTo([point.lat, point.lng], 18);
  }, [map, point]);
  return null;
}

export function NewReportPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const create = useCreateReport();
  const [category, setCategory] = useState<ReportCategory | null>(null);
  const [point, setPoint] = useState<Point | null>(null);
  const [gpsPoint, setGpsPoint] = useState<Point | null>(null);
  const [description, setDescription] = useState('');
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState(false);

  const useMyLocation = () => {
    // Geolocation needs a secure context (https or localhost).
    if (!navigator.geolocation) return setLocationError(true);
    setLocating(true);
    setLocationError(false);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const p = { lat: coords.latitude, lng: coords.longitude };
        setPoint(p);
        setGpsPoint(p);
        setLocating(false);
      },
      () => {
        setLocationError(true);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  };

  const submit = () => {
    if (!category || !point) return;
    create.mutate(
      { category, ...point, description: description.trim() || undefined },
      {
        onSuccess: (report) =>
          navigate(`/?report=${report.id}&lat=${report.lat}&lng=${report.lng}`),
      },
    );
  };

  const stepTitle = 'mb-3 text-base font-bold text-navy';

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-6 pb-28">
        <h1 className="text-2xl font-bold text-navy">{t('newReport.title')}</h1>

        <section>
          <h2 className={stepTitle}>{t('newReport.step1')}</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {REPORT_CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={category === c}
                onClick={() => setCategory(c)}
                className={`flex items-center gap-2 rounded-xl border-2 bg-white px-3 py-3 text-left text-sm font-medium transition focus:ring-2 focus:ring-brand-600 focus:outline-none ${
                  category === c
                    ? 'border-brand-600 bg-brand-50 text-brand-700'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <span className="text-xl" aria-hidden="true">
                  {CATEGORY_ICON[c]}
                </span>
                {t(`category.${c}`)}
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2 className={stepTitle}>{t('newReport.step2')}</h2>
          <button
            type="button"
            onClick={useMyLocation}
            disabled={locating}
            className="mb-2 w-full rounded-lg bg-navy px-4 py-2.5 font-semibold text-white hover:bg-navy/90 focus:ring-2 focus:ring-navy focus:ring-offset-2 focus:outline-none disabled:opacity-60 sm:w-auto"
          >
            📍 {locating ? t('newReport.locating') : t('newReport.useMyLocation')}
          </button>
          <p className={`mb-2 text-sm ${locationError ? 'text-red-700' : 'text-slate-500'}`}>
            {locationError ? t('newReport.locationError') : t('newReport.pickHint')}
          </p>
          <div className="h-72 overflow-hidden rounded-xl border border-slate-200 sm:h-80">
            <MapBase center={PELOTAS_CENTER} zoom={15}>
              <TapToPlace onPick={setPoint} />
              <FlyTo point={gpsPoint} />
              {point && (
                <Marker
                  position={[point.lat, point.lng]}
                  draggable
                  icon={pinIcon(category ?? 'other', 'draft')}
                  eventHandlers={{
                    dragend: (e) => {
                      const { lat, lng } = e.target.getLatLng();
                      setPoint({ lat, lng });
                    },
                  }}
                />
              )}
            </MapBase>
          </div>
        </section>

        <section>
          <label htmlFor="description" className={`block ${stepTitle}`}>
            {t('newReport.step3')}
          </label>
          <textarea
            id="description"
            maxLength={500}
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('newReport.descriptionPlaceholder')}
            className="block w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-600 focus:ring-2 focus:ring-brand-600/30 focus:outline-none"
          />
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-[1000] border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <p role="status" className="flex-1 text-sm text-slate-600">
            {create.isError
              ? t('newReport.error')
              : !category || !point
                ? t('newReport.missing')
                : ''}
          </p>
          <button
            type="button"
            onClick={submit}
            disabled={!category || !point || create.isPending}
            className="rounded-lg bg-tactile px-5 py-2.5 font-bold text-navy hover:brightness-95 focus:ring-2 focus:ring-navy focus:ring-offset-2 focus:outline-none disabled:opacity-50"
          >
            {create.isPending ? t('newReport.sending') : t('newReport.submit')}
          </button>
        </div>
      </div>
    </div>
  );
}
