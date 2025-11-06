// Orb - ServerBadges Sequelize model definition and init function
// Copyright (C) 2025 Jonas Frank de Buhr (jonasfdb)
// Licensed under the AGPL-3.0 license as laid out in LICENSE

import { Model, DataTypes, Sequelize, InferAttributes, InferCreationAttributes } from 'sequelize';

export class GuildBadges extends Model<  InferAttributes<GuildBadges>, InferCreationAttributes<GuildBadges>> {
  declare UUID: string;
  declare dGuildID: string;   // dGuildID - d stands for discord
  declare emojiID: string;
}

export function initGuildBadgesModel(sequelize: Sequelize) {
  GuildBadges.init(
    {
      UUID: {
        type: DataTypes.STRING,
        allowNull: false
      },
      dGuildID: {
        type: DataTypes.STRING,
        allowNull: false
      },
      emojiID: {
        type: DataTypes.STRING,
        allowNull: false
      },
    },
    {
      sequelize,
      modelName: 'GuildBadges',
      tableName: 'guildBadges',
      timestamps: false,
    }
  );
}
