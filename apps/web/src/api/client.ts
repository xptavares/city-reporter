import type {
  AuthResponse,
  CreateReportInput,
  ListReportsQuery,
  LoginInput,
  Page,
  RegisterInput,
  Report,
  ReportDetails,
  ReportPin,
  ReportStatus,
  User,
} from '@city-reporter/shared';
import { getToken } from '../auth/token';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Called on any 401 so the app can drop a stale token. */
let onUnauthorized: () => void = () => {};
export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = getToken();
  const res = await fetch(`/api${path}`, {
    method,
    headers: {
      ...(body !== undefined && { 'Content-Type': 'application/json' }),
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && token) onUnauthorized();
    throw new ApiError(res.status, data.error ?? res.statusText);
  }
  return data as T;
}

type UpvoteResult = { upvoteCount: number; upvotedByMe: boolean };

function toQueryString(params: Record<string, string | number | undefined>) {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== '');
  return new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString();
}

export const api = {
  register: (input: RegisterInput) => request<AuthResponse>('POST', '/auth/register', input),
  login: (input: LoginInput) => request<AuthResponse>('POST', '/auth/login', input),
  me: () => request<User>('GET', '/auth/me'),

  mapPins: (bbox: string) => request<ReportPin[]>('GET', `/reports/map?bbox=${bbox}`),
  report: (id: string) => request<ReportDetails>('GET', `/reports/${id}`),
  createReport: (input: CreateReportInput) => request<Report>('POST', '/reports', input),
  upvote: (id: string) => request<UpvoteResult>('PUT', `/reports/${id}/upvote`),
  removeUpvote: (id: string) => request<UpvoteResult>('DELETE', `/reports/${id}/upvote`),

  listReports: (query: Partial<ListReportsQuery>) =>
    request<Page<Report>>('GET', `/reports?${toQueryString(query)}`),
  updateStatus: (id: string, status: ReportStatus) =>
    request<Report>('PATCH', `/reports/${id}/status`, { status }),
};
