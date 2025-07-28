// Orb - Database utility functions
// Copyright (C) 2025 Jonas Frank de Buhr (jonasfdb)
// Licensed under the AGPL-3.0 license as laid out in LICENSE

import { ServerSettings } from "./models/ServerSettings";
import { ServerUser } from "./models/ServerUser";
import { Server } from "./models/Server";
import { GlobalUser } from "./models/GlobalUser";
import { nanoid } from "nanoid";

export async function find_user(user_id: string): Promise<GlobalUser> {
  let user = await GlobalUser.findOne({ where: { user_id: user_id } });

  if (!user) {
    try {
      user = await GlobalUser.create({
        orb_uuid: nanoid(22),
        user_id: user_id,
        user_bot_status: 0,
        profile_color: `5d20a1`,
        lifetime_xp: 1
      });
      console.warn(`New user ${user.user_id} added to database with default color ${user.profile_color}`);
    } catch (error) {
      console.trace(error);
      throw new Error(`GlobalUser for ${user_id} could not be found or created.`);
    }
  }

  return user;
}

export async function find_server(server_id: string): Promise<Server> {
  let server = await Server.findOne({ where: { server_id: server_id } });

  if (!server) {
    try {
      server = await Server.create({
        orb_uuid: nanoid(22),
        server_id: server_id,
      });
      console.warn(`New server ${server.server_id} added to database`);
    } catch (error) {
      console.trace(error);
      throw new Error(`Server for ${server_id} could not be found or created.`);
    }
  }

  return server;
}

export async function find_server_user(user_id: string, server_id: string): Promise<ServerUser> {
  let server_user = await ServerUser.findOne({ where: { user_id: user_id, server_id: server_id } });

  if (!server_user) {
    try {
      server_user = await ServerUser.create({
        orb_uuid: nanoid(22),
        server_id: server_id,
        user_id: user_id,
        current_money: 1000,
        current_level: 0,
        current_xp: 1,
        total_xp: 1,
        next_required_xp: 100,
        is_verified: false,
        cooldowns: JSON.stringify({
          daily: { uses_left: 1, last_use_timestamp: 0 },
          coinflip: { uses_left: 20, last_use_timestamp: 0 },
          slots: { uses_left: 10, last_use_timestamp: 0 },
          highlow: { uses_left: 5, last_use_timestamp: 0 }
        })
      });
      console.warn(`New user ${user_id} added to database with ${server_user.user_id}, on server ${server_user.server_id}`);
    } catch (error) {
      console.trace(error);
      throw new Error(`ServerUser for ${user_id} on ${server_id} could not be found or created.`);
    }
  }

  return server_user;
}

export async function find_server_settings(server_id: string): Promise<ServerSettings> {
  let server = await ServerSettings.findOne({
    where: { server_id: server_id },
  });

  if (!server) {
    try {
      server = await ServerSettings.create({
        orb_uuid: nanoid(22),
        server_id: server_id,
      });
      console.warn(`New server settings for ${server.server_id} added to database`);
    } catch (error) {
      console.trace(error);
      throw new Error(`ServerSettings for ${server_id} could not be found or created.`);
    }
  }

  return server;
}
