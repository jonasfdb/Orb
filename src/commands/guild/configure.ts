import Discord from "discord.js";
import { validateCommandInteractionInGuild, validateGuildChannel, validateGuildTextChannel, validateMessageInGuild } from "../../util/validate";
import { emojis } from "../../../util/json/emojis";
import { findGuildSettings } from "../../util/database/dbutils";
import { GuildSettings } from "../../util/database/models/GuildSettings";
import { colors } from "../../../util/json/colors";

export default {
  data: new Discord.SlashCommandBuilder()
    .setName('configure')
    .setDescription('description'),

  async execute(client: Discord.Client<true>, interaction: Discord.ChatInputCommandInteraction) {
    validateCommandInteractionInGuild(interaction);
    await interaction.deferReply();

    dbGuildSettings = await findGuildSettings(interaction.guild.id);
    // pathArray = [];
    showSettingsMenu(interaction);
  }
}

// let pathArray: any[] = [];
// let changedSettingsArray: string[] = ['bingus', 'bongus', 'bingulus'];
// TODO: expand this into a full navigation mechanism
let dbGuildSettings: GuildSettings;

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
  .setLabel('Change more settings')
  .setStyle(Discord.ButtonStyle.Success)
const navButtonRow = new Discord.ActionRowBuilder<Discord.ButtonBuilder>().addComponents(backButton, abortButton);
const againButtonRow = new Discord.ActionRowBuilder<Discord.ButtonBuilder>().addComponents(againButton);

