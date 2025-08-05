// Orb - Command for server stuff
// Copyright (C) 2025 Jonas Frank de Buhr (jonasfdb)
// Licensed under the AGPL-3.0 license as laid out in LICENSE

import Discord, { PermissionFlagsBits } from "discord.js";
import { validateCommandInteractionInGuild } from "../../util/validate";
import { colors } from "../../util/colors";
import { emojis } from "../../util/emojis";

export default {
  data: new Discord.SlashCommandBuilder()
    .setName("server")
    .setDescription("Command group for all server settings.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(client: Discord.Client<true>, interaction: Discord.ChatInputCommandInteraction) {
    validateCommandInteractionInGuild(interaction);

    const profile_embed = new Discord.EmbedBuilder()
      .setColor(colors.color_info)
      .setTitle(`${emojis.attention_emoji} - Moved!`)
      .setDescription(`Server settings have been moved to the /settings command to free up /server for other things like events.`)

    await interaction.reply({ embeds: [profile_embed] });
  }
}
