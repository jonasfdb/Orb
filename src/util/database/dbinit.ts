// Orb - Utility to initialize and connect to the database on startup
// Copyright (C) 2025 Jonas Frank de Buhr (jonasfdb)
// Licensed under the AGPL-3.0 license as laid out in LICENSE

import { config } from '../../../config/config';
import { initServerSettingsModel } from './models/ServerSettings';
import { initServerModel } from './models/Server';
import { initServerOtpTokenModel } from './models/ServerOtpToken';
import { initServerBadgesModel } from './models/ServerBadges';
import { initServerUserModel } from './models/ServerUser';
import { initUserModel } from './models/GlobalUser';
// import { initServerLevelupRewardsModel } from './models/ServerLevelupRewards';

const { database } = config;

export async function initDatabase() {
  console.log(`Connecting to main database...`);

  initServerSettingsModel(database);
  initServerModel(database);
  initServerOtpTokenModel(database);
  initServerBadgesModel(database);
  initServerUserModel(database);
  initUserModel(database);
  // initServerLevelupRewardsModel(database);

  try {
    await database.authenticate();
    await database.sync({ alter: true })
      .then(() => {
        console.log(`> SUCCESS`);
      })
      .catch((err) => console.trace(err));
  } catch (err) {
    console.trace("Failed to connect to main database:", err);
    process.exit(1);
  }
}
