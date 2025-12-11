// Orb - Command for users to check their leveling status and progress on a server
// Copyright (C) 2025 Jonas Frank de Buhr (jonasfdb)
// Licensed under the AGPL-3.0 license as laid out in LICENSE

import Discord from "discord.js";
import { findGuildMember } from "../../util/database/dbutils";
import { GuildMember } from "../../util/database/models/GuildMember";
import { validateCommandInteractionInGuild, validateGuildMember } from "../../util/validate";
import { colors } from "../../../util/json/colors";

export default {
  data: new Discord.SlashCommandBuilder()
    .setName("rank")
    .setDescription("Shows the rank of the target user.")
    .addUserOption((option) => option
      .setName("user")
      .setDescription("The user to show the level progress of, leave empty if it's your own.")
    ),

  async execute(client: Discord.Client<true>, interaction: Discord.ChatInputCommandInteraction) {
    validateCommandInteractionInGuild(interaction);

    let rankTargetMember = interaction.options.getMember("user") ?? interaction.member;
    validateGuildMember(rankTargetMember);

    const dbGuildMember = await findGuildMember(rankTargetMember.id, rankTargetMember.guild.id);

    const allMembers = await GuildMember.findAll({
      order: [['totalXP', 'DESC']],
      where: { dGuildID: interaction.guild.id },
    })
    let allMembersIDArray: string[] = [];
    allMembers.forEach(member => {
      allMembersIDArray.push(member.dUserID)
    })
    const memberRank = allMembersIDArray.indexOf(rankTargetMember.id) + 1;
    const memberAvatar = rankTargetMember.displayAvatarURL({ extension: 'webp' });

    // there used to be a graphical progress bar here using canvas, but I removed that when I switched to TS and also changed the logo
    // it will be there eventually, I have to just learn canvas more to get the look I want, like the logo
    let fraction = dbGuildMember.currentXP / dbGuildMember.requiredXPForNextLevel;
    let progressbar = [];
    for (let i = 0; i < 24; i++) {
      if ((i / 24) < fraction) {
        progressbar.push('\u{FFED}');
      } else {
        progressbar.push('\u{FF65}');
      }
    }

    let messagesUntilLevelup = Math.round((dbGuildMember.requiredXPForNextLevel - dbGuildMember.currentXP) / 6.5);

    const embRank = new Discord.EmbedBuilder()
      .setColor(colors.default)
      .setAuthor({ name: `${rankTargetMember.nickname || rankTargetMember.displayName}`, iconURL: memberAvatar })
      .addFields({
        name: `Level **${dbGuildMember.currentLevel}** - ${dbGuildMember.currentXP.toString()} / ${dbGuildMember.requiredXPForNextLevel.toString()} XP - Rank **${memberRank}**`,
        value: `[${progressbar.join('')}]`,
        inline: false
      })
      .setFooter({ text: `About ${messagesUntilLevelup} messages left to next level.` })

    interaction.reply({ embeds: [embRank], /* files: [progressbar_image]*/ });
  }
}
