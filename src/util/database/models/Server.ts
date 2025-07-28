// Orb - Server Sequelize model definition and init function
// Copyright (C) 2025 Jonas Frank de Buhr (jonasfdb)
// Licensed under the AGPL-3.0 license as laid out in LICENSE

import { Model, DataTypes, Sequelize, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';

export class Server extends Model<InferAttributes<Server>, InferCreationAttributes<Server>> {
  declare server_id: string;
  declare orb_uuid: string;
  declare role_rewards_level_string: CreationOptional<string>;
  declare requires_verification: CreationOptional<boolean>;
}

export function initServerModel(sequelize: Sequelize) {
  Server.init(
    {
      orb_uuid: {
        type: DataTypes.STRING,
        allowNull: false
      },
      server_id: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true
      },
      role_rewards_level_string: {  // holy shit this needs to be changed
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: ''
      },
      requires_verification: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
    },
    {
      sequelize,
      modelName: 'Server',
      tableName: 'server',
      timestamps: false,
    }
  );
}
