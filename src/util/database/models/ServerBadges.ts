// Orb - ServerBadges Sequelize model definition and init function
// Copyright (C) 2025 Jonas Frank de Buhr (jonasfdb)
// Licensed under the AGPL-3.0 license as laid out in LICENSE

import { Model, DataTypes, Sequelize, InferAttributes, InferCreationAttributes } from 'sequelize';

export class ServerBadges extends Model<  InferAttributes<ServerBadges>, InferCreationAttributes<ServerBadges>> {
  declare orb_uuid: string;
  declare server_id: string;
  declare emoji_id: string;
}

export function initServerBadgesModel(sequelize: Sequelize) {
  ServerBadges.init(
    {
      orb_uuid: {
        type: DataTypes.STRING,
        allowNull: false
      },
      server_id: {
        type: DataTypes.STRING,
        allowNull: false
      },
      emoji_id: {
        type: DataTypes.STRING,
        allowNull: false
      },
    },
    {
      sequelize,
      modelName: 'ServerBadges',
      tableName: 'server_badges',
      timestamps: false,
    }
  );
}
