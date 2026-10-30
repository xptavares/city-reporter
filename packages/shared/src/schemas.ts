import { z } from 'zod';
import { REPORT_CATEGORIES, REPORT_STATUSES } from './enums';

// ---- Auth ----

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.email().trim().toLowerCase(),
  password: z.string().min(8).max(72), // bcrypt only uses the first 72 bytes
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.email().trim().toLowerCase(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof loginSchema>;

// ---- Reports ----

export const createReportSchema = z.object({
  category: z.enum(REPORT_CATEGORIES),
  description: z.string().trim().max(500).optional(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});
export type CreateReportInput = z.infer<typeof createReportSchema>;

export const updateStatusSchema = z.object({
  status: z.enum(REPORT_STATUSES),
});
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;

/** `bbox=minLng,minLat,maxLng,maxLat` — the visible map area. */
export const mapQuerySchema = z.object({
  bbox: z
    .string()
    .transform((value) => value.split(',').map(Number))
    .pipe(
      z
        .tuple([
          z.number().min(-180).max(180),
          z.number().min(-90).max(90),
          z.number().min(-180).max(180),
          z.number().min(-90).max(90),
        ])
        .refine(([minLng, minLat, maxLng, maxLat]) => minLng < maxLng && minLat < maxLat, {
          message: 'bbox must be minLng,minLat,maxLng,maxLat',
        }),
    ),
});
export type MapQuery = z.infer<typeof mapQuerySchema>;

export const REPORT_SORTS = ['upvotes', 'recent'] as const;
export type ReportSort = (typeof REPORT_SORTS)[number];

export const listReportsQuerySchema = z.object({
  status: z.enum(REPORT_STATUSES).optional(),
  category: z.enum(REPORT_CATEGORIES).optional(),
  sort: z.enum(REPORT_SORTS).default('upvotes'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListReportsQuery = z.infer<typeof listReportsQuerySchema>;
