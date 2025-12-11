// Orb - Command for users to check a server's leveling leaderboard
// Copyright (C) 2025 Jonas Frank de Buhr (jonasfdb)
// Licensed under the AGPL-3.0 license as laid out in LICENSE

import Discord from "discord.js";
import { colors } from "../../../util/json/colors"
import { GuildMember } from "../../util/database/models/GuildMember";
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
    let leaderboardArray = [];
    let embLeaderboard = new Discord.EmbedBuilder()
      .setColor(colors.default)
      .setAuthor({ name: `${interaction.guild.name}'s leaderboard`, iconURL: getGuildIcon(interaction) })
      .setTimestamp(Date.now());

    const leaderboardArrayRaw = await GuildMember.findAll({
      limit: 10,
      order: [["totalXP", "DESC"]],
      where: { dGuildID: interaction.guild.id },
    });

    for (e; e < leaderboardArrayRaw.length; e++) {
      let nameString = ``;
      const leaderboardUser = await client.users.fetch(leaderboardArrayRaw[e].dUserID.toString());

      switch (e) {
        // \u{1F948} is the 1st place medal, \u{1F3C6} is the trophy
        case 0:
          nameString = `\u{1F389} \u{2500} **<@${leaderboardUser.id}>**`;   
          break;
        case 1:
          nameString = `\u{1F948} \u{2500} **<@${leaderboardUser.id}>**`;
          break;
        case 2:
          nameString = `\u{1F949} \u{2500} **<@${leaderboardUser.id}>**`;
          break;
        default:
          nameString = `**#${e + 1}** \u{2500} **<@${leaderboardUser.id}>**`;
          break;
      }
      leaderboardArray.push(`${nameString}\n\u{200B}\u{2514} Level **${leaderboardArrayRaw[e].currentLevel}** | XP: **${leaderboardArrayRaw[e].totalXP}**`);
    }

    embLeaderboard.addFields({
      name: `Most active members:`,
      value: `${leaderboardArray.join("\n")}`,
    });

    interaction.editReply({ embeds: [embLeaderboard] });
  }
}
