import { DataTypes, Model } from 'sequelize';
import type { CreationOptional, InferAttributes, InferCreationAttributes } from 'sequelize';
import {
  REPORT_CATEGORIES,
  REPORT_STATUSES,
  type ReportCategory,
  type ReportStatus,
} from '@city-reporter/shared';
import { sequelize } from '../db/sequelize';

/** GeoJSON point. Note the order: [longitude, latitude]. */
export type Point = { type: 'Point'; coordinates: [number, number] };

export class Report extends Model<InferAttributes<Report>, InferCreationAttributes<Report>> {
  declare id: CreationOptional<string>;
  declare category: ReportCategory;
  declare description: string | null;
  declare location: Point;
  declare status: CreationOptional<ReportStatus>;
  declare upvoteCount: CreationOptional<number>;
  declare createdBy: string;
  declare statusChangedBy: CreationOptional<string | null>;
  declare statusChangedAt: CreationOptional<Date | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Report.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    category: { type: DataTypes.ENUM(...REPORT_CATEGORIES), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    location: { type: DataTypes.GEOGRAPHY('POINT', 4326), allowNull: false },
    status: { type: DataTypes.ENUM(...REPORT_STATUSES), allowNull: false, defaultValue: 'open' },
    upvoteCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    createdBy: { type: DataTypes.UUID, allowNull: false },
    statusChangedBy: { type: DataTypes.UUID, allowNull: true },
    statusChangedAt: { type: DataTypes.DATE, allowNull: true },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { sequelize, tableName: 'reports', underscored: true },
);
