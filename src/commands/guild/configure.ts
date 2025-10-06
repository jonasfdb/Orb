import Discord from "discord.js";
import { validateCommandInteractionInGuild } from "../../util/validate";

export default {
  data: new Discord.SlashCommandBuilder()
    .setName('configure')
    .setDescription('description'),

  async execute(client: Discord.Client<true>, interaction: Discord.ChatInputCommandInteraction) {
    validateCommandInteractionInGuild(interaction);
    await interaction.deferReply();

    async function showConfigEmbed () {
      const embConfig = new Discord.EmbedBuilder()
        .setTitle('bing')
        .setDescription('bong')

      const selSettings = new Discord.StringSelectMenuBuilder()
        .setCustomId('selSettings')
        .setPlaceholder('Select setting...')
        .setOptions(
          new Discord.StringSelectMenuOptionBuilder()
            .setLabel('Welcome/Leave messages')
            .setValue('1'),
          new Discord.StringSelectMenuOptionBuilder()
            .setLabel('Welcome/Leave channel')
            .setValue('2'),
          new Discord.StringSelectMenuOptionBuilder()
            .setLabel('Announcement channel')
            .setValue('3'),
          new Discord.StringSelectMenuOptionBuilder()
            .setLabel('Option 3')
            .setValue('4'),
        )

      const selSettingsRow = new Discord.ActionRowBuilder<Discord.StringSelectMenuBuilder>().addComponents(selSettings);

      let reply = await interaction.editReply({ embeds: [embConfig], components: [selSettingsRow] });

      try {
        const collectorFilter = (selection: Discord.MessageComponentInteraction) => selection.user.id === interaction.user.id;
        const confirmation = await reply.awaitMessageComponent({ filter: collectorFilter, time: 60_000 });
        await confirmation.deferUpdate();

        switch (confirmation.customId) {
          case '1':
            interaction.editReply('1')
            break;
          case '2':
            interaction.editReply('2')
            break;
          case '3':
            interaction.editReply('3')
            break;
          case '4':
            interaction.editReply('4')
            break;
        }
      } catch {
        await interaction.editReply({ content: 'Confirmation not received within 1 minute, cancelling', components: [] });
      }
    }

    showConfigEmbed();
  }
}