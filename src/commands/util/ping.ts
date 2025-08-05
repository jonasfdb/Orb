// Orb - Command to check ping of the bot
// Copyright (C) 2025 Jonas Frank de Buhr (jonasfdb)
// Licensed under the AGPL-3.0 license as laid out in LICENSE

import Discord from "discord.js";
import { emojis } from "../../util/emojis";
import { colors } from "../../util/colors";
import { validateCommandInteractionInGuild } from "../../util/validate";

export default {
  data: new Discord.SlashCommandBuilder()
    .setName('ping')
    .setDescription('Ping information.'),

  async execute(client: Discord.Client<true>, interaction: Discord.ChatInputCommandInteraction) {
    validateCommandInteractionInGuild(interaction);
    const received = Date.now();

    const pinging_embed = new Discord.EmbedBuilder()
      .setColor(colors.color_default)
      .setTitle("Current pings:")
      .setAuthor({ iconURL: client.user.displayAvatarURL().toString(), name: 'Orb' })
      .setDescription(`${emojis.loading_animation_emoji} Pinging...`)

    let sent = await interaction.reply({ embeds: [pinging_embed] });

    let days = Math.floor(client.uptime / 86400000);
    let hours = Math.floor(client.uptime / 3600000) % 24;
    let minutes = Math.floor(client.uptime / 60000) % 60;
    let seconds = Math.floor(client.uptime / 1000) % 60;
    const uptime_string = `${days}d ${hours}h ${minutes}m ${seconds}s`;

    let websocket_ping = Math.floor(client.ws.ping) < 1 ? `?` : Math.ceil(client.ws.ping);

    const ping_embed = new Discord.EmbedBuilder()
      .setColor(colors.color_default)
      .setTitle("\u{1F3D3} Pong!")
      .setAuthor({ iconURL: client.user.displayAvatarURL().toString(), name: 'Orb' })
      .setDescription(`Client has been running for **${uptime_string}**.`)
      .addFields(
        {
          name: "Ping values",
          value: `\n\u{251C} **${received - sent.createdAt.getTime()} ms** Discord > Bot` +
            `\n\u{251C} **${websocket_ping} ms** Bot > Discord API` +
            `\n\u{2514} **${Math.ceil(client.ws.ping) + (received - sent.createdAt.getTime()) + 1} ms total** `,
          inline: false,
        }
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [ping_embed] });
  }
}
