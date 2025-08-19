// Orb - Command to show user profiles
// Copyright (C) 2025 Jonas Frank de Buhr (jonasfdb)
// Licensed under the AGPL-3.0 license as laid out in LICENSE

import Discord from "discord.js";
import { colors } from "../../../util/json/colors";
import { emojis } from "../../../util/json/emojis";
import { validateCommandInteractionInGuild } from "../../util/validate";
import { out_of_order } from "../../util/outOfOrder";

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

    out_of_order(interaction, 'Profiles are being reworked at the moment.');
    return;
  }
}
