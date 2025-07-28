// Orb - ServerOtpToken Sequelize model definition and init function
// Copyright (C) 2025 Jonas Frank de Buhr (jonasfdb)
// Licensed under the AGPL-3.0 license as laid out in LICENSE

import { Model, DataTypes, Sequelize, InferAttributes, InferCreationAttributes } from 'sequelize';

export class ServerOtpToken extends Model<InferAttributes<ServerOtpToken>, InferCreationAttributes<ServerOtpToken>> {
  declare server_id: string;
  declare user_id: string;
  declare one_time_token: string;
}

export function initServerOtpTokenModel(sequelize: Sequelize) {
  ServerOtpToken.init(
    {
      server_id: {
        type: DataTypes.STRING,
        allowNull: false
      },
      user_id: {
        type: DataTypes.STRING,
        allowNull: false
      },
      one_time_token: {
        type: DataTypes.STRING,
        allowNull: false
      },
    },
    {
      sequelize,
      modelName: 'ServerOtpToken',
      tableName: 'server_otp_token',
      timestamps: false,
    }
  );
}
