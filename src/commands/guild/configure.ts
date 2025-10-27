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
    // pathArray = [];
    showSettingsMenu(interaction);
  }
}

// let pathArray: any[] = [];
// let changedSettingsArray: string[] = ['bingus', 'bongus', 'bingulus'];
let guildSettings: ServerSettings;

const backButton = new Discord.ButtonBuilder()
  .setCustomId('backButton')
  .setLabel('Go Back')
  .setStyle(Discord.ButtonStyle.Primary)
const abortButton = new Discord.ButtonBuilder()
  .setCustomId('abortButton')
  .setLabel('Abort')
  .setStyle(Discord.ButtonStyle.Danger)
const againButton = new Discord.ButtonBuilder()
  .setCustomId('againButton')
  .setLabel('Change another setting')
  .setStyle(Discord.ButtonStyle.Success)
const navButtonRow = new Discord.ActionRowBuilder<Discord.ButtonBuilder>().addComponents(backButton, abortButton);
const againButtonRow = new Discord.ActionRowBuilder<Discord.ButtonBuilder>().addComponents(againButton);

async function navigateSettings(interaction: Discord.ChatInputCommandInteraction, message: Discord.Message<true>) {
  try {
    const collectorFilter = (selection: Discord.MessageComponentInteraction) => selection.user.id === interaction.user.id;
    const navCollector = message.createMessageComponentCollector({ filter: collectorFilter, time: 30_000 });
    
    navCollector.on('collect', async (selection: Discord.ButtonInteraction) => {
      // await selection.deferUpdate();
      switch (selection.customId) {
        case 'backButton':
        showSettingsMenu(interaction);
          break;
        case 'abortButton':
          const abortContainer = new Discord.ContainerBuilder()
            .setAccentColor(colors.color_error)
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
        case 'againButton':
          showSettingsMenu(interaction);
          break;
        // TODO: A save and exit button could be a great idea too
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

  const generalSettingsContainer = new Discord.ContainerBuilder()
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
    components: [generalSettingsContainer, navButtonRow],
    flags: Discord.MessageFlags.IsComponentsV2,
  });
  validateMessageInGuild(reply);
  navigateSettings(interaction, reply);
  return;
}

async function showWelcomingSettingsPage(interaction: Discord.ChatInputCommandInteraction) {
  // pathArray.push(showConfigMessage);

  const welcomeSettingsContainer = new Discord.ContainerBuilder()
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
  // await attachChangedSettingsSection(welcomeSettingsContainer);

  let reply = await interaction.editReply({
    components: [welcomeSettingsContainer, navButtonRow],
    flags: Discord.MessageFlags.IsComponentsV2,
  });

  try {
    const collectorFilter = (selection: Discord.MessageComponentInteraction) => selection.user.id === interaction.user.id;
    const selectionChannelCollector = reply.createMessageComponentCollector({ filter: collectorFilter, time: 30_000 });

    selectionChannelCollector.on('collect', async (selection: Discord.ChannelSelectMenuInteraction) => {
      // await selection.deferUpdate();
      switch (selection.customId) {
        case 'welcomeChannelSelect':
          let welcome_channel = selection.channels.get(selection.values[0]);
          validateGuildChannel(welcome_channel);

          if (welcome_channel.permissionsFor(interaction.client.user)?.has(Discord.PermissionFlagsBits.SendMessages)) {
            guildSettings.welcome_channel_id = welcome_channel.id;
            await guildSettings.save();

            const saveContainer = new Discord.ContainerBuilder()
              .setAccentColor(colors.color_success)
              .addTextDisplayComponents((textDisplay) => textDisplay
                .setContent(
                  `### ${emojis.success_emoji} - Changes saved!\n` +
                  `Orb will welcome new members in <#${welcome_channel.id}>.`
                )
              );
            await interaction.editReply({
              components: [saveContainer, againButtonRow],
              flags: Discord.MessageFlags.IsComponentsV2,
            });
          } else {
            const wChannelPermissionFailureContainer = new Discord.ContainerBuilder()
            .setAccentColor(colors.color_warning)
            .addTextDisplayComponents((textDisplay) => textDisplay
              .setContent(
                `### ${emojis.attention_emoji} - Lacking permissions!\n` +
                `Orb does not have permission to send messages in <#${welcome_channel.id}>!\n` + 
                `Would you like Orb to **change channel permissions** to be able to send messages in there?`
              )
            );
            const confirm_permission_change = new Discord.ButtonBuilder()
              .setCustomId('confirm_perm_change')
              .setLabel('Yes')
              .setStyle(Discord.ButtonStyle.Success)
              .setEmoji('1222305979518156830');
            const cancel_permission_change = new Discord.ButtonBuilder()
              .setCustomId('cancel_perm_change')
              .setLabel('Nevermind, abort')
              .setStyle(Discord.ButtonStyle.Danger)
              .setEmoji('1222305977546706955');
            const permission_change_action_row = new Discord.ActionRowBuilder<Discord.ButtonBuilder>().addComponents(confirm_permission_change, cancel_permission_change);

            let reply = await interaction.editReply({
              components: [wChannelPermissionFailureContainer, permission_change_action_row],
              flags: Discord.MessageFlags.IsComponentsV2,
            });

            const collectorFilter = (selection: Discord.MessageComponentInteraction) => selection.user.id === interaction.user.id;
            const selectionChannelCollector = reply.createMessageComponentCollector({ filter: collectorFilter, time: 30_000 });

            selectionChannelCollector.on('collect', async (permission_change_interaction: Discord.ChannelSelectMenuInteraction) => {
              switch (permission_change_interaction.customId) {
                case 'confirm_perm_change':
                  try {
                    welcome_channel.permissionOverwrites.create(interaction.client.user, { SendMessages: true });
                    guildSettings.welcome_channel_id = welcome_channel.id;
                    await guildSettings.save();

                    const saveContainer = new Discord.ContainerBuilder()
                      .setAccentColor(colors.color_success)
                      .addTextDisplayComponents((textDisplay) => textDisplay
                        .setContent(
                          `### ${emojis.success_emoji} - Changes saved!\n` +
                          `Orb will welcome new members in <#${welcome_channel.id}>.`
                        )
                      );
                    await interaction.editReply({
                      components: [saveContainer, againButtonRow],
                      flags: Discord.MessageFlags.IsComponentsV2,
                    });
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
            });
          }
        break;
      }
    });

  } catch {
    // TODO: Add timeout message as MessageComponentV2
  }

  validateMessageInGuild(reply);
  navigateSettings(interaction, reply);
  return;
}

/*
async function attachChangedSettingsSection(container: Discord.ContainerBuilder) {
  if (changedSettingsArray.length > 0) {
    container.addSeparatorComponents((separator) => separator)
    const content = `**Changed settings**\n` + changedSettingsArray.map((setting) => setting).join('\n');
    container.addTextDisplayComponents((text) => text.setContent(content));
  }
  return;
}
*/