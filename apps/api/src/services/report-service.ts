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
import { bumpVersions, cached, cachedMany, getVersion, invalidate, type Cached } from '../cache/cache';
import { TTL, keys } from '../cache/keys';
import { bboxContains, tileBbox, tilesForBbox, type Bbox } from '../cache/tiles';

/** Safety cap for a single map query. */
const MAP_PIN_LIMIT = 2000;
/** Zoom 13 tiles are ~3.5 km wide in Pelotas: a phone screen covers a handful of them. */
const MAP_TILE_ZOOM = 13;
/** Zoomed out further than this, skip the tile cache and query the bbox directly. */
const MAP_MAX_TILES = 64;

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
  await bumpVersions('map', 'list');
  return toReportDto(report);
}

async function queryPins([minLng, minLat, maxLng, maxLat]: Bbox): Promise<ReportPin[]> {
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

/**
 * Pins inside the bbox. The bbox is snapped to fixed map tiles and each tile is cached on its own,
 * so different viewports over the same area share cache entries.
 */
export async function getMapPins({ bbox }: MapQuery): Promise<Cached<ReportPin[]>> {
  const tiles = tilesForBbox(bbox, MAP_TILE_ZOOM, MAP_MAX_TILES);
  const version = tiles ? await getVersion('map') : undefined;
  if (!tiles || version === undefined) return { value: await queryPins(bbox), cache: 'BYPASS' };

  const { value: pinsPerTile, cache } = await cachedMany(
    tiles.map((tile) => keys.mapTile(version, tile)),
    TTL.mapTile,
    (i) => queryPins(tileBbox(tiles[i])),
  );

  // Tiles cover more than the bbox, and a pin on a tile edge can be in two tiles.
  const pins = new Map<string, ReportPin>();
  for (const pin of pinsPerTile.flat()) {
    if (bboxContains(bbox, pin.lng, pin.lat)) pins.set(pin.id, pin);
  }
  return { value: [...pins.values()], cache };
}

export async function getReportDetails(
  id: string,
  userId: string,
): Promise<Cached<ReportDetails>> {
  // The shared part is cached; "did I upvote it?" is per user, so it never goes into a shared key.
  const { value: report, cache } = await cached(keys.report(id), TTL.report, async () =>
    toReportDto(await findReportOr404(id)),
  );
  const upvote = await Upvote.findOne({ where: { reportId: id, userId } });
  return { value: { ...report, upvotedByMe: upvote !== null }, cache };
}

export async function listReports(query: ListReportsQuery): Promise<Cached<Page<ReportDto>>> {
  const version = await getVersion('list');
  if (version === undefined) return { value: await queryReports(query), cache: 'BYPASS' };
  return cached(keys.list(version, query), TTL.list, () => queryReports(query));
}

async function queryReports(query: ListReportsQuery): Promise<Page<ReportDto>> {
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
  await Promise.all([invalidate(keys.report(id)), bumpVersions('map', 'list')]);
  return toReportDto(report);
}

/** Idempotent: upvoting twice keeps a single upvote. Returns the new count. */
export async function addUpvote(reportId: string, userId: string): Promise<number> {
  const { count, changed } = await sequelize.transaction(async (transaction) => {
    const report = await Report.findByPk(reportId, { transaction, lock: transaction.LOCK.UPDATE });
    if (!report) throw new HttpError(404, 'Report not found');

    const [, created] = await Upvote.findOrCreate({
      where: { reportId, userId },
      transaction,
    });
    // The row lock serializes concurrent upvotes, so read-modify-write is safe here.
    if (created) await report.update({ upvoteCount: report.upvoteCount + 1 }, { transaction });
    return { count: report.upvoteCount, changed: created };
  });
  if (changed) await invalidateUpvoteCaches(reportId);
  return count;
}

/** Idempotent: removing a missing upvote is a no-op. Returns the new count. */
export async function removeUpvote(reportId: string, userId: string): Promise<number> {
  const { count, changed } = await sequelize.transaction(async (transaction) => {
    const report = await Report.findByPk(reportId, { transaction, lock: transaction.LOCK.UPDATE });
    if (!report) throw new HttpError(404, 'Report not found');

    const removed = await Upvote.destroy({ where: { reportId, userId }, transaction });
    if (removed) await report.update({ upvoteCount: report.upvoteCount - 1 }, { transaction });
    return { count: report.upvoteCount, changed: removed > 0 };
  });
  if (changed) await invalidateUpvoteCaches(reportId);
  return count;
}

/** Map pins carry no upvote count, so upvotes never invalidate the map cache. */
async function invalidateUpvoteCaches(reportId: string) {
  await Promise.all([invalidate(keys.report(reportId)), bumpVersions('list')]);
}
