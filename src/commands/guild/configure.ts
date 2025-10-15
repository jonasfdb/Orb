import Discord from "discord.js";
import { validateCommandInteractionInGuild, validateMessageInGuild } from "../../util/validate";
import { emojis } from "../../../util/json/emojis";

export default {
  data: new Discord.SlashCommandBuilder()
    .setName('configure')
    .setDescription('description'),

  async execute(client: Discord.Client<true>, interaction: Discord.ChatInputCommandInteraction) {
    validateCommandInteractionInGuild(interaction);
    await interaction.deferReply();
    // showConfigEmbed();
    // showConfigMessage(interaction);
    pathArray = [];
    showSettingsMenu(interaction);
  }
}

let pathArray: any = [];

const backButton = new Discord.ButtonBuilder()
  .setCustomId('backButton')
  .setLabel('Save and Return')
  .setStyle(Discord.ButtonStyle.Primary)
const saveButton = new Discord.ButtonBuilder()
  .setCustomId('saveButton')
  .setLabel('Save and Exit')
  .setStyle(Discord.ButtonStyle.Success)
const abortButton = new Discord.ButtonBuilder()
  .setCustomId('abortButton')
  .setLabel('Abort')
  .setStyle(Discord.ButtonStyle.Danger)
const navButtonRow = new Discord.ActionRowBuilder<Discord.ButtonBuilder>().addComponents(/*backButton,*/ saveButton, abortButton)

async function navigateSettings(interaction: Discord.ChatInputCommandInteraction, message: Discord.Message<true>) {
  try {
    const collectorFilter = (selection: Discord.MessageComponentInteraction) => selection.user.id === interaction.user.id;
    const navCollector = message.createMessageComponentCollector({ filter: collectorFilter, time: 30_000 });
    
    navCollector.on('collect', async (confirmation: Discord.ButtonInteraction) => {
      console.log(confirmation)
      await confirmation.deferUpdate();
      switch (confirmation.customId) {
        case 'backButton':
          /*
          // console.log(interaction);
          pathArray[pathArray.length - 2](interactionGlobal); // execute function stored in array index-1
          break;
          */
        case 'saveButton':
          // TODO: Save routine here, and save error handler (perhaps sequelize.save()? could work yea)

          const saveContainer = new Discord.ContainerBuilder()
          .addTextDisplayComponents((textDisplay) =>
            textDisplay.setContent(
              `### ${emojis.success_emoji} - Changes saved!\n` +
              'Successfully (and carefully) stored the changes you made.'
            ),
          )

          await interaction.editReply({
            components: [saveContainer],
            flags: Discord.MessageFlags.IsComponentsV2,
          });
          break;
        case 'abortButton':
          const abortContainer = new Discord.ContainerBuilder()
            .addTextDisplayComponents((textDisplay) =>
              textDisplay.setContent(
                `### ${emojis.failure_emoji} - Aborted\n` +
                'Successfully aborted. No changes to your settings were made.'
              ),
            )

          await interaction.editReply({
            components: [abortContainer],
            flags: Discord.MessageFlags.IsComponentsV2,
          });
          break;
      }
    });
  } catch {
    // TODO: Add timeout message as MessageComponentV2 too
  }
}

