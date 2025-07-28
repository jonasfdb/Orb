// Orb - ServerSettings Sequelize model definition and init function
// Copyright (C) 2025 Jonas Frank de Buhr (jonasfdb)
// Licensed under the AGPL-3.0 license as laid out in LICENSE

import { Model, DataTypes, Sequelize, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';

export class ServerSettings extends Model<InferAttributes<ServerSettings>, InferCreationAttributes<ServerSettings>> {
  declare orb_uuid: string;
  declare server_id: string;
  declare broadcast_channel_id: CreationOptional<string | null>;
  declare broadcasts_allowed: CreationOptional<boolean>;
  declare levelup_message_channel_id: CreationOptional<string | null>;
  declare welcome_channel_id: CreationOptional<string | null>;
  declare leave_channel_id: CreationOptional<string | null>;
  declare welcome_message: CreationOptional<string>;
  declare leave_message: CreationOptional<string>;
  declare welcome_messages_enabled: CreationOptional<boolean>;
  declare leave_messages_enabled: CreationOptional<boolean>;
  declare captcha_verification_required: CreationOptional<boolean>;
  declare captcha_unverified_role_id: CreationOptional<string | null>;
}

export function initServerSettingsModel(sequelize: Sequelize) {
  ServerSettings.init(
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
      broadcast_channel_id: {
        type: DataTypes.STRING,
        allowNull: true
      },
      broadcasts_allowed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      levelup_message_channel_id: {
        type: DataTypes.STRING,
        allowNull: true
      },
      welcome_channel_id: {
        type: DataTypes.STRING,
        allowNull: true
      },
      leave_channel_id: {
        type: DataTypes.STRING,
        allowNull: true
      },
      welcome_message: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'Welcome to SERVER! We are glad to have you here.',
      },
      leave_message: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'Goodbye, we will miss you...',
      },
      welcome_messages_enabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      leave_messages_enabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      captcha_verification_required: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      captcha_unverified_role_id: {
        type: DataTypes.STRING,
        allowNull: true
      },
    },
    {
      sequelize,
      modelName: 'ServerSettings',
      tableName: 'server_settings',
      timestamps: false,
    }
  );
}
