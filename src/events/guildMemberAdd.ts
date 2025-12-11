// Orb - Event handler for guildMemberAdd events
// Copyright (C) 2025 Jonas Frank de Buhr (jonasfdb)
// Licensed under the AGPL-3.0 license as laid out in LICENSE

import Discord, { Events, ButtonStyle, TextInputStyle, GuildMember, RoleResolvable, ButtonBuilder, ModalActionRowComponentBuilder } from "discord.js";
import { findGuildSettings } from "../util/database/dbutils";
import { colors } from "../../util/json/colors";
import { emojis } from "../../util/json/emojis";
import { generateCaptcha } from "../util/generateCaptcha";
import { ulid } from "ulid";

export default {
  name: Events.GuildMemberAdd,
  async execute(member: GuildMember) {
    let dbGuild = await findGuildSettings(member.guild.id);
    let userJoined = member.user;
    let userJoinedIcon = userJoined.displayAvatarURL({ extension: 'webp' }).toString();

    if (dbGuild.captchaRequired) {
      await member.roles.add(dbGuild.unverifiedRoleID as RoleResolvable);
      let hasCaptchaFailedBefore = false;
      let embCaptcha: Discord.EmbedBuilder;

      async function captchaPrompter() {
        const btnReadyToSolve: Discord.ButtonBuilder = new Discord.ButtonBuilder()
          .setCustomId('captcha_ready')
          .setLabel('Solve captcha')
          .setStyle(ButtonStyle.Success)
        const btnRegenerateCaptcha: Discord.ButtonBuilder = new Discord.ButtonBuilder()
          .setCustomId('captcha_regen')
          .setLabel('Get new captcha')
          .setStyle(ButtonStyle.Secondary)

        const captcha = await generateCaptcha();
        const captchaAttachment = captcha.file;
        const captchaAttachmentFilename = captcha.attachment;
        const captchaText = captcha.solution;

        if (!hasCaptchaFailedBefore) {
          embCaptcha = new Discord.EmbedBuilder()
            .setColor(colors.default)
            .setTitle('\u{1FAAA} - Verification required!')
            .setDescription('This server requires you to verify that you are a human by solving the following captcha.')
            .setImage(captchaAttachmentFilename)
            .addFields({
              name: 'Instructions',
              value:  '1. Press the "Solve Captcha" button when you are ready.\n' +
                      '2. Enter the six characters connected by the green line.', inline: false
            })
            .setFooter({ text: 'You can submit custom backgrounds for captchas by supporting Orb on Patreon! Orb will pick one at random.\nThis captcha will time out in 10 minutes.' })
        } else {
          embCaptcha = new Discord.EmbedBuilder()
            .setColor(colors.error)
            .setTitle('\u{1FAAA} - Verification required')
            .setDescription('You have failed the captcha. Please try verifying yourself again.')
            .setImage(captchaAttachmentFilename)
            .addFields({
              name: 'Instructions',
              value:  '1. Press the "Solve Captcha" button when you are ready.\n' +
                      '2. Enter the six characters connected by the green line.', inline: false
            })
            .setFooter({ text: 'You can submit custom backgrounds for captchas by supporting Orb on Patreon! Orb will pick one at random.' })
        }

        const captchaBtnRow = new Discord.ActionRowBuilder<ButtonBuilder>().addComponents(btnReadyToSolve, btnRegenerateCaptcha)
        const captchaMessage: Discord.Message = await member.user.send({ embeds: [embCaptcha], components: [captchaBtnRow], files: [captchaAttachment] });

        const captchaBtnCollector = captchaMessage.createMessageComponentCollector({
          filter: (selection: Discord.ButtonInteraction) => selection.user.id === member.user.id,
          componentType: Discord.ComponentType.Button,
          time: (1000 * 60 * 10)
        });

        captchaBtnCollector.on('end', async (collected, reason) => {
          if (reason === "time") {
            const embTimeout = new Discord.EmbedBuilder()
              .setColor(colors.error)
              .setTitle(`${emojis.cross} - Captcha timeout`)
              .setDescription('This captcha timed out. You can leave and rejoin the server to get a new captcha to solve.');

            captchaMessage.edit({ embeds: [embTimeout], components: [], files: [] });
          }
        });
        captchaBtnCollector.on('collect', async (captcha_modal_interaction) => {
          switch (captcha_modal_interaction.customId) {
            case 'captcha_ready':
              const cULID = ulid();
              const modalCaptchaInput = new Discord.ModalBuilder()
                .setCustomId(cULID)
                .setTitle('Enter captcha...')
              const modalCaptchaInputField = new Discord.TextInputBuilder()
                .setCustomId('captcha_input_field')
                .setLabel('Enter the captcha. (Not case sensitive)')
                .setStyle(TextInputStyle.Short)
                .setMaxLength(6)
                .setMinLength(6)
                .setPlaceholder('ABCDEF')
                .setRequired(true)

              const modalCaptchaInputRow = new Discord.ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(modalCaptchaInputField)
              modalCaptchaInput.addComponents(modalCaptchaInputRow);
              await captcha_modal_interaction.showModal(modalCaptchaInput);

              try {
                const modal_filter = (modal: Discord.ModalSubmitInteraction) => modal.customId === cULID;
                const captchaInputResponse = await captcha_modal_interaction.awaitModalSubmit({ filter: modal_filter, time: (1000 * 60 * 2) });

                if (captchaInputResponse.customId === cULID) {
                  const captchaUserResponse = captchaInputResponse.fields.getTextInputValue('captcha_input_field');
                  const embVerifying = new Discord.EmbedBuilder()
                    .setColor(colors.default)
                    .setTitle(`${emojis.animatedLoading} Verifying captcha...`)

                  // await captcha_input_response.deferUpdate();
                  // await interaction.editReply({ embeds: [verifying_captcha_embed], components: [], files: [] });

                  await captchaInputResponse.reply({ embeds: [embVerifying], components: [], files: [] });

                  if (captchaUserResponse.toUpperCase() === captchaText) {
                    const embCaptchaPassed = new Discord.EmbedBuilder()
                      .setColor(colors.success)
                      .setTitle(`${emojis.checkmark} - Verified!`)
                      .setDescription('Thank you for making sure you are a human! You should now be able to access the server.\n\nIf you are unable to access the server in more than five minutes, contact the moderation team.')

                    // give someone the role here and shit

                    await member.roles.remove(dbGuild.unverifiedRoleID as RoleResolvable);
                    await captchaInputResponse.deleteReply();
                    await captchaMessage.edit({ embeds: [embCaptchaPassed], components: [], files: [] });
                    captchaBtnCollector.empty();
                    captchaBtnCollector.stop();
                    return;
                  } else {
                    hasCaptchaFailedBefore = true;
                    const btnRetryCaptcha = new Discord.ButtonBuilder()
                      .setCustomId('captcha_retry')
                      .setLabel('Get new captcha')
                      .setStyle(ButtonStyle.Secondary)
                    const captchaRetryBtnRow = new Discord.ActionRowBuilder<ButtonBuilder>().addComponents(btnRetryCaptcha)
                    const embFailedCaptcha = new Discord.EmbedBuilder()
                      .setColor(colors.error)
                      .setTitle(`${emojis.cross} - Failed to verify`)
                      .setDescription('You entered the wrong captcha. Please try again.\n\nIf this problem persists, contact the moderation team of the server.')

                    await captchaInputResponse.deleteReply();
                    const embFailedCaptchaMessage = await captchaMessage.edit({ embeds: [embFailedCaptcha], components: [captchaRetryBtnRow], files: [] });

                    try {
                      const captchaFailedInteraction = await embFailedCaptchaMessage.awaitMessageComponent({
                        filter: (selection: Discord.Interaction) => selection.user.id === member.user.id,
                        time: (1000 * 60 * 5)
                      });

                      switch (captchaFailedInteraction.customId) {
                        case 'captcha_retry':
                          const embNewCaptcha = new Discord.EmbedBuilder()
                            .setColor(colors.error)
                            .setTitle(`${emojis.animatedLoading} Grabbing new captcha...`)

                          await captchaFailedInteraction.reply({ embeds: [embNewCaptcha] });

                          captchaPrompter();

                          await captchaFailedInteraction.deleteReply();
                          captchaMessage.delete();
                          captchaBtnCollector.empty();
                          captchaBtnCollector.stop();
                          break;
                      }
                    } catch (error) {
                      console.trace(error);
                    }
                  }
                }
              } catch (error) {
                console.warn('Captcha modal submit ended with timeout!');
                console.trace(error);
              }
              break;
            case `captcha_regen`:
              captcha_modal_interaction.deferUpdate();
              captchaMessage.delete();
              captchaPrompter();
              break;
          }
        })
      }
      captchaPrompter();
    }

    if (!dbGuild.channelsWelcomeID || !dbGuild.welcomeMessagesEnabled) {
      console.log(dbGuild.channelsWelcomeID, dbGuild.welcomeMessagesEnabled)
      return;
    }

    let pJoinMessage = dbGuild.messagesWelcome;
    let joinMessage = pJoinMessage.replace(/USER/g, userJoined.username).replace(/SERVER/g, member.guild.name)

    const embMemberJoin = new Discord.EmbedBuilder()
      .setColor(colors.default)
      .setAuthor({ name: `${userJoined.username} joined!`, iconURL: userJoinedIcon })
      .setDescription(
        `${joinMessage}\n\nNew user ${userJoined.username}\n` +
        `\u{2514} User ID: ${userJoined.id}\n` +
        `\u{2514} Account age: **${Math.floor((Date.now() - userJoined.createdAt.getTime()) / 1000 / 60 / 60 / 24)} days**`)
      .setFooter({ text: `Member count: ${member.guild.memberCount}` })

    const messageChannel = member.guild.channels.cache.get(dbGuild.channelsWelcomeID);
    if (messageChannel && messageChannel.isTextBased()) {
      await messageChannel.send({ embeds: [embMemberJoin] });
    } // If no join message, just do nothing
    // console.log(`Welcomed new member ${joined_user.id} on server ${member.guild.id}`);
  },
};
