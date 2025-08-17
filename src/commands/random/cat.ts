// Orb - Command for users to receive a random image of a cat
// Copyright (C) 2025 Jonas Frank de Buhr (jonasfdb)
// Licensed under the AGPL-3.0 license as laid out in LICENSE

import Discord from "discord.js";
import { colors } from "../../util/colors";
import { validateCommandInteractionInGuild } from "../../util/validate";

export default {
  data: new Discord.SlashCommandBuilder()
    .setName('cat')
    .setDescription('You get a cat image!'),

  async execute(client: Discord.Client<true>, interaction: Discord.ChatInputCommandInteraction) {
    validateCommandInteractionInGuild(interaction);

    let random_cat; 

    try {
      let response = await fetch('https://api.some-random-api.com/animal/cat');
      if(!response || !response.ok) {
        throw new Error(`Unable to perform fetch request.`)
      }

      random_cat = await response.json();
    } catch (error: any) {
      throw new Error(error);
    }

    const cat_embed = new Discord.EmbedBuilder()
      .setColor(colors.color_default)
      .setTitle("Here is a random cat for you!")
      .setImage(random_cat.image)

    interaction.reply({ embeds: [cat_embed] });
  }
}
