// Orb - Database utility functions
// Copyright (C) 2025 Jonas Frank de Buhr (jonasfdb)
// Licensed under the AGPL-3.0 license as laid out in LICENSE

import { GuildSettings } from "./models/GuildSettings";
import { GuildMember } from "./models/GuildMember";
import { Guild } from "./models/Guild";
import { User } from "./models/User";
import { ulid } from "ulid";

export async function findUser(user_id: string): Promise<User> {
  let user = await User.findOne({ where: { dUserID: user_id } });

  if (!user) {
    try {
      user = await User.create({
        UUID: ulid(),
        dUserID: user_id,
        userStatus: 0,
        profileColor: `5d20a1`,
        lifetimeXP: 1
      });
      console.warn(`New user ${user.dUserID} added to database with default color ${user.profileColor}`);
    } catch (error) {
      console.trace(error);
      throw error;
    }
  }

  return user;
}

export async function findGuild(server_id: string): Promise<Guild> {
  let server = await Guild.findOne({ where: { dGuildID: server_id } });

  if (!server) {
    try {
      server = await Guild.create({
        UUID: ulid(),
        dGuildID: server_id,
      });
      console.warn(`New server ${server.dGuildID} added to database`);
    } catch (error) {
      console.trace(error);
      throw error;
    }
  }

  return server;
}

export async function findGuildMember(user_id: string, server_id: string): Promise<GuildMember> {
  let server_user = await GuildMember.findOne({ where: { dUserID: user_id, dGuildID: server_id } });

  if (!server_user) {
    try {
      server_user = await GuildMember.create({
        UUID: ulid(),
        dGuildID: server_id,
        dUserID: user_id,
        currentMoney: 1000,
        currentLevel: 0,
        currentXP: 1,
        totalXP: 1,
        requiredXPForNextLevel: 100,
        verified: false,
        cooldowns: JSON.stringify({
          daily: { uses_left: 1, last_use_timestamp: 0 },
          coinflip: { uses_left: 20, last_use_timestamp: 0 },
          slots: { uses_left: 10, last_use_timestamp: 0 },
          highlow: { uses_left: 5, last_use_timestamp: 0 }
        })
      });
      console.warn(`New user ${user_id} added to database with ${server_user.dUserID}, on server ${server_user.dGuildID}`);
    } catch (error) {
      console.trace(error);
      throw error;
    }
  }

  return server_user;
}

export async function findGuildSettings(server_id: string): Promise<GuildSettings> {
  let server = await GuildSettings.findOne({
    where: { dGuildID: server_id },
  });

  if (!server) {
    try {
      server = await GuildSettings.create({
        UUID: ulid(),
        dGuildID: server_id,
      });
      console.warn(`New server settings for ${server.dGuildID} added to database`);
    } catch (error) {
      console.trace(error);
      throw error;
    }
  }

  return server;
}
