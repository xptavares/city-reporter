import { DataTypes } from 'sequelize';
import { ROLES } from '@city-reporter/shared';
import type { Migration } from '../migrator';

export const up: Migration = async ({ context: qi }) => {
  await qi.createTable('users', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    name: { type: DataTypes.TEXT, allowNull: false },
    email: { type: DataTypes.TEXT, allowNull: false, unique: true },
    password_hash: { type: DataTypes.TEXT, allowNull: false },
    role: { type: DataTypes.ENUM(...ROLES), allowNull: false, defaultValue: 'citizen' },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false },
  });
};

export const down: Migration = async ({ context: qi }) => {
  await qi.dropTable('users');
  await qi.sequelize.query('DROP TYPE IF EXISTS "enum_users_role"');
};
