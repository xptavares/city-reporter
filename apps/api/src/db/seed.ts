// Demo data: `npm run db:seed`. WIPES all users, reports and upvotes, then inserts fresh data.
import type { ReportCategory, ReportStatus } from '@city-reporter/shared';
import { sequelize } from './sequelize';
import { Report, Upvote, User } from '../models';
import { hashPassword } from '../services/auth-service';
import { redis } from '../cache/redis';

// Seeded directly (not through the sign-up schema), so it can be shorter than the 8-char minimum.
export const DEMO_PASSWORD = '123qwe';

// Approximate locations around Pelotas, RS.
const REPORTS: Array<{
  category: ReportCategory;
  description: string;
  lat: number;
  lng: number;
  status?: ReportStatus;
  upvotes: number;
}> = [
  { category: 'missing_tactile_paving', description: 'No tactile paving around the main square', lat: -31.7718, lng: -52.342, upvotes: 9 },
  { category: 'sidewalk_obstruction', description: 'Goods displayed blocking the sidewalk', lat: -31.7702, lng: -52.3398, upvotes: 7 },
  { category: 'broken_sidewalk', description: 'Broken sidewalk next to the public market', lat: -31.7728, lng: -52.3415, upvotes: 6 },
  { category: 'pothole', description: 'Deep pothole on the right lane', lat: -31.764, lng: -52.34, upvotes: 5 },
  { category: 'signage', description: 'Crosswalk paint almost gone', lat: -31.7695, lng: -52.3385, upvotes: 4 },
  { category: 'sidewalk_obstruction', description: 'Bus shelter in the middle of the sidewalk', lat: -31.7662, lng: -52.3437, upvotes: 4 },
  { category: 'lighting', description: 'Street light out for weeks', lat: -31.755, lng: -52.365, upvotes: 3 },
  { category: 'pothole', description: 'Open manhole without cover', lat: -31.7273, lng: -52.348, upvotes: 3 },
  { category: 'other', description: 'Unpruned hedge covering half the sidewalk', lat: -31.752, lng: -52.306, upvotes: 2 },
  { category: 'broken_sidewalk', description: 'Uneven sidewalk, hard to pass with a wheelchair', lat: -31.779, lng: -52.329, upvotes: 2 },
  { category: 'signage', description: 'Traffic light without audible signal', lat: -31.7675, lng: -52.3405, upvotes: 1 },
  { category: 'lighting', description: 'Dark stretch along the waterfront', lat: -31.771, lng: -52.223, upvotes: 1 },
  { category: 'pothole', description: 'Pothole patched last month', lat: -31.7605, lng: -52.3455, status: 'fixed', upvotes: 2 },
  { category: 'sidewalk_obstruction', description: 'Car parked on the sidewalk', lat: -31.7685, lng: -52.3362, status: 'not_found', upvotes: 0 },
];

// citizen@cityreporter.local (index 0) starts with no upvotes, so the demo can show upvoting.
const CITIZEN_COUNT = 10;

await sequelize.transaction(async (transaction) => {
  await sequelize.query('TRUNCATE upvotes, reports, users CASCADE', { transaction });
  const passwordHash = await hashPassword(DEMO_PASSWORD);

  const agent = await User.create(
    { name: 'Agent Demo', email: 'agent@cityreporter.local', passwordHash, role: 'agent' },
    { transaction },
  );
  const citizens = await User.bulkCreate(
    Array.from({ length: CITIZEN_COUNT }, (_, i) => ({
      name: i === 0 ? 'Citizen Demo' : `Citizen ${i + 1}`,
      email: i === 0 ? 'citizen@cityreporter.local' : `citizen${i + 1}@cityreporter.local`,
      passwordHash,
      role: 'citizen' as const,
    })),
    { transaction },
  );

  for (const [i, r] of REPORTS.entries()) {
    const status = r.status ?? 'open';
    const report = await Report.create(
      {
        category: r.category,
        description: r.description,
        location: { type: 'Point', coordinates: [r.lng, r.lat] },
        status,
        upvoteCount: r.upvotes,
        createdBy: citizens[i % CITIZEN_COUNT].id,
        statusChangedBy: status === 'open' ? null : agent.id,
        statusChangedAt: status === 'open' ? null : new Date(),
      },
      { transaction },
    );
    await Upvote.bulkCreate(
      citizens.slice(1, 1 + r.upvotes).map((c) => ({ userId: c.id, reportId: report.id })),
      { transaction },
    );
  }
});

// Every id changed: drop all cached entries (including /auth/me of the deleted users).
for await (const found of redis.scanStream({ match: 'cr:*', count: 500 })) {
  if (found.length) await redis.del(...(found as string[]));
}

console.log(`Seeded ${REPORTS.length} reports, 1 agent and ${CITIZEN_COUNT} citizens.`);
console.log(`Logins (password "${DEMO_PASSWORD}"): agent@cityreporter.local, citizen@cityreporter.local`);
await sequelize.close();
redis.disconnect(); // open connections would keep the process alive
