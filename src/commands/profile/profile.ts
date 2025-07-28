// Orb - Command to show user profiles
// Copyright (C) 2025 Jonas Frank de Buhr (jonasfdb)
// Licensed under the AGPL-3.0 license as laid out in LICENSE

import Discord from "discord.js";
import { colors } from "../../util/colors";
import { emojis } from "../../util/emojis";
import { validateCommandInteractionInGuild } from "../../util/validate";

export default {
  data: new Discord.SlashCommandBuilder()
    .setName("profile")
    .setDescription("See the profile of someone.")
    .addMentionableOption((option) => option
      .setName('server_user')
      .setDescription('The server_user of which you want to see the profile.')
    ),

  async execute(client: Discord.Client<true>, interaction: Discord.ChatInputCommandInteraction) {
    validateCommandInteractionInGuild(interaction);

    const profile_embed = new Discord.EmbedBuilder()
      .setColor(colors.color_info)
      .setTitle(`${emojis.attention_emoji} - Coming soon!`)
      .setDescription(
        `Profiles are currently being reworked.` +
        `A lot of the ideas I originally had, like pronoun fields and server-specific bios, are now natively part of Discord.` +
        `I do still have ideas though, and I will continue to add them here!\n\n` +
        `If you had a profile before by the way, don't worry about it. All data has been safely deleted, and anything you enter through the edit commands won't be stored.`
      )

    await interaction.reply({ embeds: [profile_embed] });
  }
}
