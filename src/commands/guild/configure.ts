import Discord from "discord.js";
import { validateCommandInteractionInGuild, validateGuildChannel, validateGuildTextChannel, validateMessageInGuild } from "../../util/validate";
import { emojis } from "../../../util/json/emojis";
import { find_server_settings } from "../../util/database/dbutils";
import { ServerSettings } from "../../util/database/models/ServerSettings";
import { colors } from "../../../util/json/colors";

export default {
  data: new Discord.SlashCommandBuilder()
    .setName('configure')
    .setDescription('description'),

  async execute(client: Discord.Client<true>, interaction: Discord.ChatInputCommandInteraction) {
    validateCommandInteractionInGuild(interaction);
    await interaction.deferReply();

    guildSettings = await find_server_settings(interaction.guild.id);
    pathArray = [];
    showSettingsMenu(interaction);
  }
}

let pathArray: any = [];
let guildSettings: ServerSettings;

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
    
    navCollector.on('collect', async (selection: Discord.ButtonInteraction) => {
      await selection.deferUpdate();
      switch (selection.customId) {
        case 'backButton':
          /*
          // console.log(interaction);
          pathArray[pathArray.length - 2](interactionGlobal); // execute function stored in array index-1
          break;
          */
        case 'saveButton':
          // TODO: Save routine here, and save error handler (perhaps sequelize.save()? could work yea)

          const saveContainer = new Discord.ContainerBuilder()
          .addTextDisplayComponents((textDisplay) => textDisplay
            .setContent(
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
            .addTextDisplayComponents((textDisplay) => textDisplay
              .setContent(
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
    .addTextDisplayComponents((textDisplay) => textDisplay
      .setContent(
        '## \u{1F9D9} - Settings Wizard\n' +
        'Welcome to the Settings Wizard for this wonderful server. Please select a setting to change below.'
      ),
    )
    .addSeparatorComponents((separator) => separator)
    .addSectionComponents((section) => section
      .addTextDisplayComponents((textDisplay) => textDisplay
        .setContent(
            '### General\n' +
            'Server locale, bot permissions, privacy, ...'
          ),
      )
      .setButtonAccessory((button) => button
        .setCustomId('sGeneral')
        .setLabel('Change...')
        .setStyle(Discord.ButtonStyle.Primary),
      )
    )
    .addSeparatorComponents((separator) => separator)
    .addSectionComponents((section) => section
      .addTextDisplayComponents((textDisplay) => textDisplay
          .setContent(
            '### Welcoming\n' +
            'Welcome/leave messages and channels, captcha, verification, ...'
          ),
      )
      .setButtonAccessory((button) => button
        .setCustomId('sWelcoming')
        .setLabel('Change...')
        .setStyle(Discord.ButtonStyle.Primary),
      )
    )
    .addSeparatorComponents((separator) => separator)
    .addSectionComponents((section) => section
      .addTextDisplayComponents((textDisplay) => textDisplay
        .setContent(
            '### Logging\n' +
            'Log channels, what to log, ...'
          ),
      )
      .setButtonAccessory((button) => button
        .setCustomId('sLogging')
        .setLabel('Change...')
        .setStyle(Discord.ButtonStyle.Primary),
      )
    );

  let reply = await interaction.editReply({
    components: [settingsContainer],
    flags: Discord.MessageFlags.IsComponentsV2,
  });

  try {
    const collectorFilter = (selection: Discord.MessageComponentInteraction) => selection.user.id === interaction.user.id;
    const selectionCollector = reply.createMessageComponentCollector({ filter: collectorFilter, time: 30_000 });
    
    selectionCollector.on('collect', (selection: Discord.StringSelectMenuInteraction) => {
      switch (selection.customId) {
        case 'sGeneral':
          showGeneralSettingsPage(interaction);
          break;
        case 'sWelcoming':
          showWelcomingSettingsPage(interaction);
          break;
        case 'sLogging':
          interaction.editReply({ content: `${selection.customId}`, components: [] });
          break;
      }
    });

  } catch {
    // TODO: Add timeout message as MessageComponentV2 too
  }
}

async function showGeneralSettingsPage(interaction: Discord.ChatInputCommandInteraction) {
  // pathArray.push(showConfigMessage);

  const exampleContainer = new Discord.ContainerBuilder()
    .addTextDisplayComponents((textDisplay) => textDisplay
      .setContent(`Orb update announcement channel`),
    )
    .addActionRowComponents((actionRow) => actionRow
      .setComponents(
        new Discord.ChannelSelectMenuBuilder()
          .setCustomId('aExample')
          .setPlaceholder('Change...'), 
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

async function showWelcomingSettingsPage(interaction: Discord.ChatInputCommandInteraction) {
  // pathArray.push(showConfigMessage);

  const exampleContainer = new Discord.ContainerBuilder()
    .addTextDisplayComponents((textDisplay) => textDisplay
      .setContent(
        `### Current welcoming settings\n\n` +
        `**Toggles**\n` +
        `\u{251C}<:orb_disabled:1222634792777023688> Welcome messages\n` +
        `\u{2514}<:orb_toggle_b_enabled_flat:1222635342457339914> Leave messages`
      ),
    )
    .addActionRowComponents((actionRow) => actionRow
      .setComponents(
        new Discord.StringSelectMenuBuilder()			
          .setCustomId('toggleWelcomingMessages')
          .setPlaceholder('Enable/Disable...')
          .addOptions(
            new Discord.StringSelectMenuOptionBuilder()
              .setLabel('Enable all')
              .setValue('11'),
            new Discord.StringSelectMenuOptionBuilder()
              .setLabel('Enable only welcome messages')
              .setValue('10'),
            new Discord.StringSelectMenuOptionBuilder()
              .setLabel('Enable only leave messages')
              .setValue('01'),
            new Discord.StringSelectMenuOptionBuilder()
              .setLabel('Disable all')
              .setValue('00'),
            // take value, split into two numbers, treat numbers as boolean, ez
          )
      )
    )
    .addSeparatorComponents((separator) => separator)
    .addTextDisplayComponents((textDisplay) => textDisplay
      .setContent(
        `**Channels**\n` +
        `\u{251C} Welcome messages sent in <#${interaction.channel?.id}>\n` +
        `\u{2514} Leave messages sent in <#${interaction.channel?.id}>\n`
      ),
    )
    .addActionRowComponents((actionRow) => actionRow
      .setComponents(
        new Discord.ChannelSelectMenuBuilder()
          .setCustomId('welcomeChannelSelect')
          .setPlaceholder('Change welcome channel...'),
        ),
    )
    .addActionRowComponents((actionRow) => actionRow
      .setComponents(
        new Discord.ChannelSelectMenuBuilder()
          .setCustomId('leaveChannelSelect')
          .setPlaceholder('Change leave channel...'),
        ),
    )

  let reply = await interaction.editReply({
    components: [exampleContainer, navButtonRow],
    flags: Discord.MessageFlags.IsComponentsV2,
  });

  try {
    const collectorFilter = (selection: Discord.MessageComponentInteraction) => selection.user.id === interaction.user.id;
    const selectionChannelCollector = reply.createMessageComponentCollector({ filter: collectorFilter, time: 30_000 });
    
    selectionChannelCollector.on('collect', async (selection: Discord.ChannelSelectMenuInteraction) => {
      switch (selection.customId) {
        case 'welcomeChannelSelect':
          let welcome_channel = selection.channels.get(selection.values[0]);
          validateGuildTextChannel(welcome_channel);

          if (welcome_channel.permissionsFor(interaction.client.user)?.has(Discord.PermissionFlagsBits.SendMessages)) {
            guildSettings.welcome_channel_id = welcome_channel.id;
            await guildSettings.save();

            const welcome_channel_success_embed = new Discord.EmbedBuilder()
              .setColor(colors.color_success)
              .setTitle(`${emojis.success_emoji} - Changes saved!`)
              .setDescription(`Set new welcome message channel to ${interaction.options.getChannel("channel")}!`);

            interaction.editReply({ embeds: [welcome_channel_success_embed] });
          } else {
            /*
            const welcome_channel_failure_embed = new Discord.EmbedBuilder()
              .setColor(colors.color_warning)
              .setTitle(`${emojis.attention_emoji} - Lacking permissions!`)
              .setDescription(`Orb does not have permission to send messages to this channel!\n\nWould you like Orb to **change channel permissions** to allow it to send messages in ${interaction.options.getChannel("channel")}?`);

            const confirm_permission_change = new Discord.ButtonBuilder()
              .setCustomId('confirm_perm_change')
              .setLabel('Yes')
              .setStyle(Discord.ButtonStyle.Success)
              .setEmoji('1111384687378710699');
            const cancel_permission_change = new Discord.ButtonBuilder()
              .setCustomId('cancel_perm_change')
              .setLabel('No')
              .setStyle(Discord.ButtonStyle.Danger)
              .setEmoji('1111323889105121350');

            const permission_change_action_row = new Discord.ActionRowBuilder<Discord.ButtonBuilder>().addComponents(confirm_permission_change, cancel_permission_change);

            const lacking_permissions_response = await interaction.reply({ embeds: [welcome_channel_failure_embed], components: [permission_change_action_row] });
            const collector_filter = (selection: Discord.MessageComponentInteraction) => selection.user.id === interaction.user.id;

            try {
              const permission_change_interaction = await lacking_permissions_response.awaitMessageComponent({ filter: collector_filter, time: (1000 * 60 * 1) });

              switch (permission_change_interaction.customId) {
                case 'confirm_perm_change':

                  try {
                    welcome_channel.permissionOverwrites.create(client.user, { SendMessages: true });

                    await ServerSettings.update(
                      { welcome_channel_id: welcome_channel.id },
                      { where: { server_id: interaction.guild.id } }
                    );

                    const welcome_channel_perm_change_success_embed = new Discord.EmbedBuilder()
                      .setColor(colors.color_success)
                      .setTitle(`${emojis.success_emoji} - Changes saved!`)
                      .setDescription(`Set new welcome message channel to ${interaction.options.getChannel("channel")} and gave Orb permission to send messages to this channel!`);

                    permission_change_interaction.deferUpdate();
                    interaction.editReply({ embeds: [welcome_channel_perm_change_success_embed], components: [] })
                  } catch (error) {
                    throw error;
                  }

                  break;
                case 'cancel_perm_change':
                  const welcome_channel_cancel_perm_change_embed = new Discord.EmbedBuilder()
                    .setColor(colors.color_error)
                    .setTitle(`${emojis.failure_emoji} - Lacking permissions!`)
                    .setDescription(`Orb did not change channel permissions and aborted. Try again with a different channel.`);

                  interaction.editReply({ embeds: [welcome_channel_cancel_perm_change_embed] })
                  break;
              }
            } catch (error) {
              throw error;
            }
            */
          }
          break;
      }
    });

  } catch {
    // TODO: Add timeout message as MessageComponentV2 too
  }

  validateMessageInGuild(reply);
  navigateSettings(interaction, reply);
  return;
}