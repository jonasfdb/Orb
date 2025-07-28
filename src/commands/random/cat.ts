// Orb - Command for users to receive a random image of a cat
// Copyright (C) 2025 Jonas Frank de Buhr (jonasfdb)
// Licensed under the AGPL-3.0 license as laid out in LICENSE

import Discord from "discord.js";
import SRA from "somerandomapi.js"
import { colors } from "../../util/colors";
import { validateCommandInteractionInGuild } from "../../util/validate";

export default {
  data: new Discord.SlashCommandBuilder()
    .setName('cat')
    .setDescription('You get a cat image!'),

  async execute(client: Discord.Client<true>, interaction: Discord.ChatInputCommandInteraction) {
    validateCommandInteractionInGuild(interaction);

    const random_cat = await SRA.animal.image({ animal: "cat" });

    const cat_embed = new Discord.EmbedBuilder()
      .setColor(colors.color_default)
      .setTitle("Here is a random cat for you!")
      .setImage(random_cat.imgUrl)

    interaction.reply({ embeds: [cat_embed] });
  }
}
