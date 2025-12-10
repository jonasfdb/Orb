// Orb - Command for users to check their wallet and gem count
// Copyright (C) 2025 Jonas Frank de Buhr (jonasfdb)
// Licensed under the AGPL-3.0 license as laid out in LICENSE

import Discord from "discord.js";
import { findGuildMember } from "../../util/database/dbutils";
import { validateCommandInteractionInGuild, validateGuildMember } from "../../util/validate";
import { colors } from "../../../util/json/colors";
import { emojis } from "../../../util/json/emojis";

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

    let walletTargetMember = interaction.options.getMember("user") ?? interaction.member;
    validateGuildMember(walletTargetMember);

    const dbGuildMember = await findGuildMember(walletTargetMember.id, walletTargetMember.guild.id);
    const memberAvatar = walletTargetMember.displayAvatarURL({ extension: 'webp' });

    const embWallet = new Discord.EmbedBuilder()
      .setColor(colors.default)
      .setAuthor({ name: `${walletTargetMember.nickname || walletTargetMember.displayName}`, iconURL: memberAvatar })
      .setDescription(`Current money: ${dbGuildMember.currentMoney} ${emojis.currency}`)

    interaction.reply({ embeds: [embWallet] });
  }
}