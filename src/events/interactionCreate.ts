// Orb - Event handler for interactionCreate events
// Copyright (C) 2025 Jonas Frank de Buhr (jonasfdb)
// Licensed under the AGPL-3.0 license as laid out in LICENSE

import { Events, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, Interaction } from "discord.js";
import { generate_error_id } from "../util/generators";
import { emojis } from "../util/emojis";
import { colors } from "../util/colors";

export default {
	name: Events.InteractionCreate,

	async execute(interaction: Interaction) {
		if (!interaction.isChatInputCommand()) return;

		console.log(`Running ${interaction.commandName} on server ${interaction.guildId}/#${interaction.channelId} by user ${interaction.user.id}`)

		const command = interaction.client.commands.get(interaction.commandName);

		if (!command) {
			console.trace(`No command matching ${interaction.commandName} was found.`);
			return;
		}

		try {
			await command.execute(interaction.client, interaction);
		} catch (error: any) {
			const error_code = generate_error_id();

			try {
				console.warn(`New error added to error log at ID ${error_code}.`);
				console.trace(error);
			} catch (error) {
				console.error(`Error on creating error entry. How?`);
				console.trace(error);
			}

			const failure_embed = new EmbedBuilder()
			.setTitle(`${emojis.failure_emoji} - Something went wrong!`)
			.setColor(colors.color_error)
			.setDescription('An unexpected error occurred while executing the command. You can report this error on the Orb Support Server with the error code below if the command keeps failing.')
			.addFields({
				name: 'Error code:',
				value: error_code,
				inline: false
			});

			const join_support_server_button: ButtonBuilder = new ButtonBuilder()
				.setLabel('Join Orb Support Server')
				.setURL('https://discord.gg/UDpMWv5xfe')
				.setStyle(ButtonStyle.Link)

			const join_row = new ActionRowBuilder<ButtonBuilder>().addComponents(join_support_server_button)

			if (interaction.replied || interaction.deferred) {
				await interaction.followUp({ embeds: [failure_embed], components: [join_row], ephemeral: true });
			} else {
				await interaction.reply({ embeds: [failure_embed], components: [join_row], ephemeral: true });
			}
		}
	},
};
