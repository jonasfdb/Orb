// Orb - ServerSettings Sequelize model definition and init function
// Copyright (C) 2025 Jonas Frank de Buhr (jonasfdb)
// Licensed under the AGPL-3.0 license as laid out in LICENSE

import { Model, DataTypes, Sequelize, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';

export class GuildSettings extends Model<InferAttributes<GuildSettings>, InferCreationAttributes<GuildSettings>> {
  declare UUID: string;
  declare dGuildID: string;
  declare channelsBroadcastID: CreationOptional<string | null>;
  declare broadcasts_allowed: CreationOptional<boolean>;
  declare channelsLevelupID: CreationOptional<string | null>;
  declare channelsWelcomeID: CreationOptional<string | null>;
  declare channelsLeaveID: CreationOptional<string | null>;
  declare messagesWelcome: CreationOptional<string>;
  declare messagesLeave: CreationOptional<string>;
  declare welcomeMessagesEnabled: CreationOptional<boolean>;
  declare leaveMessagesEnabled: CreationOptional<boolean>;
  declare captchaRequired: CreationOptional<boolean>;
  declare unverifiedRoleID: CreationOptional<string | null>;
}

export function initGuildSettingsModel(sequelize: Sequelize) {
  GuildSettings.init(
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
      channelsBroadcastID: {
        type: DataTypes.STRING,
        allowNull: true
      },
      broadcasts_allowed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      channelsLevelupID: {
        type: DataTypes.STRING,
        allowNull: true
      },
      channelsWelcomeID: {
        type: DataTypes.STRING,
        allowNull: true
      },
      channelsLeaveID: {
        type: DataTypes.STRING,
        allowNull: true
      },
      messagesWelcome: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'Welcome to SERVER! We are glad to have you here.',
      },
      messagesLeave: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'Goodbye, we will miss you...',
      },
      welcomeMessagesEnabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      leaveMessagesEnabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      captchaRequired: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      unverifiedRoleID: {
        type: DataTypes.STRING,
        allowNull: true
      },
    },
    {
      sequelize,
      modelName: 'GuildSettings',
      tableName: 'guildSettings',
      timestamps: false,
    }
  );
}
