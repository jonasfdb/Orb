// Orb - ServerUser Sequelize model definition and init function
// Copyright (C) 2025 Jonas Frank de Buhr (jonasfdb)
// Licensed under the AGPL-3.0 license as laid out in LICENSE

import { Model, DataTypes, Sequelize, InferAttributes, InferCreationAttributes } from 'sequelize';

export class ServerUser extends Model<InferAttributes<ServerUser>, InferCreationAttributes<ServerUser>> {
  declare orb_uuid: string;
  declare server_id: string;
  declare user_id: string;
  declare current_money: number;
  declare current_level: number;
  declare current_xp: number;
  declare total_xp:number;
  declare next_required_xp: number;
  declare is_verified: boolean;
  declare cooldowns: string;
}

export function initServerUserModel(sequelize: Sequelize) {
  ServerUser.init(
    {
      orb_uuid: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true
      },
      server_id: {
        type: DataTypes.STRING,
        allowNull: false
      },
      user_id: {
        type: DataTypes.STRING,
        allowNull: false
      },
      current_money: {
        type: DataTypes.INTEGER,
        defaultValue: 1000
      },
      current_level: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      current_xp: {
        type: DataTypes.INTEGER,
        defaultValue: 1
      },
      total_xp: {
        type: DataTypes.INTEGER,
        defaultValue: 1
      },
      next_required_xp: {
        type: DataTypes.INTEGER,
        defaultValue: 100
      },
      is_verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      cooldowns: {
        type: DataTypes.TEXT,
        defaultValue: JSON.stringify({
          daily: { uses_left: 1, last_use_timestamp: 0 },
          coinflip: { uses_left: 20, last_use_timestamp: 0 },
          slots: { uses_left: 10, last_use_timestamp: 0 },
          highlow: { uses_left: 5, last_use_timestamp: 0 }
        })
      },
    },
    {
      sequelize,
      modelName: 'ServerUser',
      tableName: 'server_user',
      timestamps: false,
    }
  );
}