async function showSettingsMenu(interaction: Discord.ChatInputCommandInteraction) {
  // pathArray.push(showSettingsMenu);

  const settingsContainer = new Discord.ContainerBuilder()
    .addTextDisplayComponents((textDisplay) =>
      textDisplay.setContent(
        '## \u{1F9D9} - Settings Wizard\n' +
        'Welcome to the Settings Wizard for this wonderful server. Please select a setting to change below.'
      ),
    )
    .addSeparatorComponents((separator) => separator)
    .addSectionComponents((section) => section
      .addTextDisplayComponents(
        (textDisplay) =>
          textDisplay.setContent(
            '### General\n' +
            'Server locale, bot permissions, privacy, ...'
          ),
      )
      .setButtonAccessory((button) =>
        button.setCustomId('ebutton1').setLabel('Change...').setStyle(Discord.ButtonStyle.Primary),
      )
    )
    .addSeparatorComponents((separator) => separator)
    .addSectionComponents((section) => section
      .addTextDisplayComponents(
        (textDisplay) =>
          textDisplay.setContent(
            '### Welcoming\n' +
            'Welcome/leave messages and channels, captcha, verification, ...'
          ),
      )
      .setButtonAccessory((button) =>
        button.setCustomId('ebutton2').setLabel('Change...').setStyle(Discord.ButtonStyle.Primary),
      )
    )
    .addSeparatorComponents((separator) => separator)
    .addSectionComponents((section) => section
      .addTextDisplayComponents(
        (textDisplay) =>
          textDisplay.setContent(
            '### Logging\n' +
            'Log channels, what to log, ...'
          ),
      )
      .setButtonAccessory((button) =>
        button.setCustomId('ebutton3').setLabel('Change...').setStyle(Discord.ButtonStyle.Primary),
      )
    );

  let reply = await interaction.editReply({
    components: [settingsContainer],
    flags: Discord.MessageFlags.IsComponentsV2,
  });

  try {
    const collectorFilter = (selection: Discord.MessageComponentInteraction) => selection.user.id === interaction.user.id;
    const confirmationCollector = reply.createMessageComponentCollector({ filter: collectorFilter, time: 30_000 });
    
    confirmationCollector.on('collect', (confirmation: Discord.StringSelectMenuInteraction) => {
      console.log("collected")
      console.log(confirmation)
      switch (confirmation.customId) {
        case 'ebutton1':
          interaction.editReply({ content: `${confirmation.customId}`, components: [] });
          break;
        case 'ebutton2':
          showConfigMessage(interaction);
          break;
        case 'ebutton3':
          interaction.editReply({ content: `${confirmation.customId}`, components: [] });
          break;
        case 'ebutton4':
          interaction.editReply({ content: `${confirmation.customId}`, components: [] });
          break;
      }
    });

  } catch {
    // TODO: Add timeout message as MessageComponentV2 too
  }
}

async function showConfigMessage(interaction: Discord.ChatInputCommandInteraction) {
  // pathArray.push(showConfigMessage);

  const exampleContainer = new Discord.ContainerBuilder()
    .addTextDisplayComponents((textDisplay) =>
      textDisplay.setContent(`Current welcome channel: <#${interaction.channel?.id}>`),
    )
    .addActionRowComponents((actionRow) =>
      actionRow.setComponents(
        new Discord.ChannelSelectMenuBuilder()
          .setCustomId('welcomeChannelSelect')
          .setPlaceholder('Change welcome channel...'),
        ),
    )
    .addActionRowComponents((actionRow) =>
      actionRow.setComponents(
        new Discord.ChannelSelectMenuBuilder()
          .setCustomId('leaveChannelSelect')
          .setPlaceholder('Change leave channel...'),
        ),
    )
    .addSeparatorComponents((separator) => separator)
    .addTextDisplayComponents((textDisplay) =>
      textDisplay.setContent(`Current leave message channel: <#${interaction.channel?.id}>`),
    )
    .addActionRowComponents((actionRow) =>
      actionRow.setComponents(
        new Discord.ChannelSelectMenuBuilder()
          .setCustomId('exampleSelect2')
          .setPlaceholder('Change...'), 
        // new Discord.ButtonBuilder().setCustomId('exampleToggle').setLabel('Disable').setStyle(Discord.ButtonStyle.Danger),
        // new Discord.ButtonBuilder().setCustomId('exampleToggle2').setLabel('Enable').setStyle(Discord.ButtonStyle.Success).setDisabled(),
      ),
    )

  let reply = await interaction.editReply({
    components: [exampleContainer, navButtonRow],
    flags: Discord.MessageFlags.IsComponentsV2,
  });
  validateMessageInGuild(reply);
  navigateSettings(interaction, reply);
  return;
}