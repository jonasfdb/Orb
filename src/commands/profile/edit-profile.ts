// Orb - Command to edit user profiles
// Copyright (C) 2025 Jonas Frank de Buhr (jonasfdb)
// Licensed under the AGPL-3.0 license as laid out in LICENSE

import Discord from "discord.js";
import { emojis } from "../../util/emojis";
import { colors } from "../../util/colors";
import { validateCommandInteractionInGuild } from "../../util/validate";

export default {
  data: new Discord.SlashCommandBuilder()
    .setName("edit-profile")
    .setDescription("Command group to edit or show profile values.")
    .addSubcommand((subcommand) => subcommand
      .setName("color")
      .setDescription("Edit your profile embed's color.")
      .addStringOption((option) => option
        .setName("hexcode")
        .setDescription("Input the hex code of the color, or leave empty to display your current color's hex code.")
        .setMinLength(6)
        .setMaxLength(6)
      )
    )
    .addSubcommand((subcommand) => subcommand
      .setName("aboutme")
      .setDescription("Edit your Orb profile's About Me section.")
      .addStringOption((option) => option
        .setName("content")
        .setDescription("Content to put in your About Me.")
        .setMaxLength(512)
        .setRequired(true)
      )
    )
    .addSubcommand((subcommand) => subcommand
      .setName("pronouns")
      .setDescription("Edit your Orb profile's pronouns section.")
      .addStringOption((option) => option
        .setName("content")
        .setDescription("Desired pronouns to be shown. Seperate by comma.")
        .setMaxLength(72)
        .setRequired(true)
      )
    )
    .addSubcommand((subcommand) => subcommand
      .setName("birthday")
      .setDescription("Edit your Orb profile's birthday.")
      .addNumberOption((option) => option
        .setName("day")
        .setDescription("The day of your birth.")
        .setMinValue(1)
        .setMaxValue(31)
        .setRequired(true)
      )
      .addStringOption((option) => option
        .setName("month")
        .setDescription("The month of your birth.")
        .setRequired(true)
        .addChoices(
          { name: "January", value: "1" },
          { name: "February", value: "2" },
          { name: "March", value: "3" },
          { name: "April", value: "4" },
          { name: "May", value: "5" },
          { name: "June", value: "6" },
          { name: "July", value: "7" },
          { name: "August", value: "8" },
          { name: "September", value: "9" },
          { name: "October", value: "10" },
          { name: "November", value: "11" },
          { name: "December", value: "12" },
        )
      )
      .addNumberOption((option) => option
        .setName("year")
        .setDescription("Optional: The year of your birth.")
        .setMinValue(1901)
        .setMaxValue(2023)
      )
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
