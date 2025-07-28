// Orb - Configuration script
// Copyright (C) 2025 Jonas Frank de Buhr (jonasfdb)
// Licensed under the AGPL-3.0 license as laid out in LICENSE

import { Sequelize } from "sequelize";
import dotenv from "dotenv";
dotenv.config({ path: './config/.env' });

const isProd: boolean = process.env.NODE_ENV === "production";
const dbURL: string = isProd ? process.env.PROD_DB_URL! : process.env.DEV_DB_URL!;

export const config = {
  token: isProd
    ? process.env.DISCORD_TOKEN_PROD
    : process.env.DISCORD_TOKEN_DEV,

  clientId: isProd
    ? process.env.CLIENT_ID_PROD
    : process.env.CLIENT_ID_DEV,

  dbURL: dbURL,

  devId: process.env.DEV_ID,
  testGuildId: process.env.TEST_GUILD_ID,

  database: new Sequelize(dbURL, { logging: false }),
};
