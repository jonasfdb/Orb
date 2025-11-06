// Orb - Utility to initialize and connect to the database on startup
// Copyright (C) 2025 Jonas Frank de Buhr (jonasfdb)
// Licensed under the AGPL-3.0 license as laid out in LICENSE

import { config } from '../../../config/config';
import { initGuildSettingsModel } from './models/GuildSettings';
import { initGuildModel } from './models/Guild';
import { initGuildTokenModel } from './models/GuildToken';
import { initGuildBadgesModel } from './models/GuildBadges';
import { initGuildMemberModel } from './models/GuildMember';
import { initUserModel } from './models/User';

const { database } = config;

export async function initDatabase() {
  console.log(`Connecting to main database...`);

  initGuildSettingsModel(database);
  initGuildModel(database);
  initGuildTokenModel(database);
  initGuildBadgesModel(database);
  initGuildMemberModel(database);
  initUserModel(database);

  try {
    await database.authenticate();
    await database.sync({ alter: true })
      .then(() => {
        console.log(`> SUCCESS`);
      })
      .catch((error) => console.trace(error));
  } catch (error) {
    console.trace("Failed to connect to main database:", error);
    process.exit(1);
  }
}
