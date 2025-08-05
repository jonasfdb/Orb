// Orb - Script to announce update messages to all servers with broadcasting enabled
// Copyright (C) 2025 Jonas Frank de Buhr (jonasfdb)
// Licensed under the AGPL-3.0 license as laid out in LICENSE

import Discord from "discord.js";
import { ServerSettings } from "../src/util/database/models/ServerSettings";
import { validateClientReady, validateGuildTextChannel } from "../src/util/validate";
import { colors } from "../src/util/colors";
import { config } from "../config/config";
import { initDatabase } from "../src/util/database/dbinit";
const { token, database } = config;

const gatewayIntentList = new Discord.IntentsBitField();
gatewayIntentList.add(
  Discord.GatewayIntentBits.Guilds,
  Discord.GatewayIntentBits.GuildMessages
);

const client = new Discord.Client({
  intents: gatewayIntentList,
});

/* Emoji list
  \u{1F4EF} - Postal horn (for announcements)
  \u{1F4E1} - Satellite antenna (also for announcements, not sure yet)
  \u{1F527} - Wrench (for updates)
  \u{1F4E5} - Inbox tray (infos maybe)
*/

const announcement_embed = new Discord.EmbedBuilder()
  .setColor(colors.color_default)
  .setTitle(`\u{1F4EF} - Announcement!`)
  .setDescription(`test`)
  .addFields(
    { name: `test`, value: `test` },
  )

initDatabase();
const server_array = await ServerSettings.findAll({ where: { broadcasts_allowed: true } });

let iterator = 0;
let failures = 0;
let array_length = server_array.length;

await client.login(token as string);
console.log("Broadcasting...")
server_array.forEach(async (server: ServerSettings) => {
  try {
    if (!server.broadcast_channel_id) {
      return;
    }

    const channel_to_send = await client.channels.fetch(server.broadcast_channel_id);
    if (channel_to_send) {
      validateGuildTextChannel(channel_to_send);
      validateClientReady(client);
      if (channel_to_send.permissionsFor(client.user)?.has(Discord.PermissionFlagsBits.SendMessages)) {
        await channel_to_send.send({ embeds: [announcement_embed] });
      } else {
        failures++;
      }
    } else {
      failures++;
    }
  } catch (error) {
    console.trace(error);
    failures++;
  }

  iterator++;
  if (iterator >= array_length) {
    client.destroy();
    console.warn(`Successfully distributed announcement to ${array_length - failures} servers.`);
    process.exit(`0`);
  }
});
