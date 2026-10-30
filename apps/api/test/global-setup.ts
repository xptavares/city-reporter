import { useTestEnv } from './env';

export default async function migrateTestDatabase() {
  useTestEnv();
  const { migrator } = await import('../src/db/migrator');
  const { sequelize } = await import('../src/db/sequelize');
  await migrator.up();
  await sequelize.close();
}
