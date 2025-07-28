// Orb - Command for users to check their wallet and gem count
// Copyright (C) 2025 Jonas Frank de Buhr (jonasfdb)
// Licensed under the AGPL-3.0 license as laid out in LICENSE

import Discord from "discord.js";
import { find_server_user } from "../../util/database/dbutils";
import { validateCommandInteractionInGuild, validateGuildMember } from "../../util/validate";
import { colors } from "../../util/colors";
import { emojis } from "../../util/emojis";

export default {
  data: new Discord.SlashCommandBuilder()
    .setName("wallet")
    .setDescription("Shows the wallet of the target user.")
    .addUserOption((option) => option
      .setName("user")
      .setDescription("The user to show the wallet of, leave empty if it's your own.")
    ),

  async execute(client: Discord.Client<true>, interaction: Discord.ChatInputCommandInteraction) {
    validateCommandInteractionInGuild(interaction);

    let wallet_target_member = interaction.options.getMember("user") ?? interaction.member;
    validateGuildMember(wallet_target_member);

    const server_user = await find_server_user(wallet_target_member.id, wallet_target_member.guild.id);
    const member_avatar = wallet_target_member.displayAvatarURL({ extension: 'webp' });

    const wallet_embed = new Discord.EmbedBuilder()
      .setColor(colors.color_default)
      .setAuthor({ name: `${wallet_target_member.nickname || wallet_target_member.displayName}`, iconURL: member_avatar })
      .setDescription(`Current money: ${server_user.current_money} ${emojis.currency_emoji}`)

    interaction.reply({ embeds: [wallet_embed] });
  }
}
