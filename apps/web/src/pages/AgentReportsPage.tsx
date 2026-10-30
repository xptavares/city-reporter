import { useState } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  REPORT_CATEGORIES,
  REPORT_STATUSES,
  type ReportCategory,
  type ReportSort,
  type ReportStatus,
} from '@city-reporter/shared';
import { useReports } from '../api/hooks';
import { StatusActions } from '../components/StatusActions';
import { StatusBadge } from '../components/StatusBadge';
import { CATEGORY_ICON, formatDate } from '../lib/reports';

const PAGE_SIZE = 20;
const selectClass =
  'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-brand-600/30 focus:outline-none';

/** Flow A1: the department's prioritized list of reports. */
export function AgentReportsPage() {
  const { t, i18n } = useTranslation();
  const [status, setStatus] = useState<ReportStatus | ''>('open');
  const [category, setCategory] = useState<ReportCategory | ''>('');
  const [sort, setSort] = useState<ReportSort>('upvotes');
  const [page, setPage] = useState(1);

  const { data, isPending, isError, refetch } = useReports({
    status: status || undefined,
    category: category || undefined,
    sort,
    page,
    pageSize: PAGE_SIZE,
  });
  const pages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  // Changing a filter goes back to the first page.
  const filter =
    <T,>(set: (v: T) => void) =>
    (v: T) => {
      set(v);
      setPage(1);
    };

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-5xl px-4 py-6">
        <h1 className="text-2xl font-bold text-navy">{t('agent.title')}</h1>
        <p className="mt-1 text-slate-600">{t('agent.subtitle')}</p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <select
            aria-label={t('agent.allStatuses')}
            value={status}
            onChange={(e) => filter(setStatus)(e.target.value as ReportStatus | '')}
            className={selectClass}
          >
            <option value="">{t('agent.allStatuses')}</option>
            {REPORT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {t(`status.${s}`)}
              </option>
            ))}
          </select>
          <select
            aria-label={t('agent.allCategories')}
            value={category}
            onChange={(e) => filter(setCategory)(e.target.value as ReportCategory | '')}
            className={selectClass}
          >
            <option value="">{t('agent.allCategories')}</option>
            {REPORT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {t(`category.${c}`)}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            {t('agent.sort')}
            <select
              value={sort}
              onChange={(e) => filter(setSort)(e.target.value as ReportSort)}
              className={selectClass}
            >
              <option value="upvotes">{t('agent.sortUpvotes')}</option>
              <option value="recent">{t('agent.sortRecent')}</option>
            </select>
          </label>
          {data && (
            <span className="ml-auto text-sm text-slate-500">
              {t('agent.total', { count: data.total })}
            </span>
          )}
        </div>

        {isPending && <p className="mt-6 text-slate-500">{t('common.loading')}</p>}
        {isError && (
          <p className="mt-6 text-red-700">
            {t('common.error')}{' '}
            <button onClick={() => refetch()} className="underline">
              {t('common.retry')}
            </button>
          </p>
        )}
        {data?.items.length === 0 && <p className="mt-6 text-slate-500">{t('agent.empty')}</p>}

        <ol className="mt-4 space-y-3">
          {data?.items.map((report) => (
            <li
              key={report.id}
              className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center"
            >
              <div className="flex w-16 shrink-0 flex-row items-baseline gap-2 sm:flex-col sm:items-center sm:gap-0">
                <span className="text-2xl font-bold text-navy">{report.upvoteCount}</span>
                <span className="text-xs text-slate-500">👍</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span aria-hidden="true">{CATEGORY_ICON[report.category]}</span>
                  <span className="font-semibold text-navy">{t(`category.${report.category}`)}</span>
                  <StatusBadge status={report.status} />
                </div>
                {report.description && (
                  <p className="mt-1 truncate text-sm text-slate-700">{report.description}</p>
                )}
                <p className="mt-1 text-xs text-slate-500">
                  {t('report.reportedOn', { date: formatDate(report.createdAt, i18n.language) })}
                  {' · '}
                  <Link
                    to={`/?report=${report.id}&lat=${report.lat}&lng=${report.lng}`}
                    className="font-medium text-brand-700 underline"
                  >
                    {t('report.viewOnMap')}
                  </Link>
                </p>
              </div>
              <StatusActions id={report.id} status={report.status} />
            </li>
          ))}
        </ol>

        {data && pages > 1 && (
          <nav className="mt-6 flex items-center justify-center gap-3 text-sm">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="rounded-md px-3 py-1.5 ring-1 ring-slate-300 disabled:opacity-40"
            >
              {t('agent.previous')}
            </button>
            <span>{t('agent.page', { page, pages })}</span>
            <button
              disabled={page >= pages}
              onClick={() => setPage(page + 1)}
              className="rounded-md px-3 py-1.5 ring-1 ring-slate-300 disabled:opacity-40"
            >
              {t('agent.next')}
            </button>
          </nav>
        )}
      </div>
    </div>
  );
}
