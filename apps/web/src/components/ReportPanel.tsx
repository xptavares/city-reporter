import { useTranslation } from 'react-i18next';
import { useReport, useToggleUpvote } from '../api/hooks';
import { useAuth } from '../auth/AuthContext';
import { CATEGORY_ICON, formatDate } from '../lib/reports';
import { StatusBadge } from './StatusBadge';
import { StatusActions } from './StatusActions';

/** Report details: bottom sheet on phones, floating card on larger screens. */
export function ReportPanel({ id, onClose }: { id: string; onClose: () => void }) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { data: report, isPending, isError } = useReport(id);
  const toggleUpvote = useToggleUpvote(id);

  return (
    <section
      aria-label={report ? t(`category.${report.category}`) : undefined}
      className="absolute inset-x-0 bottom-0 z-[1000] max-h-[60%] overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl sm:inset-x-auto sm:top-4 sm:right-4 sm:bottom-auto sm:w-96 sm:rounded-2xl"
    >
      <button
        onClick={onClose}
        aria-label={t('report.close')}
        className="absolute top-3 right-3 rounded-full p-2 text-slate-500 hover:bg-slate-100"
      >
        ✕
      </button>

      {isPending && <p className="text-slate-500">{t('common.loading')}</p>}
      {isError && <p className="text-red-700">{t('common.error')}</p>}

      {report && (
        <div className="space-y-3">
          <div className="flex items-start gap-3 pr-8">
            <span className="text-3xl" aria-hidden="true">
              {CATEGORY_ICON[report.category]}
            </span>
            <div>
              <h2 className="text-lg leading-tight font-bold text-navy">
                {t(`category.${report.category}`)}
              </h2>
              <div className="mt-1">
                <StatusBadge status={report.status} />
              </div>
            </div>
          </div>

          <p className={report.description ? 'text-slate-800' : 'text-slate-500 italic'}>
            {report.description || t('report.noDescription')}
          </p>

          <p className="text-sm text-slate-500">
            {t('report.reportedOn', { date: formatDate(report.createdAt, i18n.language) })}
            {report.statusChangedAt && (
              <>
                <br />
                {t('report.statusChangedOn', {
                  date: formatDate(report.statusChangedAt, i18n.language),
                })}
              </>
            )}
          </p>

          <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
            <span className="text-sm font-semibold text-slate-700">
              {t('report.upvotes', { count: report.upvoteCount })}
            </span>
            {/* Upvotes are the citizens' priority signal; agents act on it instead. */}
            {user?.role === 'citizen' && (
              <button
                onClick={() => toggleUpvote.mutate(report.upvotedByMe)}
                disabled={toggleUpvote.isPending}
                aria-pressed={report.upvotedByMe}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition focus:ring-2 focus:ring-brand-600 focus:ring-offset-1 focus:outline-none disabled:opacity-60 ${
                  report.upvotedByMe
                    ? 'bg-brand-600 text-white hover:bg-brand-700'
                    : 'bg-brand-50 text-brand-700 ring-1 ring-brand-600/30 hover:bg-brand-100'
                }`}
              >
                👍 {report.upvotedByMe ? t('report.upvoted') : t('report.upvote')}
              </button>
            )}
          </div>

          {user?.role === 'agent' && <StatusActions id={report.id} status={report.status} />}
        </div>
      )}
    </section>
  );
}
