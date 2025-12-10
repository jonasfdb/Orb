// Orb - Event handler for interactionCreate events
// Copyright (C) 2025 Jonas Frank de Buhr (jonasfdb)
// Licensed under the AGPL-3.0 license as laid out in LICENSE

import { Events, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, Interaction } from "discord.js";
import { generateErrorID } from "../util/generators";
import { emojis } from "../../util/json/emojis";
import { colors } from "../../util/json/colors";

export default {
	name: Events.InteractionCreate,

	async execute(interaction: Interaction) {
    if (interaction.isChatInputCommand()) {
      const command = interaction.client.commands.get(interaction.commandName);

      if (!command) {
        console.trace(`No command matching ${interaction.commandName} was found.`);
        return;
      }

      try {
        await command.execute(interaction.client, interaction);
      } catch (error: unknown) {
        const errorCode = generateErrorID();

        try {
          console.warn(`New error added to error log at ID ${errorCode}.`);
          console.trace(error);
        } catch (error) {
          console.error(`Error on creating error entry. How?`);
          console.trace(error);
        }

        const embExecutionError = new EmbedBuilder()
          .setTitle(`${emojis.cross} - Something went wrong!`)
          .setColor(colors.error)
          .setDescription('An unexpected error occurred while executing the command. You can report this error on the Orb Support Server with the error code below if the command keeps failing.')
          .addFields({
            name: 'Error code:',
            value: errorCode,
            inline: false
          });

        const btnJoinSupportServer: ButtonBuilder = new ButtonBuilder()
          .setLabel('Join Orb Support Server')
          .setURL('https://discord.gg/UDpMWv5xfe')
          .setStyle(ButtonStyle.Link)

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(btnJoinSupportServer)

        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({ embeds: [embExecutionError], components: [row], ephemeral: true });
        } else {
          await interaction.reply({ embeds: [embExecutionError], components: [row], ephemeral: true });
        }
      }
    } else if (interaction.isMessageComponent()) {
      // handle message component
      // console.log("Message component")
    }
	},
};
