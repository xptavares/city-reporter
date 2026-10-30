// CLI: `npm run db:migrate` (up) or `npm run db:migrate -- down`.
import { migrator } from './migrator';
import { sequelize } from './sequelize';

const direction = process.argv[2] === 'down' ? 'down' : 'up';
const done = direction === 'up' ? await migrator.up() : await migrator.down();
console.log(`${direction}: ${done.map((m) => m.name).join(', ') || 'nothing to do'}`);
await sequelize.close();
