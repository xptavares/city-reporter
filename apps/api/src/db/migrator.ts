import { fileURLToPath } from 'node:url';
import { SequelizeStorage, Umzug } from 'umzug';
import { sequelize } from './sequelize';

export const migrator = new Umzug({
  migrations: { glob: ['migrations/*.ts', { cwd: fileURLToPath(new URL('.', import.meta.url)) }] },
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize }),
  logger: undefined,
});

export type Migration = typeof migrator._types.migration;
