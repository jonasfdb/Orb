// Orb - Command for users to check a server's leveling leaderboard
// Copyright (C) 2025 Jonas Frank de Buhr (jonasfdb)
// Licensed under the AGPL-3.0 license as laid out in LICENSE

import Discord from "discord.js";
import { colors } from "../../util/colors"
import { ServerUser } from "../../util/database/models/ServerUser";
import { validateCommandInteractionInGuild } from "../../util/validate";
import { getGuildIcon } from "../../util/helpers";

export default {
  data: new Discord.SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("Shows the leaderboard of the server."),

  async execute(client: Discord.Client<true>, interaction: Discord.ChatInputCommandInteraction) {
    validateCommandInteractionInGuild(interaction);
    await interaction.deferReply()

    let e = 0;
    let leaderboard_string_array = [];
    let leaderboard_embed = new Discord.EmbedBuilder()
      .setColor(colors.color_default)
      .setAuthor({ name: `${interaction.guild.name}'s leaderboard`, iconURL: getGuildIcon(interaction) })
      .setTimestamp(Date.now());

    const raw_leaderboard_array = await ServerUser.findAll({
      limit: 10,
      order: [["total_xp", "DESC"]],
      where: { server_id: interaction.guild.id },
    });

    for (e; e < raw_leaderboard_array.length; e++) {
      let name_string = ``;
      const leaderboard_user = await client.users.fetch(raw_leaderboard_array[e].user_id.toString());

      switch (e) {
        case 0:
          // name_string = `**<@${lbUser.id}>** \u{1F389}`;
          name_string = `\u{1F389} \u{2500} **<@${leaderboard_user.id}>**`;   // \u{1F948} is the 1st place medal, \u{1F3C6} is the trophy
          break;
        case 1:
          name_string = `\u{1F948} \u{2500} **<@${leaderboard_user.id}>**`;
          break;
        case 2:
          name_string = `\u{1F949} \u{2500} **<@${leaderboard_user.id}>**`;
          break;
        default:
          // name_string = `**<@${lbUser.id}>**`;
          name_string = `**#${e + 1}** \u{2500} **<@${leaderboard_user.id}>**`;
          break;
      }

      // leaderboardStringTOP.push(`${name_string}\n\u{200B}\u{2514} **#${e + 1}** | Level **${rawLeaderboardTOP[e].current_level}** | XP: **${rawLeaderboardTOP[e].total_xp}**`);
      leaderboard_string_array.push(`${name_string}\n\u{200B}\u{2514} Level **${raw_leaderboard_array[e].current_level}** | XP: **${raw_leaderboard_array[e].total_xp}**`);
    }

    leaderboard_embed.addFields({
      name: `Most active members:`,
      value: `${leaderboard_string_array.join("\n")}`,
    });

    interaction.editReply({ embeds: [leaderboard_embed] });
  }
}
