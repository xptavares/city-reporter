import L from 'leaflet';
import type { ReportCategory, ReportStatus } from '@city-reporter/shared';

/** Pelotas downtown. */
export const PELOTAS_CENTER: [number, number] = [-31.7654, -52.3376];

export const CATEGORY_ICON: Record<ReportCategory, string> = {
  pothole: '🕳️',
  broken_sidewalk: '🧱',
  missing_tactile_paving: '🦯',
  sidewalk_obstruction: '🚧',
  lighting: '💡',
  signage: '🚦',
  other: '📍',
};

export const STATUS_BADGE: Record<ReportStatus, string> = {
  open: 'bg-red-100 text-red-800 ring-red-600/20',
  fixed: 'bg-green-100 text-green-800 ring-green-600/20',
  not_found: 'bg-slate-100 text-slate-700 ring-slate-500/20',
};

/** Leaflet marker: category emoji inside a ring colored by status. */
export function pinIcon(category: ReportCategory, variant: ReportStatus | 'draft', selected = false) {
  return L.divIcon({
    className: '', // drop Leaflet's default white square
    html: `<div class="pin pin-${variant}${selected ? ' pin-selected' : ''}" aria-hidden="true">${CATEGORY_ICON[category]}</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
}

export function formatDate(iso: string, language: string) {
  return new Intl.DateTimeFormat(language, { dateStyle: 'medium' }).format(new Date(iso));
}
