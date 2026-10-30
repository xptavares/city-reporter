import { QueryTypes, type WhereOptions } from 'sequelize';
import type {
  CreateReportInput,
  ListReportsQuery,
  MapQuery,
  Page,
  Report as ReportDto,
  ReportDetails,
  ReportPin,
  ReportStatus,
} from '@city-reporter/shared';
import { sequelize } from '../db/sequelize';
import { Report, Upvote } from '../models';
import { HttpError } from '../http-error';

/** Safety cap for a single map request. */
const MAP_PIN_LIMIT = 2000;

// Serializers are explicit allow-lists: createdBy / statusChangedBy are never exposed
// (decision 010 — users can't identify each other).
function toReportDto(report: Report): ReportDto {
  const [lng, lat] = report.location.coordinates;
  return {
    id: report.id,
    category: report.category,
    status: report.status,
    lat,
    lng,
    description: report.description,
    upvoteCount: report.upvoteCount,
    createdAt: report.createdAt.toISOString(),
    statusChangedAt: report.statusChangedAt?.toISOString() ?? null,
  };
}

async function findReportOr404(id: string): Promise<Report> {
  const report = await Report.findByPk(id);
  if (!report) throw new HttpError(404, 'Report not found');
  return report;
}

export async function createReport(input: CreateReportInput, userId: string): Promise<ReportDto> {
  const report = await Report.create({
    category: input.category,
    description: input.description || null,
    location: { type: 'Point', coordinates: [input.lng, input.lat] },
    createdBy: userId,
  });
  return toReportDto(report);
}

export async function getMapPins({ bbox }: MapQuery): Promise<ReportPin[]> {
  const [minLng, minLat, maxLng, maxLat] = bbox;
  // `&&` is a bounding-box overlap test that uses the GiST index on location.
  return sequelize.query<ReportPin>(
    `SELECT id, category, status,
            ST_Y(location::geometry) AS lat,
            ST_X(location::geometry) AS lng
       FROM reports
      WHERE location && ST_MakeEnvelope(:minLng, :minLat, :maxLng, :maxLat, 4326)::geography
      LIMIT :limit`,
    {
      type: QueryTypes.SELECT,
      replacements: { minLng, minLat, maxLng, maxLat, limit: MAP_PIN_LIMIT },
    },
  );
}

export async function getReportDetails(id: string, userId: string): Promise<ReportDetails> {
  const report = await findReportOr404(id);
  const upvote = await Upvote.findOne({ where: { reportId: id, userId } });
  return { ...toReportDto(report), upvotedByMe: upvote !== null };
}

export async function listReports(query: ListReportsQuery): Promise<Page<ReportDto>> {
  const where: WhereOptions<Report> = {};
  if (query.status) where.status = query.status;
  if (query.category) where.category = query.category;

  const { rows, count } = await Report.findAndCountAll({
    where,
    order:
      query.sort === 'upvotes'
        ? [['upvoteCount', 'DESC'], ['createdAt', 'DESC']]
        : [['createdAt', 'DESC']],
    limit: query.pageSize,
    offset: (query.page - 1) * query.pageSize,
  });
  return { items: rows.map(toReportDto), total: count, page: query.page, pageSize: query.pageSize };
}

export async function updateStatus(
  id: string,
  status: ReportStatus,
  agentId: string,
): Promise<ReportDto> {
  const report = await findReportOr404(id);
  report.status = status;
  report.statusChangedBy = agentId;
  report.statusChangedAt = new Date();
  await report.save();
  return toReportDto(report);
}

/** Idempotent: upvoting twice keeps a single upvote. Returns the new count. */
export async function addUpvote(reportId: string, userId: string): Promise<number> {
  return sequelize.transaction(async (transaction) => {
    const report = await Report.findByPk(reportId, { transaction, lock: transaction.LOCK.UPDATE });
    if (!report) throw new HttpError(404, 'Report not found');

    const [, created] = await Upvote.findOrCreate({
      where: { reportId, userId },
      transaction,
    });
    // The row lock serializes concurrent upvotes, so read-modify-write is safe here.
    if (created) await report.update({ upvoteCount: report.upvoteCount + 1 }, { transaction });
    return report.upvoteCount;
  });
}

/** Idempotent: removing a missing upvote is a no-op. Returns the new count. */
export async function removeUpvote(reportId: string, userId: string): Promise<number> {
  return sequelize.transaction(async (transaction) => {
    const report = await Report.findByPk(reportId, { transaction, lock: transaction.LOCK.UPDATE });
    if (!report) throw new HttpError(404, 'Report not found');

    const removed = await Upvote.destroy({ where: { reportId, userId }, transaction });
    if (removed) await report.update({ upvoteCount: report.upvoteCount - 1 }, { transaction });
    return report.upvoteCount;
  });
}