async function navigateSettings(interaction: Discord.ChatInputCommandInteraction, message: Discord.Message<true>) {
  try {
    const collectorFilter = (selection: Discord.MessageComponentInteraction) => selection.user.id === interaction.user.id;
    const navCollector = message.createMessageComponentCollector({ filter: collectorFilter, time: 60_000 });

    navCollector.on('collect', async (selection: Discord.ButtonInteraction) => {
      // await selection.deferUpdate();
      switch (selection.customId) {
        case 'backButton':
        showSettingsMenu(interaction);
          break;
        case 'abortButton':
          const abortContainer = new Discord.ContainerBuilder()
            .setAccentColor(colors.error)
            .addTextDisplayComponents((textDisplay) => textDisplay
              .setContent(
                `### ${emojis.cross} - Aborted\n` +
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
        // TODO: A save and exit button could be a great idea too?
      }
    });

    navCollector.on('end', async (collected) => {
      if (collected.size < 1) {
        let interactionFinalReply = await interaction.fetchReply()
        console.log(interactionFinalReply.components);
        selectionTimeout(interaction);
      }
    })
  } catch {

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
    const selectionCollector = reply.createMessageComponentCollector({ filter: collectorFilter, time: 30_000, max: 1 });
    
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

    selectionCollector.on('end', (collected) => {
      if (collected.size < 1) {
        selectionTimeout(interaction);
      }
    })
  } catch {

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
        `\u{251C}${ dbGuildSettings.welcomeMessagesEnabled ? 
          '<:orb_toggle_b_enabled_flat:1222635342457339914>' : 
          '<:orb_disabled:1222634792777023688>'
        } Welcome messages\n` +
        `\u{2514}${ dbGuildSettings.leaveMessagesEnabled ?
          '<:orb_toggle_b_enabled_flat:1222635342457339914>' :
          '<:orb_disabled:1222634792777023688>'
        } Leave messages`
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
    const selectionChannelCollector = reply.createMessageComponentCollector({ filter: collectorFilter, time: 30_000, max: 1 });
    const selectionMessageToggleColletor = reply.createMessageComponentCollector({ filter: collectorFilter, time: 30_000, max: 1 });
    
    selectionMessageToggleColletor.on('collect', async (selection: Discord.StringSelectMenuInteraction) => {
      switch (selection.customId) {
        case 'toggleWelcomingMessages':
          let selectionArray = selection.values[0].split('');
          dbGuildSettings.welcomeMessagesEnabled = parseInt(selectionArray[0], 10) > 0;
          dbGuildSettings.leaveMessagesEnabled = parseInt(selectionArray[1], 10) > 0;
          await dbGuildSettings.save();

          let boolWelcomeMessagesEnabled = parseInt(selectionArray[0]) > 0 ? 'enabled' : 'disabled';
          let boolLeaveMessagesEnabled = parseInt(selectionArray[1]) > 0 ? 'enabled' : 'disabled';

          const saveContainer = new Discord.ContainerBuilder()
            .setAccentColor(colors.success)
            .addTextDisplayComponents((textDisplay) => textDisplay
              .setContent(
                `### ${emojis.checkmark} - Changes saved!\n` +
                `Welcome messages are now **${boolWelcomeMessagesEnabled}**, leave messages are now **${boolLeaveMessagesEnabled}**.`
              )
            );
          await interaction.editReply({
            components: [saveContainer, againButtonRow],
            flags: Discord.MessageFlags.IsComponentsV2,
          });
          break;
      }
    });

    selectionMessageToggleColletor.on('end', (collected) => {
      if (collected.size < 1) {
        selectionTimeout(interaction);
      }
    })

    selectionChannelCollector.on('collect', async (selection: Discord.ChannelSelectMenuInteraction) => {
      // await selection.deferUpdate();
      switch (selection.customId) {
        case 'welcomeChannelSelect':
          let wChannel = selection.channels.get(selection.values[0]);
          validateGuildChannel(wChannel);

          if (wChannel.permissionsFor(interaction.client.user)?.has(Discord.PermissionFlagsBits.SendMessages)) {
            dbGuildSettings.channelsWelcomeID = wChannel.id;
            await dbGuildSettings.save();

            const saveContainer = new Discord.ContainerBuilder()
              .setAccentColor(colors.success)
              .addTextDisplayComponents((textDisplay) => textDisplay
                .setContent(
                  `### ${emojis.checkmark} - Changes saved!\n` +
                  `Orb will welcome new members in <#${wChannel.id}>.`
                )
              );
            await interaction.editReply({
              components: [saveContainer, againButtonRow],
              flags: Discord.MessageFlags.IsComponentsV2,
            });
          } else {
            const wChannelPermissionFailureContainer = new Discord.ContainerBuilder()
            .setAccentColor(colors.warning)
            .addTextDisplayComponents((textDisplay) => textDisplay
              .setContent(
                `### ${emojis.attention} - Lacking permissions!\n` +
                `Orb does not have permission to send messages in <#${wChannel.id}>!\n` + 
                `Would you like Orb to **change channel permissions** to be able to send messages in there?`
              )
            );
            const pChangeConfirmButton = new Discord.ButtonBuilder()
              .setCustomId('pChangeConfirm')
              .setLabel('Yes')
              .setStyle(Discord.ButtonStyle.Success)
              .setEmoji('1222305979518156830');
            const pChangeAbortButton = new Discord.ButtonBuilder()
              .setCustomId('pChangeAbort')
              .setLabel('Nevermind, abort')
              .setStyle(Discord.ButtonStyle.Danger)
              .setEmoji('1222305977546706955');
            const pChangeActionRow = new Discord.ActionRowBuilder<Discord.ButtonBuilder>().addComponents(pChangeConfirmButton, pChangeAbortButton);

            let reply = await interaction.editReply({
              components: [wChannelPermissionFailureContainer, pChangeActionRow],
              flags: Discord.MessageFlags.IsComponentsV2,
            });

            const collectorFilter = (selection: Discord.MessageComponentInteraction) => selection.user.id === interaction.user.id;
            const selectionChannelCollector = reply.createMessageComponentCollector({ filter: collectorFilter, time: 30_000 });

            selectionChannelCollector.on('collect', async (pChangeSelection: Discord.ChannelSelectMenuInteraction) => {
              switch (pChangeSelection.customId) {
                case 'pChangeConfirm':
                  try {
                    wChannel.permissionOverwrites.create(interaction.client.user, { SendMessages: true });
                    dbGuildSettings.channelsWelcomeID = wChannel.id;
                    await dbGuildSettings.save();

                    const saveContainer = new Discord.ContainerBuilder()
                      .setAccentColor(colors.success)
                      .addTextDisplayComponents((textDisplay) => textDisplay
                        .setContent(
                          `### ${emojis.checkmark} - Changes saved!\n` +
                          `Orb will welcome new members in <#${wChannel.id}>.`
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
                case 'pChangeAbort':
                  const abortContainer = new Discord.ContainerBuilder()
                    .setAccentColor(colors.error)
                    .addTextDisplayComponents((textDisplay) => textDisplay
                      .setContent(
                        `### ${emojis.cross} - Lacking permissions!\n` +
                        `Orb aborted, and nothing changed. Maybe try a different channel?`
                      )
                    );
                  await interaction.editReply({
                    components: [abortContainer, againButtonRow],
                    flags: Discord.MessageFlags.IsComponentsV2,
                  });
                  break;
                }
            });
            }
          break;
        case 'leaveChannelSelect':
          let lChannel = selection.channels.get(selection.values[0]);
          validateGuildChannel(lChannel);

          if (lChannel.permissionsFor(interaction.client.user)?.has(Discord.PermissionFlagsBits.SendMessages)) {
            dbGuildSettings.channelsLeaveID = lChannel.id;
            await dbGuildSettings.save();

            const saveContainer = new Discord.ContainerBuilder()
              .setAccentColor(colors.success)
              .addTextDisplayComponents((textDisplay) => textDisplay
                .setContent(
                  `### ${emojis.checkmark} - Changes saved!\n` +
                  `Orb will wish leaving members farewell in <#${lChannel.id}>.`
                )
              );
            await interaction.editReply({
              components: [saveContainer, againButtonRow],
              flags: Discord.MessageFlags.IsComponentsV2,
            });
          } else {
            const wChannelPermissionFailureContainer = new Discord.ContainerBuilder()
            .setAccentColor(colors.warning)
            .addTextDisplayComponents((textDisplay) => textDisplay
              .setContent(
                `### ${emojis.attention} - Lacking permissions!\n` +
                `Orb does not have permission to send messages in <#${lChannel.id}>!\n` + 
                `Would you like Orb to **change channel permissions** to be able to send messages in there?`
              )
            );
            const pChangeConfirmButton = new Discord.ButtonBuilder()
              .setCustomId('pChangeConfirm')
              .setLabel('Yes')
              .setStyle(Discord.ButtonStyle.Success)
              .setEmoji('1222305979518156830');
            const pChangeAbortButton = new Discord.ButtonBuilder()
              .setCustomId('pChangeAbort')
              .setLabel('Nevermind, abort')
              .setStyle(Discord.ButtonStyle.Danger)
              .setEmoji('1222305977546706955');
            const pChangeActionRow = new Discord.ActionRowBuilder<Discord.ButtonBuilder>().addComponents(pChangeConfirmButton, pChangeAbortButton);

            let reply = await interaction.editReply({
              components: [wChannelPermissionFailureContainer, pChangeActionRow],
              flags: Discord.MessageFlags.IsComponentsV2,
            });

            const collectorFilter = (selection: Discord.MessageComponentInteraction) => selection.user.id === interaction.user.id;
            const selectionChannelCollector = reply.createMessageComponentCollector({ filter: collectorFilter, time: 30_000 });

            selectionChannelCollector.on('collect', async (pChangeSelection: Discord.ChannelSelectMenuInteraction) => {
              switch (pChangeSelection.customId) {
                case 'pChangeConfirm':
                  try {
                    lChannel.permissionOverwrites.create(interaction.client.user, { SendMessages: true });
                    dbGuildSettings.channelsLeaveID = lChannel.id;
                    await dbGuildSettings.save();

                    const saveContainer = new Discord.ContainerBuilder()
                      .setAccentColor(colors.success)
                      .addTextDisplayComponents((textDisplay) => textDisplay
                        .setContent(
                          `### ${emojis.checkmark} - Changes saved!\n` +
                          `Orb will wish leaving members farewell in <#${lChannel.id}>.`
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
                case 'pChangeAbort':
                  const abortContainer = new Discord.ContainerBuilder()
                    .setAccentColor(colors.error)
                    .addTextDisplayComponents((textDisplay) => textDisplay
                      .setContent(
                        `### ${emojis.cross} - Lacking permissions!\n` +
                        `Orb aborted, and nothing changed. Maybe try a different channel?`
                      )
                    );
                  await interaction.editReply({
                    components: [abortContainer, againButtonRow],
                    flags: Discord.MessageFlags.IsComponentsV2,
                  });
                  break;
                }
            });
          }
          break;
      }
    });

    selectionChannelCollector.on('end', (collected) => {
      if (collected.size < 1) {
        selectionTimeout(interaction);
      }
    })
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

async function selectionTimeout (interaction: Discord.ChatInputCommandInteraction) {
  const timeoutContainer = new Discord.ContainerBuilder()
    .setAccentColor(colors.warning)
    .addTextDisplayComponents((textDisplay) => textDisplay
      .setContent(
        `### ${emojis.attention} - Timed out!\n` +
        `You took too long to make a selection, so this interaction was cancelled. Run the command again to restart.`
      )
    );
  await interaction.editReply({
    components: [timeoutContainer],
    flags: Discord.MessageFlags.IsComponentsV2,
  });
}