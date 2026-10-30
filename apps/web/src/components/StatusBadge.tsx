import { useTranslation } from 'react-i18next';
import type { ReportStatus } from '@city-reporter/shared';
import { STATUS_BADGE } from '../lib/reports';

export function StatusBadge({ status }: { status: ReportStatus }) {
  const { t } = useTranslation();
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${STATUS_BADGE[status]}`}
    >
      {t(`status.${status}`)}
    </span>
  );
}
