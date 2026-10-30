export const ROLES = ['citizen', 'agent'] as const;
export type Role = (typeof ROLES)[number];

export const REPORT_STATUSES = ['open', 'fixed', 'not_found'] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

export const REPORT_CATEGORIES = [
  'pothole',
  'broken_sidewalk',
  'missing_tactile_paving',
  'sidewalk_obstruction',
  'lighting',
  'signage',
  'other',
] as const;
export type ReportCategory = (typeof REPORT_CATEGORIES)[number];
