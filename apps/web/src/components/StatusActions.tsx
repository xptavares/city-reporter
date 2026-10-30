import { useTranslation } from 'react-i18next';
import type { ReportStatus } from '@city-reporter/shared';
import { useUpdateStatus } from '../api/hooks';

/** Agent actions (flows A3/A4): mark fixed, mark not found, or reopen. */
export function StatusActions({ id, status }: { id: string; status: ReportStatus }) {
  const { t } = useTranslation();
  const update = useUpdateStatus();
  const set = (next: ReportStatus) => update.mutate({ id, status: next });
  const busy = update.isPending;

  const button =
    'rounded-md px-3 py-1.5 text-sm font-semibold disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-1';

  return (
    <div className="flex flex-wrap gap-2">
      {status === 'open' ? (
        <>
          <button
            disabled={busy}
            onClick={() => set('fixed')}
            className={`${button} bg-green-600 text-white hover:bg-green-700 focus:ring-green-600`}
          >
            {t('agent.markFixed')}
          </button>
          <button
            disabled={busy}
            onClick={() => set('not_found')}
            className={`${button} bg-slate-200 text-slate-800 hover:bg-slate-300 focus:ring-slate-500`}
          >
            {t('agent.markNotFound')}
          </button>
        </>
      ) : (
        <button
          disabled={busy}
          onClick={() => set('open')}
          className={`${button} bg-white text-slate-800 ring-1 ring-slate-300 hover:bg-slate-50 focus:ring-slate-500`}
        >
          {t('agent.reopen')}
        </button>
      )}
    </div>
  );
}
