// Orb - ServerUser Sequelize model definition and init function
// Copyright (C) 2025 Jonas Frank de Buhr (jonasfdb)
// Licensed under the AGPL-3.0 license as laid out in LICENSE

import { Model, DataTypes, Sequelize, InferAttributes, InferCreationAttributes } from 'sequelize';

export class GuildMember extends Model<InferAttributes<GuildMember>, InferCreationAttributes<GuildMember>> {
  declare UUID: string;
  declare dGuildID: string;
  declare dUserID: string;
  declare currentMoney: number;
  declare currentLevel: number;
  declare currentXP: number;
  declare totalXP:number;
  declare requiredXPForNextLevel: number;
  declare verified: boolean;
  declare cooldowns: string;
}

export function initGuildMemberModel(sequelize: Sequelize) {
  GuildMember.init(
    {
      UUID: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true
      },
      dGuildID: {
        type: DataTypes.STRING,
        allowNull: false
      },
      dUserID: {
        type: DataTypes.STRING,
        allowNull: false
      },
      currentMoney: {
        type: DataTypes.INTEGER,
        defaultValue: 1000
      },
      currentLevel: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      currentXP: {
        type: DataTypes.INTEGER,
        defaultValue: 1
      },
      totalXP: {
        type: DataTypes.INTEGER,
        defaultValue: 1
      },
      requiredXPForNextLevel: {
        type: DataTypes.INTEGER,
        defaultValue: 100
      },
      verified: {
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
      modelName: 'GuildMember',
      tableName: 'guildMember',
      timestamps: false,
    }
  );
}
