// Orb - GlobalUser Sequelize model definition and init function
// Copyright (C) 2025 Jonas Frank de Buhr (jonasfdb)
// Licensed under the AGPL-3.0 license as laid out in LICENSE

import { Model, DataTypes, Sequelize, InferAttributes, InferCreationAttributes } from 'sequelize';

export class GlobalUser extends Model<InferAttributes<GlobalUser>, InferCreationAttributes<GlobalUser>> {
  declare user_id: string;
  declare orb_uuid: string;
  declare user_bot_status: number;
  declare profile_color: string;
  declare lifetime_xp: number;
}

export function initUserModel(sequelize: Sequelize) {
  GlobalUser.init(
    {
      orb_uuid: {
        type: DataTypes.STRING,
        allowNull: false
      },
      user_id: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true
      },
      user_bot_status: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      profile_color: {
        type: DataTypes.STRING,
        defaultValue: '5d20a1'
      },
      lifetime_xp: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
    },
    {
      sequelize,
      modelName: 'GlobalUser',
      tableName: 'global_user',
      timestamps: false,
    }
  );
}
