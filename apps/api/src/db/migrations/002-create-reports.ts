import { DataTypes } from 'sequelize';
import { REPORT_CATEGORIES, REPORT_STATUSES } from '@city-reporter/shared';
import type { Migration } from '../migrator';

export const up: Migration = async ({ context: qi }) => {
  await qi.createTable('reports', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    category: { type: DataTypes.ENUM(...REPORT_CATEGORIES), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    location: { type: DataTypes.GEOGRAPHY('POINT', 4326), allowNull: false },
    status: { type: DataTypes.ENUM(...REPORT_STATUSES), allowNull: false, defaultValue: 'open' },
    upvote_count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    created_by: { type: DataTypes.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
    status_changed_by: { type: DataTypes.UUID, allowNull: true, references: { model: 'users', key: 'id' } },
    status_changed_at: { type: DataTypes.DATE, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false },
  });

  // "Reports inside the visible map area" is an indexed bounding-box query.
  await qi.addIndex('reports', ['location'], { using: 'GIST' });
  // Agent list: filter by status, sort by most upvoted.
  await qi.addIndex('reports', ['status', 'upvote_count']);
};

export const down: Migration = async ({ context: qi }) => {
  await qi.dropTable('reports');
  await qi.sequelize.query('DROP TYPE IF EXISTS "enum_reports_category"');
  await qi.sequelize.query('DROP TYPE IF EXISTS "enum_reports_status"');
};
