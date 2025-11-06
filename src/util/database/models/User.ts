// Orb - GlobalUser Sequelize model definition and init function
// Copyright (C) 2025 Jonas Frank de Buhr (jonasfdb)
// Licensed under the AGPL-3.0 license as laid out in LICENSE

import { Model, DataTypes, Sequelize, InferAttributes, InferCreationAttributes } from 'sequelize';

export class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
  declare UUID: string;
  declare dUserID: string;
  declare userStatus: number;
  declare profileColor: string;
  declare lifetimeXP: number;
}

export function initUserModel(sequelize: Sequelize) {
  User.init(
    {
      UUID: {
        type: DataTypes.STRING,
        allowNull: false
      },
      dUserID: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true
      },
      userStatus: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      profileColor: {
        type: DataTypes.STRING,
        defaultValue: '5d20a1'
      },
      lifetimeXP: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
    },
    {
      sequelize,
      modelName: 'User',
      tableName: 'user',
      timestamps: false,
    }
  );
}
