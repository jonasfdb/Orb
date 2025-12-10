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

    let rank_target_member = interaction.options.getMember("user") ?? interaction.member;
    validateGuildMember(rank_target_member);

    const server_user = await findGuildMember(rank_target_member.id, rank_target_member.guild.id);

    const all_members = await GuildMember.findAll({
      order: [['totalXP', 'DESC']],
      where: { dGuildID: interaction.guild.id },
    })
    let all_members_ids: string[] = [];
    all_members.forEach(member => {
      all_members_ids.push(member.dUserID)
    })
    const member_rank = all_members_ids.indexOf(rank_target_member.id) + 1;
    const member_avatar = rank_target_member.displayAvatarURL({ extension: 'webp' });

    // there used to be a graphical progress bar here using canvas, but I removed that when I switched to TS and also changed the logo
    // it will be there eventually, I have to just learn canvas more to get the look I want, like the logo
    let fraction = server_user.currentXP / server_user.requiredXPForNextLevel;
    let progressbar = [];
    for (let i = 0; i < 24; i++) {
      if ((i / 24) < fraction) {
        progressbar.push('\u{FFED}');
      } else {
        progressbar.push('\u{FF65}');
      }
    }

    let messages_until_levelup = Math.round((server_user.requiredXPForNextLevel - server_user.currentXP) / 6.5);

    const rank_embed = new Discord.EmbedBuilder()
      .setColor(colors.default)
      .setAuthor({ name: `${rank_target_member.nickname || rank_target_member.displayName}`, iconURL: member_avatar })
      .addFields({
        name: `Level **${server_user.currentLevel}** - ${server_user.currentXP.toString()} / ${server_user.requiredXPForNextLevel.toString()} XP - Rank **${member_rank}**`,
        value: `[${progressbar.join('')}]`,
        inline: false
      })
      .setFooter({ text: `About ${messages_until_levelup} messages left to next level.` })

    interaction.reply({ embeds: [rank_embed], /* files: [progressbar_image]*/ });
  }
}
