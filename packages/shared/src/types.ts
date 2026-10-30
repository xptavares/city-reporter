import type { ReportCategory, ReportStatus, Role } from './enums';

// API response shapes. None of them carry another user's identity (decision 010).

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export type AuthResponse = {
  token: string;
  user: User;
};

/** Lightweight map pin: no upvote count, so upvotes don't invalidate the map cache. */
export type ReportPin = {
  id: string;
  category: ReportCategory;
  status: ReportStatus;
  lat: number;
  lng: number;
};

export type Report = ReportPin & {
  description: string | null;
  upvoteCount: number;
  createdAt: string;
  statusChangedAt: string | null;
};

export type ReportDetails = Report & {
  upvotedByMe: boolean;
};

export type Page<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};
