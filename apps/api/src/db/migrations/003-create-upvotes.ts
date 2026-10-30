import { DataTypes } from 'sequelize';
import type { Migration } from '../migrator';

export const up: Migration = async ({ context: qi }) => {
  await qi.createTable('upvotes', {
    // Composite primary key: the database enforces one upvote per user per report.
    user_id: {
      type: DataTypes.UUID,
      primaryKey: true,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
    },
    report_id: {
      type: DataTypes.UUID,
      primaryKey: true,
      references: { model: 'reports', key: 'id' },
      onDelete: 'CASCADE',
    },
    created_at: { type: DataTypes.DATE, allowNull: false },
  });
};

export const down: Migration = async ({ context: qi }) => {
  await qi.dropTable('upvotes');
};
