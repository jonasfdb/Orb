// Orb - Command for editing various internal settings for a server using Orb
// Copyright (C) 2025 Jonas Frank de Buhr (jonasfdb)
// Licensed under the AGPL-3.0 license as laid out in LICENSE

import Discord, { PermissionFlagsBits } from "discord.js";
import { find_server, findGuildSettings } from "../../util/database/dbutils";
import { colors } from "../../../util/json/colors"
import { emojis } from "../../../util/json/emojis"
import { generate_token } from "../../util/generators"
import { GuildSettings } from "../../util/database/models/GuildSettings";
import { validateCommandInteractionInGuild, validateGuildChannel, validateNullNumber, validateNumber, validateRole, validateString } from "../../util/validate";
import { getGuildIcon } from "../../util/helpers";
import { RoleReward } from "../../types/interfaces";
import { out_of_order } from "../../util/outOfOrder";

export default {
  data: new Discord.SlashCommandBuilder()
    .setName("settings")
    .setDescription("Command group for all server settings.")
    .addSubcommand((subcommand) => subcommand
      .setName("help")
      .setDescription("List of all server commands.")
    )
    .addSubcommand((subcommand) => subcommand
      .setName("current")
      .setDescription("List all current settings.")
    )
    .addSubcommandGroup((subcommandGroup) => subcommandGroup
      .setName('captcha')
      .setDescription('Command group for server security, such as captchas.')
      .addSubcommand((subcommand) => subcommand
        .setName("enable")
        .setDescription("Enable server protection through a captcha.")
      )
      .addSubcommand((subcommand) => subcommand
        .setName("disable")
        .setDescription("Turn captcha protection off.")
      )
    )
    .addSubcommandGroup((subcommandGroup) => subcommandGroup
      .setName('rewards')
      .setDescription('Command group for editing rewards.')
      .addSubcommand((subcommand) => subcommand
        .setName("create")
        .setDescription("Create a new leveling reward.")
        .addNumberOption((option) => option
          .setName("give-at-level")
          .setDescription("Level at which this role reward is given to an user.")
          .setMinValue(1)
          .setRequired(true)
        )
        .addNumberOption((option) => option
          .setName("remove-at-level")
          .setDescription("Level at which this role reward is removed. Enter 0 for a permanent reward.")
          .setRequired(true)
        )
        .addRoleOption((option) => option
          .setName("role")
          .setDescription("Role to be awarded to an user when the level is reached.")
          .setRequired(true)
        )
      )
      .addSubcommand((subcommand) => subcommand
        .setName("delete")
        .setDescription("Delete a role reward. This will not delete the role.")
        .addRoleOption((option) => option
          .setName("role")
          .setDescription("The role of which the level reward is to be deleted.")
        )
        .addStringOption((option) => option
          .setName("token")
          .setDescription("The three-letter token of the level reward to delete.")
          .setMinLength(3)
          .setMaxLength(3)
        )
      )
    )
    .addSubcommandGroup((subcommandGroup) => subcommandGroup
      .setName('channels')
      .setDescription('Command group for editing channels.')
      .addSubcommand((subcommand) => subcommand
        .setName("welcome-channel")
        .setDescription("Change the channel for welcome messages.")
        .addChannelOption((option) => option
          .setName("channel")
          .setDescription("The new welcome message channel.")
          .setRequired(true)
        )
      )
      .addSubcommand((subcommand) => subcommand
        .setName("leave-channel")
        .setDescription("Change the channel for leave messages.")
        .addChannelOption((option) => option
          .setName("channel")
          .setDescription("The new leave message channel.")
          .setRequired(true)
        )
      )
    )
    .addSubcommandGroup((subcommandGroup) => subcommandGroup
      .setName('broadcasts')
      .setDescription('Command group for editing broadcast settings.')
      .addSubcommand((subcommand) => subcommand
        .setName("broadcast-channel")
        .setDescription("Change the channel for welcome messages.")
        .addChannelOption((option) => option
          .setName("channel")
          .setDescription("The new welcome message channel.")
          .setRequired(true)
        )
      )
      .addSubcommand((subcommand) => subcommand
        .setName("toggle-broadcasts")
        .setDescription("Turn broadcasts on or off.")
        .addStringOption((option) => option
          .setName("toggle")
          .setDescription("Choose what to do.")
          .setRequired(true)
          .addChoices(
            { name: 'Enable broadcasts', value: 'enable' },
            { name: 'Disable broadcasts', value: 'disable' },
          )
        )
      )
    )
    .addSubcommandGroup((subcommandGroup) => subcommandGroup
      .setName('messages')
      .setDescription('Command group for editing messages.')
      .addSubcommand((subcommand) => subcommand
        .setName("welcome-message")
        .setDescription("Change the welcome message.")
        .addStringOption((option) => option
          .setName("message")
          .setDescription("Placeholders: SERVER = server name, USER = username")
          .setRequired(true)
          .setMaxLength(100)
        )
      )
      .addSubcommand((subcommand) => subcommand
        .setName("leave-message")
        .setDescription("Change the leave message.")
        .addStringOption((option) => option
          .setName("message")
          .setDescription("Placeholders: SERVER = server name, USER = username")
          .setRequired(true)
          .setMaxLength(100)
        )
      )
      .addSubcommand((subcommand) => subcommand
        .setName("reset-to-default")
        .setDescription("Reset welcome or leave messages to default messages.")
        .addStringOption((option) => option
          .setName("message-type")
          .setDescription("The message to reset back to default.")
          .setRequired(true)
          .addChoices(
            { name: 'Reset welcome message', value: 'welcome-message' },
            { name: 'Reset leave message', value: 'leave-message' },
            { name: 'Reset both', value: 'both' }
          )
        )
      )
    )
    .addSubcommandGroup((subcommandGroup) => subcommandGroup
      .setName('toggles')
      .setDescription('Command group for toggleable settings.')
      .addSubcommand((subcommand) => subcommand
        .setName("join-leave-messages")
        .setDescription("Toggle join and leave messages.")
        .addStringOption((option) => option
          .setName("option")
          .setDescription("The option to save.")
          .setRequired(true)
          .addChoices(
            { name: 'Enable all messages', value: 'all' },
            { name: 'Enable only join messages', value: 'join' },
            { name: 'Enable only leave messages', value: 'leave' },
            { name: 'Disable all messages', value: 'none' }
          )
        )
      )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(client: Discord.Client<true>, interaction: Discord.ChatInputCommandInteraction) {
    validateCommandInteractionInGuild(interaction);
    await findGuildSettings(interaction.guild.id);

    switch (interaction.options.getSubcommandGroup() || interaction.options.getSubcommand()) {
      case `current`:
        const server_settings = await findGuildSettings(interaction.guild.id);

        let welcome_message_enabled = server_settings.welcomeMessagesEnabled ? 'enabled' : 'disabled';
        let leave_message_enabled = server_settings.leaveMessagesEnabled ? 'enabled' : 'disabled';
        let welcome_message_channel = '';
        let leave_message_channel = '';
        let welcome_message_text = server_settings.messagesWelcome;
        let leave_message_text = server_settings.messagesLeave;

        if (!server_settings.channelsWelcomeID) {
          welcome_message_channel = '_No channel assigned_'
        } else {
          welcome_message_channel = `<#${server_settings.channelsWelcomeID}>`
        }

        if (!server_settings.channelsLeaveID) {
          leave_message_channel = '_No channel assigned_'
        } else {
          leave_message_channel = `<#${server_settings.channelsLeaveID}>`
        }

        const settings_toggles_string_array = [
          `\u{251C} Welcome message: **${welcome_message_enabled}**\n`,
          `\u{2514} Leave message: **${leave_message_enabled}**\n`,
        ]

        const settings_channels_string_array = [
          `\u{251C} Welcome channel: ${welcome_message_channel}\n`,
          `\u{2514} Leave channel: ${leave_message_channel}\n`,
        ]

        const settings_messages_string_array = [
          `\u{251C} Welcome text: **${welcome_message_text}**\n`,
          `\u{2514} Leave text: **${leave_message_text}**\n`,
        ]

        const current_settings_list_embed = new Discord.EmbedBuilder()
          .setAuthor({ name: `Settings on ${interaction.guild.name}`, iconURL: getGuildIcon(interaction) })
          .setTitle('\u{D83D}\u{DCC4} - Settings')
          .addFields(
            { name: 'Toggleables:', value: settings_toggles_string_array.join('') },
            { name: 'Channels:', value: settings_channels_string_array.join('') },
            { name: 'Messages:', value: settings_messages_string_array.join('') },
          )
        // .setDescription(current_settings_string_array.join(''))

        interaction.reply({ embeds: [current_settings_list_embed] });
        break;
      case `captcha`:
        switch (interaction.options.getSubcommand()) {
          case `current`:
            interaction.reply("Work in progress!");
            break;
          case `enable`:
            await interaction.deferReply();

            let index = 0;
            const raw_channel_array = Array.from(interaction.guild.channels.cache)
            const channel_array = [];

            while (index < raw_channel_array.length) {
              // each channel in the raw array is an array where channel[0] is the id and channel[1] are the channel properties
              let channel_to_add = await interaction.guild.channels.fetch(raw_channel_array[index][1].id);
              if (!channel_to_add) {
                throw new Error('Channel to add is not a channel to add.')
              } else {
                channel_array.push(channel_to_add);
              }
              index++;
            }

            const captcha_information_embed = new Discord.EmbedBuilder()
              .setColor(colors.color_default)
              .setTitle(`\u{1F6E1} - Captcha Protection Setup`)
              .addFields(
                { name: `Orb will:`, value: ` \u{2514} Edit **${index} channels**\n \u{2514} Create a new "Not Verified" role` },
                { name: 'How does it work?', value: 'Orb will assign every new member a "Not Verified" role that has no access to any channel, and will remove it once the member has verified.' },
                { name: 'What about current members?', value: 'Verification only applies to newcomers.' }
              )
              .setFooter({ text: 'This embed will time out in five minutes.' })
            const captcha_start_button = new Discord.ButtonBuilder()
              .setCustomId('start_captcha_setup')
              .setLabel('Start')
              .setStyle(Discord.ButtonStyle.Success)
              .setEmoji(emojis.success_emoji);
            const captcha_cancel_button = new Discord.ButtonBuilder()
              .setCustomId('cancel_captcha_setup')
              .setLabel('Cancel')
              .setStyle(Discord.ButtonStyle.Danger)
              .setEmoji(emojis.failure_emoji);
            const captcha_begin_action_row = new Discord.ActionRowBuilder<Discord.ButtonBuilder>().addComponents(captcha_start_button, captcha_cancel_button);

            const captcha_begin_embed_prompt = await interaction.editReply({ embeds: [captcha_information_embed], components: [captcha_begin_action_row] });
            const captcha_setup_collector_filter = (selection: Discord.MessageComponentInteraction) => selection.user.id === interaction.user.id;

            try {
              const captcha_begin_embed_response = await captcha_begin_embed_prompt.awaitMessageComponent({ filter: captcha_setup_collector_filter, time: (1000 * 60) });
              await captcha_begin_embed_response.deferUpdate();

              switch (captcha_begin_embed_response.customId) {
                case 'start_captcha_setup':
                  const captcha_working_embed = new Discord.EmbedBuilder()
                    .setColor(colors.color_default)
                    .setTitle(`\u{1F6E1} - Captcha Protection Setup`)
                    .setDescription(`${emojis.loading_animation_emoji} Setting up permissions...\n\nThis may take a while if you have lots of channels. Sit back and relax!`)

                  await interaction.editReply({ embeds: [captcha_working_embed], components: [] });

                  const not_verified_role = await interaction.guild.roles.create({ name: 'Not Verified', permissions: [] });

                  await GuildSettings.update({
                    captchaRequired: true,
                    unverifiedRoleID: not_verified_role.id,
                  }, { where: { dGuildID: interaction.guild.id } }
                  );

                  let failure_count = 0;
                  channel_array.forEach(channel => {
                    try {
                      validateGuildChannel(channel);
                      console.log(channel);
                      channel.permissionOverwrites.create(not_verified_role, { ViewChannel: false });
                    } catch (error) {
                      throw error;
                      /*
                      console.trace(error);
                      failure_count++;
                      */
                    }
                  });

                  const captcha_finished_embed = new Discord.EmbedBuilder()
                    .setColor(colors.color_success)
                    .setTitle(`\u{1F6E1} - Captcha Protection Setup`)
                    .setDescription(`${emojis.success_emoji} Captcha set up!\n\nFailed to override ${failure_count} channels.`)

                  await interaction.editReply({ embeds: [captcha_finished_embed] });
                  break;
                case `cancel_captcha_setup`:
                  const captcha_setup_canceled_embed = new Discord.EmbedBuilder()
                    .setColor(colors.color_error)
                    .setTitle(`\u{1F6E1} - Captcha Protection Setup`)
                    .setDescription(`${emojis.failure_emoji} Captcha setup canceled by user.`)

                  await interaction.editReply({ embeds: [captcha_setup_canceled_embed], components: [] });
                  break;
              }
            } catch (error) {
              throw error;
            }

            break;

          case `disable`:
            await GuildSettings.update({
              captchaRequired: false,
            }, { where: { dGuildID: interaction.guild.id } }
            );


            const captcha_disable_embed = new Discord.EmbedBuilder()
              .setColor(colors.color_success)
              .setTitle(`${emojis.success_emoji} - Changes saved!`)
              .addFields(
                { name: `\u{1F6E0} Changes:`, value: `\u{200B}\u{2514} Captcha protection is now **disabled** ` }
              )

            interaction.reply({ embeds: [captcha_disable_embed] })
            break;
        }
        break;

      case 'rewards':
        await interaction.deferReply();

        switch (interaction.options.getSubcommand()) {
          case 'create': {
            let max_level = interaction.options.getNumber('remove-at-level');
            const min_level = interaction.options.getNumber('give-at-level');
            const reward_role = interaction.options.getRole('role');

            validateNullNumber(max_level);
            validateNumber(min_level);
            validateRole(reward_role);
            let max_level_string = max_level.toString();

            // make zero be infinite
            if (max_level === 0) {
              max_level = 2147483647;
              max_level_string = 'Infinity';
            }

            // validate levels
            if (max_level <= min_level || max_level < 0 || min_level < 1) {
              const role_reward_invalid_levels_embed = new Discord.EmbedBuilder()
                .setColor(colors.color_error)
                .setTitle(`${emojis.failure_emoji} - Invalid level configuration!`)
                .setDescription(`Levels must be positive and the removal level must be greater than the give level, or zero to never remove the role.`);
              await interaction.reply({ embeds: [role_reward_invalid_levels_embed] });
              return;
            }

            const server = await find_server(interaction.guild.id);
            let rewardsArray;
            try {
              rewardsArray = server.role_rewards_level_string ? JSON.parse(server.role_rewards_level_string) : [];
            } catch {
              rewardsArray = [];
            }

            if (rewardsArray.some((r: RoleReward) => r.role_id === reward_role.id)) {
              const role_reward_duplicate_embed = new Discord.EmbedBuilder()
                .setColor(colors.color_error)
                .setTitle(`${emojis.failure_emoji} - Role reward already exists!`)
                .setDescription(`The role <@&${reward_role.id}> already has a reward.`);
              await interaction.editReply({ embeds: [role_reward_duplicate_embed] });
              return;
            }

            let reward_token = generate_token(3);
            while (rewardsArray.some((r: RoleReward) => r.token === reward_token)) {
              reward_token = generate_token(3);
            }

            rewardsArray.push({
              min_level,
              max_level,
              token: reward_token,
              role_id: reward_role.id
            });
            rewardsArray.sort((a: RoleReward, b: RoleReward) => a.min_level - b.min_level);

            server.set({ role_rewards_level_string: JSON.stringify(rewardsArray) });
            await server.save();

            const new_role_reward_success_embed = new Discord.EmbedBuilder()
              .setColor(colors.color_success)
              .setTitle(`${emojis.success_emoji} - New role reward created!`)
              .setDescription(
                `The role <@&${reward_role.id}> will be given at level **${min_level}** ` +
                `and removed at **${max_level_string}**.\nToken: **${reward_token}**`
              );
            await interaction.editReply({ embeds: [new_role_reward_success_embed] });
            break;
          }

          case 'delete': {
            const providedRole = interaction.options.getRole('role');
            const providedToken = interaction.options.getString('token');

            const no_reward_to_delete_embed = new Discord.EmbedBuilder()
              .setColor(colors.color_error)
              .setTitle(`${emojis.failure_emoji} - No reward found!`)
              .setDescription(
                providedRole && !providedToken
                  ? `The role <@&${providedRole.id}> has no reward attached.`
                  : `The token **${providedToken}** is not assigned to any reward.`
              );

            const server = await find_server(interaction.guild.id);
            let rewardsArray;
            try {
              rewardsArray = server.role_rewards_level_string ? JSON.parse(server.role_rewards_level_string) : [];
            } catch {
              rewardsArray = [];
            }

            let indexToRemove = -1;
            if (providedRole && !providedToken) {
              indexToRemove = rewardsArray.findIndex((r: RoleReward) => r.role_id === providedRole.id);
            } else if (providedToken) {
              indexToRemove = rewardsArray.findIndex((r: RoleReward) => r.token === providedToken);
            }

            if (indexToRemove === -1) {
              await interaction.editReply({ embeds: [no_reward_to_delete_embed] });
              return;
            }

            const [removedReward] = rewardsArray.splice(indexToRemove, 1);
            server.set({ role_rewards_level_string: JSON.stringify(rewardsArray) });
            await server.save();

            const reward_deletion_success_embed = new Discord.EmbedBuilder()
              .setColor(colors.color_success)
              .setTitle(`${emojis.success_emoji} - Reward deleted!`)
              .setDescription(`The role <@&${removedReward.role_id}> will no longer be given as a reward.`);
            await interaction.editReply({ embeds: [reward_deletion_success_embed] });
            break;
          }
        }
        break;

      case 'channels':
        out_of_order(interaction, 'This setting has been moved to /configure.');
        break;

      case `messages`:
        switch (interaction.options.getSubcommand()) {
          case `current`:
            let current_server_settings = await findGuildSettings(interaction.guild.id);

            const current_message_settings_embed = new Discord.EmbedBuilder()
              .setColor(colors.color_default)
              .setTitle(`\u{2699} - Current settings:`)
              .addFields(
                {
                  name: 'Welcome message:',
                  value: ` \u{2514} "${current_server_settings.messagesWelcome}"`,
                },
                {
                  name: 'Leave message:',
                  value: ` \u{2514} "${current_server_settings.messagesLeave}"`,
                },
                {
                  name: 'Placeholder words:',
                  value: ` \u{2514} "SERVER" - server name\n \u{2514} "USER" - username`,
                }
              )

            await interaction.reply({ embeds: [current_message_settings_embed] });
            break;

          case `welcome-message`:
            let welcome_message = interaction.options.getString('message');
            validateString(welcome_message);

            await GuildSettings.update(
              { messagesWelcome: welcome_message },
              { where: { dGuildID: interaction.guild.id } }
            );

            const welcome_message_success_embed = new Discord.EmbedBuilder()
              .setColor(colors.color_success)
              .setTitle(`${emojis.success_emoji} - Changes saved!`)
              .setDescription(`The new welcome message is now "${interaction.options.getString("message")}"!`);

            interaction.reply({ embeds: [welcome_message_success_embed] })
            break;

          case `leave-message`:
            let leave_message = interaction.options.getString('message');
            validateString(leave_message);

            await GuildSettings.update(
              { messagesLeave: leave_message },
              { where: { dGuildID: interaction.guild.id } }
            );

            const leave_message_success_embed = new Discord.EmbedBuilder()
              .setColor(colors.color_success)
              .setTitle(`${emojis.success_emoji} - Changes saved!`)
              .setDescription(`The new leave message is now "${interaction.options.getString("message")}"!`);

            interaction.reply({ embeds: [leave_message_success_embed] })
            break;

          case `reset-to-default`:
            interaction.reply("Sorry, this function is unavailable at the moment!");
            break;
        }
        break;

      case `toggles`:
        out_of_order(interaction, 'This command was moved to /configure.');
        break;
    }
  }
}
