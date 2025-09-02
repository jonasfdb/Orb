import Discord from "discord.js";
import { validateCommandInteractionInGuild } from "../../util/validate";

export default {
  data: new Discord.SlashCommandBuilder()
    .setName('configure')
    .setDescription('description'),

  async execute(client: Discord.Client<true>, interaction: Discord.ChatInputCommandInteraction) {
    validateCommandInteractionInGuild(interaction);
    await interaction.deferReply();
    // what the command will do
    function showConfigEmbed () {
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

      interaction.editReply({ embeds: [embConfig], components: [selSettingsRow] });
    }

    showConfigEmbed();
  }
}