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
        .addFields([
          {
            name: '**I.** Moderation',
            value:  '\u{251C}[<:attention_icon_flat:1222305975822717120>] Swear Word List\n' +
                    '\u{2514}[<:orb_toggle_b_enabled_flat:1222635342457339914>] Toxicity Analyzer',
            inline: true,
          },
          {
            name: '**II.** Welcoming',
            value:  '\u{251C}[<:orb_toggle_b_enabled_flat:1222635342457339914>] Captcha Security\n' +
                    '\u{251C}[<:orb_disabled:1222634792777023688>] Welcome/Leave channel\n' + 
                    '\u{2514}[<:orb_disabled:1222634792777023688>] Welcome/Leave messages',
            inline: true,
          },
          {
            name: '**III.** Leveling',
            value:  '\u{251C}[<:attention_icon_flat:1222305975822717120>] MEE6 Import\n' + 
                    '\u{2514}[<:orb_toggle_b_enabled_flat:1222635342457339914>] Rewards',
            inline: true,
          },
          {
            name: '**IV.** Toggleables',
            value: '(none)',
            inline: true,
          }
        ])

      const selSettings = new Discord.StringSelectMenuBuilder()
        .setCustomId('selSettings')
        .setPlaceholder('Select setting...')
        .setOptions(
          new Discord.StringSelectMenuOptionBuilder()
            .setLabel('Moderation')
            .setDescription('Modify how Orb protects you.')
            .setValue('1'),
          new Discord.StringSelectMenuOptionBuilder()
            .setLabel('Welcoming and security')
            .setDescription('Change how members get to join your server.')
            .setValue('2'),
          new Discord.StringSelectMenuOptionBuilder()
            .setLabel('Leveling')
            .setDescription('How Orb leveling works.')
            .setValue('3'),
          new Discord.StringSelectMenuOptionBuilder()
            .setLabel('Toggleables')
            .setDescription('Change some toggles for Orb.')
            .setValue('4'),
        )

      const selSettingsRow = new Discord.ActionRowBuilder<Discord.StringSelectMenuBuilder>().addComponents(selSettings);

      let reply = await interaction.editReply({ embeds: [embConfig], components: [selSettingsRow] });

      try {
        const collectorFilter = (selection: Discord.MessageComponentInteraction) => selection.user.id === interaction.user.id;
        const confirmationCollector = reply.createMessageComponentCollector({ filter: collectorFilter, time: 30_000 });
        
        confirmationCollector.on('collect', (confirmation: Discord.StringSelectMenuInteraction) => {
          switch (confirmation.values[0]) {
            case '1':
              interaction.editReply({ content: `${confirmation.customId}`, components: [] });
              console.log("gee willickers")
              break;
            case '2':
              interaction.editReply({ content: `${confirmation.customId}`, components: [] });
              break;
            case '3':
              interaction.editReply({ content: `${confirmation.customId}`, components: [] });
              break;
            case '4':
              interaction.editReply({ content: `${confirmation.customId}`, components: [] });
              break;
          }
        });

      } catch {
        await interaction.editReply({ content: 'Confirmation not received within 1 minute, cancelling', components: [] });
      }
    }

    showConfigEmbed();
  }
}