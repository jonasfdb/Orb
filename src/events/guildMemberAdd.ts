// Orb - Event handler for guildMemberAdd events
// Copyright (C) 2025 Jonas Frank de Buhr (jonasfdb)
// Licensed under the AGPL-3.0 license as laid out in LICENSE

import Discord, { Events, ButtonStyle, TextInputStyle, GuildMember, RoleResolvable, ButtonBuilder, ModalActionRowComponentBuilder } from "discord.js";
import { find_server_settings } from "../util/database/dbutils";
import { colors } from "../util/colors";
import { emojis } from "../util/emojis";
import { nanoid } from "nanoid";
import { generate_captcha } from "../util/captcha_generator";

export default {
	name: Events.GuildMemberAdd,
	async execute(member: GuildMember) {
		let server = await find_server_settings(member.guild.id);
    let joined_user = member.user;
    let joined_user_icon = joined_user.displayAvatarURL({ extension: 'webp' }).toString();

    if (server.captcha_verification_required) {
      await member.roles.add(server.captcha_unverified_role_id as RoleResolvable);

      let captcha_has_failed_before = false

      async function captchaPrompter() {   // this was previously "interaction" but in the guildMemberAdd event the member instance can be accessed without passing it as argument
        const captcha_ready: Discord.ButtonBuilder = new Discord.ButtonBuilder()
          .setCustomId('captcha_ready')
          .setLabel('Solve captcha')
          .setStyle(ButtonStyle.Success)
        const captcha_regenerate: Discord.ButtonBuilder = new Discord.ButtonBuilder()
          .setCustomId('captcha_regen')
          .setLabel('Get new captcha')
          .setStyle(ButtonStyle.Secondary)

        const captcha = await generate_captcha();
        const captcha_attachment = captcha.file;
        const captcha_attachment_filename = captcha.attachment;
        const captcha_text = captcha.solution;

        console.log(captcha_text)

        let captcha_embed: Discord.EmbedBuilder;

        if(!captcha_has_failed_before) {
          captcha_embed = new Discord.EmbedBuilder()
            .setColor(colors.color_default)
            // .setAuthor({ name: `${wallet_nickname}`, iconURL: wallet_target_member_avatar })     ### Server on which to verify
            .setTitle('\u{1FAAA} - Verification required!')
            .setDescription('This server requires you to verify that you are a human by solving the following captcha.')
            .setImage(captcha_attachment_filename)
            .addFields(
              { name: 'Instructions', value: '1. Press the "Solve Captcha" button when you are ready.\n2. Enter the six characters connected by the green line.', inline: false },
            )
            .setFooter({ text: 'You can submit custom backgrounds for captchas by supporting Orb on Patreon! Orb will pick one at random.\nThis captcha will time out in 10 minutes.' })
        } else {
          captcha_embed = new Discord.EmbedBuilder()
            .setColor(colors.color_error)
            // .setAuthor({ name: `${wallet_nickname}`, iconURL: wallet_target_member_avatar })     ### Server on which to verify
            .setTitle('\u{1FAAA} - Verification required')
            .setDescription('You have failed the captcha. Please try verifying yourself again.')
            .setImage(captcha_attachment_filename)
            .addFields(
              { name: 'Instructions', value: '1. Press the "Solve Captcha" button when you are ready.\n2. Enter the six characters connected by the green line.', inline: false },
            )
            .setFooter({ text: 'You can submit custom backgrounds for captchas by supporting Orb on Patreon! Orb will pick one at random.' })
        }

        const captcha_button_row = new Discord.ActionRowBuilder<ButtonBuilder>().addComponents(captcha_ready, captcha_regenerate)

        const captcha_embed_message: Discord.Message = await member.user.send({ embeds: [captcha_embed], components: [captcha_button_row], files: [captcha_attachment] });

        const captcha_button_collector = captcha_embed_message.createMessageComponentCollector({
          filter: (selection: Discord.ButtonInteraction) => selection.user.id === member.user.id,
          componentType: Discord.ComponentType.Button,
          time: (1000 * 60 * 10)
        });

        captcha_button_collector.on('end', async (collected, reason) => {
          if (reason === "time") {
            const captcha_timeout_embed = new Discord.EmbedBuilder()
              .setColor(colors.color_error)
              .setTitle(`${emojis.failure_emoji} - Captcha timeout`)
              .setDescription('This captcha timed out. You can leave and rejoin the server to get a new captcha to solve.');

            captcha_embed_message.edit({ embeds: [captcha_timeout_embed], components: [], files: [] });
          }
        });
        captcha_button_collector.on('collect', async (captcha_modal_interaction) => {
          switch(captcha_modal_interaction.customId) {
            case 'captcha_ready':
              const captcha_uuid = nanoid().toString()

              const captcha_input_modal = new Discord.ModalBuilder()
                .setCustomId(captcha_uuid)
                .setTitle('Enter captcha...')
              const captcha_input_field = new Discord.TextInputBuilder()
                .setCustomId('captcha_input_field')
                .setLabel('Enter the captcha. (Not case sensitive)')
                .setStyle(TextInputStyle.Short)
                .setMaxLength(6)
                .setMinLength(6)
                .setPlaceholder('ABCDEF')
                .setRequired(true)

              const captcha_input_row = new Discord.ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(captcha_input_field)
              captcha_input_modal.addComponents(captcha_input_row);

              await captcha_modal_interaction.showModal(captcha_input_modal);

              console.log(captcha_uuid);

              try {
                const modal_filter = (modal: Discord.ModalSubmitInteraction) => modal.customId === captcha_uuid;

                const captcha_input_response = await captcha_modal_interaction.awaitModalSubmit({ filter: modal_filter, time: (1000 * 60 * 2) });

                if (captcha_input_response.customId === captcha_uuid) {
                  const user_response = captcha_input_response.fields.getTextInputValue('captcha_input_field');

                  const verifying_captcha_embed = new Discord.EmbedBuilder()
                    .setColor(colors.color_default)
                    .setTitle(`${emojis.loading_animation_emoji} Verifying captcha...`)

                  // await captcha_input_response.deferUpdate();
                  // await interaction.editReply({ embeds: [verifying_captcha_embed], components: [], files: [] });

                  await captcha_input_response.reply({ embeds: [verifying_captcha_embed], components: [], files: [] });

                  if (user_response.toUpperCase() === captcha_text) {
                    const captcha_passed_embed = new Discord.EmbedBuilder()
                      .setColor(colors.color_success)
                      .setTitle(`${emojis.success_emoji} - Verified!`)
                      .setDescription('Thank you for making sure you are a human! You should now be able to access the server.\n\nIf you are unable to access the server in more than five minutes, contact the moderation team.')

                    // give someone the role here and shit

                    await member.roles.remove(server.captcha_unverified_role_id as RoleResolvable);

                    await captcha_input_response.deleteReply();
                    await captcha_embed_message.edit({ embeds: [captcha_passed_embed], components: [], files: [] });
                    captcha_button_collector.empty();
                    captcha_button_collector.stop();
                    return;

                  } else {
                    captcha_has_failed_before = true;

                    const captcha_retry = new Discord.ButtonBuilder()
                      .setCustomId('captcha_retry')
                      .setLabel('Get new captcha')
                      .setStyle(ButtonStyle.Secondary)
                    const captcha_retry_button_row = new Discord.ActionRowBuilder<ButtonBuilder>().addComponents(captcha_retry)
                    const captcha_failed_embed = new Discord.EmbedBuilder()
                      .setColor(colors.color_error)
                      .setTitle(`${emojis.failure_emoji} - Failed to verify`)
                      .setDescription('You entered the wrong captcha. Please try again.\n\nIf this problem persists, contact the moderation team of the server.')

                    await captcha_input_response.deleteReply();
                    const captcha_failed_embed_message = await captcha_embed_message.edit({ embeds: [captcha_failed_embed], components: [captcha_retry_button_row], files: [] });

                    try {
                      const captcha_failed_embed_interaction = await captcha_failed_embed_message.awaitMessageComponent({
                        filter: (selection: Discord.Interaction) => selection.user.id === member.user.id,
                        time: (1000 * 60 * 5)
                      });

                      switch(captcha_failed_embed_interaction.customId) {
                        case 'captcha_retry':
                          const grabbing_new_captcha_embed = new Discord.EmbedBuilder()
                            .setColor(colors.color_error)
                            .setTitle(`${emojis.loading_animation_emoji} Grabbing new captcha...`)

                          await captcha_failed_embed_interaction.reply({ embeds: [grabbing_new_captcha_embed] });

                          captchaPrompter();

                          await captcha_failed_embed_interaction.deleteReply();
                          captcha_embed_message.delete();
                          captcha_button_collector.empty();
                          captcha_button_collector.stop();

                          break;
                      }
                    } catch (exception) {
                      console.trace(exception);
                    }
                  }
                }
              } catch (exception) {
                console.warn('Captcha modal submit ended with timeout!');
                console.trace(exception);
              }
              break;

            case `captcha_regen`:
              captcha_modal_interaction.deferUpdate();
              captcha_embed_message.delete();

              captchaPrompter();
              break;
          }
        })
      }

      captchaPrompter();
    }

    if (!server.welcome_channel_id || !server.welcome_messages_enabled) {
      console.log(server.welcome_channel_id, server.welcome_messages_enabled)
      return;
    }

    let welcome_message_prototype = server.welcome_message;
    let welcome_message = welcome_message_prototype.replace(/USER/g, joined_user.username).replace(/SERVER/g, member.guild.name)

    const guild_member_add_embed = new Discord.EmbedBuilder()
      .setColor(colors.color_default)
      .setAuthor({ name: `${joined_user.username} joined!`, iconURL: joined_user_icon })
      .setDescription(
        `${welcome_message}\n\nNew user ${joined_user.username}\n` +
        `\u{2514} User ID: ${joined_user.id}\n` +
        `\u{2514} Account age: **${ Math.floor((Date.now() - joined_user.createdAt.getTime()) / 1000 / 60 / 60 / 24) } days**`)
      .setFooter({ text: `Member count: ${member.guild.memberCount}` })

    const join_message_channel = member.guild.channels.cache.get(server.welcome_channel_id);
    if(join_message_channel && join_message_channel.isTextBased()) {
      await join_message_channel.send({ embeds: [guild_member_add_embed] });
    } // If no join message, just do nothing

    console.log(`Welcomed new member ${joined_user.id} on server ${member.guild.id}`);
	},
};
