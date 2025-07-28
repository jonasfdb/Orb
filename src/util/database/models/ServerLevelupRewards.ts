// Orb - ServerLevelupRewards Sequelize model definition and init function
// Copyright (C) 2025 Jonas Frank de Buhr (jonasfdb)
// Licensed under the AGPL-3.0 license as laid out in LICENSE

import { Model, DataTypes, Sequelize, InferAttributes, InferCreationAttributes } from 'sequelize';

export class ServerLevelupRewards extends Model<InferAttributes<ServerLevelupRewards>, InferCreationAttributes<ServerLevelupRewards>> {
  declare orb_uuid: string;
  declare server_id: string;
  declare min_level: number;
  declare max_level: number;
  declare token: string;
  declare role_id: string;
}

export function initServerLevelupRewardsModel(sequelize: Sequelize) {
  ServerLevelupRewards.init(
    {
      orb_uuid: {
        type: DataTypes.STRING,
        allowNull: false
      },
      server_id: {
        type: DataTypes.STRING,
        allowNull: false
      },
      min_level: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      max_level: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      token: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false
      },
      role_id: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true
      },
    },
    {
      sequelize,
      modelName: 'ServerLevelupRewards',
      tableName: 'server_levelup_rewards',
      timestamps: false,
    }
  );
}
