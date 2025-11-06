// Orb - ServerOtpToken Sequelize model definition and init function
// Copyright (C) 2025 Jonas Frank de Buhr (jonasfdb)
// Licensed under the AGPL-3.0 license as laid out in LICENSE

import { Model, DataTypes, Sequelize, InferAttributes, InferCreationAttributes } from 'sequelize';

export class GuildToken extends Model<InferAttributes<GuildToken>, InferCreationAttributes<GuildToken>> {
  declare dGuildID: string;
  declare dUserID: string;
  declare token: string;
}

export function initGuildTokenModel(sequelize: Sequelize) {
  GuildToken.init(
    {
      dGuildID: {
        type: DataTypes.STRING,
        allowNull: false
      },
      dUserID: {
        type: DataTypes.STRING,
        allowNull: false
      },
      token: {
        type: DataTypes.STRING,
        allowNull: false
      },
    },
    {
      sequelize,
      modelName: 'GuildToken',
      tableName: 'guildToken',
      timestamps: false,
    }
  );
}
