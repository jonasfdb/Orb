// Orb - Server Sequelize model definition and init function
// Copyright (C) 2025 Jonas Frank de Buhr (jonasfdb)
// Licensed under the AGPL-3.0 license as laid out in LICENSE

import { Model, DataTypes, Sequelize, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';

export class Guild extends Model<InferAttributes<Guild>, InferCreationAttributes<Guild>> {
  declare UUID: string;
  declare dGuildID: string;
  declare roleRewardsString: CreationOptional<string>;
  declare verificationEnabled: CreationOptional<boolean>;
}

export function initGuildModel(sequelize: Sequelize) {
  Guild.init(
    {
      UUID: {
        type: DataTypes.STRING,
        allowNull: false
      },
      dGuildID: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true
      },
      roleRewardsString: {  // holy shit this needs to be changed // TODO
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: ''
      },
      verificationEnabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
    },
    {
      sequelize,
      modelName: 'Guild',
      tableName: 'guild',
      timestamps: false,
    }
  );
}