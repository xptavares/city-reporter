import { DataTypes, Model } from 'sequelize';
import type { CreationOptional, InferAttributes, InferCreationAttributes } from 'sequelize';
import { sequelize } from '../db/sequelize';

export class Upvote extends Model<InferAttributes<Upvote>, InferCreationAttributes<Upvote>> {
  declare userId: string;
  declare reportId: string;
  declare createdAt: CreationOptional<Date>;
}

Upvote.init(
  {
    userId: { type: DataTypes.UUID, primaryKey: true },
    reportId: { type: DataTypes.UUID, primaryKey: true },
    createdAt: DataTypes.DATE,
  },
  { sequelize, tableName: 'upvotes', underscored: true, updatedAt: false },
);
