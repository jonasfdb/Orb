// Orb - Command to test captcha flow
// Copyright (C) 2025 Jonas Frank de Buhr (jonasfdb)
// Licensed under the AGPL-3.0 license as laid out in LICENSE

import Discord from "discord.js";
import { colors } from "../../../util/json/colors";
import { emojis } from "../../../util/json/emojis";
import { generateCaptcha } from "../../util/generateCaptcha";
import { validateCommandInteractionInGuild } from "../../util/validate";
import { ulid } from "ulid";

export default {
  data: new Discord.SlashCommandBuilder()
    .setName('captcha_test')
    .setDescription('Captcha test lololol'),

  async execute(client: Discord.Client<true>, interaction: Discord.ChatInputCommandInteraction) {
    validateCommandInteractionInGuild(interaction);
    await interaction.deferReply()
    let hasCaptchaFailedBefore = false

    async function captchaPrompter(interaction: Discord.ChatInputCommandInteraction) {
      const btnCaptchaReady = new Discord.ButtonBuilder()
        .setCustomId('captcha_ready')
        .setLabel('Solve captcha')
        .setStyle(Discord.ButtonStyle.Success)
      const btnCaptchaRegen = new Discord.ButtonBuilder()
        .setCustomId('captcha_regen')
        .setLabel('Get new captcha')
        .setStyle(Discord.ButtonStyle.Secondary)

      const captcha = await generateCaptcha();
      const cAttachment = captcha.file;
      const cAttachmentFilename = captcha.attachment;
      const cText = captcha.solution;

      // console.log(cText)

      let embCaptchaRequired;

      if (!hasCaptchaFailedBefore) {
        embCaptchaRequired = new Discord.EmbedBuilder()
          .setColor(colors.default)
          .setTitle('\u{1FAAA} - Verification required!')
          .setDescription('This server requires you to verify that you are a human by solving the following captcha.')
          .setImage(cAttachmentFilename)
          .addFields({
            name: 'Instructions', 
            value:  '1. Press the "Solve Captcha" button when you are ready.\n' +
                    '2. Enter the six characters connected by the green line.', inline: false 
          })
          .setFooter({ text: 'You can submit custom backgrounds for captchas by supporting Orb on Patreon! Orb will pick one at random.\nThis captcha will time out in 10 minutes.' })
      } else {
        embCaptchaRequired = new Discord.EmbedBuilder()
          .setColor(colors.error)
          .setTitle('\u{1FAAA} - Verification required')
          .setDescription('You have failed the captcha. Please try again!')
          .setImage(cAttachmentFilename)
          .addFields({
            name: 'Instructions', 
            value:  '1. Press the "Solve Captcha" button when you are ready.\n' +
                    '2. Enter the six characters connected by the green line.', inline: false
          })
          .setFooter({ text: 'You can submit custom backgrounds for captchas by supporting Orb on Patreon! Orb will pick one at random.' })
      }

      const cRow = new Discord.ActionRowBuilder<Discord.ButtonBuilder>().addComponents(btnCaptchaReady, btnCaptchaRegen)

      const cSentMessage = await interaction.editReply({ embeds: [embCaptchaRequired], components: [cRow], files: [cAttachment] });

      const cButtonFilter = (selection: Discord.MessageComponentInteraction) => selection.user.id === interaction.user.id;
      const cButtonCollector = cSentMessage.createMessageComponentCollector({ filter: cButtonFilter, componentType: Discord.ComponentType.Button, time: (1000 * 60 * 10) });

      cButtonCollector.on('end', async (collected, reason) => {
        if (reason === "time") {
          const embCaptchaTimeout = new Discord.EmbedBuilder()
            .setColor(colors.error)
            .setTitle(`${emojis.cross} - Captcha timeout`)
            .setDescription('This captcha timed out. You can leave and rejoin the server to get a new captcha to solve.');

          cSentMessage.edit({ embeds: [embCaptchaTimeout], components: [], files: [] });
        }
      });
      cButtonCollector.on('collect', async (cModalInteraction) => {
        switch (cModalInteraction.customId) {
          case 'captcha_ready':
            const cUlid = ulid();

            const cModalInput = new Discord.ModalBuilder()
              .setCustomId(cUlid)
              .setTitle('Enter captcha...')
            const cModalInputField = new Discord.TextInputBuilder()
              .setCustomId('captcha_input_field')
              .setLabel('Enter the captcha. (Not case sensitive)')
              .setStyle(Discord.TextInputStyle.Short)
              .setMaxLength(6)
              .setMinLength(6)
              .setPlaceholder('ABCDEF')
              .setRequired(true)
            const cModalInputRow = new Discord.ActionRowBuilder<Discord.TextInputBuilder>().addComponents(cModalInputField)
            cModalInput.addComponents(cModalInputRow);

            await cModalInteraction.showModal(cModalInput);

            console.log(cUlid);

            try {
              const cModalFilter = (modal: Discord.ModalSubmitInteraction) => modal.customId === cUlid;

              const cInputResponse = await cModalInteraction.awaitModalSubmit({ filter: cModalFilter, time: (1000 * 60 * 2) });

              if (cInputResponse.customId === cUlid) {
                const userResponse = cInputResponse.fields.getTextInputValue('captcha_input_field');

                const embVerifying = new Discord.EmbedBuilder()
                  .setColor(colors.default)
                  .setTitle(`${emojis.animatedLoading} Verifying captcha...`)

                // await captcha_input_response.reply({ embeds: [verifying_captcha_embed] });

                await cInputResponse.deferUpdate();
                await interaction.editReply({ embeds: [embVerifying], components: [], files: [] });

                if (userResponse.toUpperCase() === cText) {
                  const embPassed = new Discord.EmbedBuilder()
                    .setColor(colors.success)
                    .setTitle(`${emojis.checkmark} - Verified!`)
                    .setDescription('Thank you for making sure you are a human! You should now be able to access the server.\n\nIf you are unable to access the server in more than five minutes, contact the moderation team.')

                  // give someone the role here and shit

                  await cInputResponse.deleteReply();
                  await cSentMessage.edit({ embeds: [embPassed], components: [], files: [] });
                  cButtonCollector.empty();
                  cButtonCollector.stop();
                  return;

                } else {
                  hasCaptchaFailedBefore = true;

                  const btnCaptchaRetry = new Discord.ButtonBuilder()
                    .setCustomId('captcha_retry')
                    .setLabel('Get new captcha')
                    .setStyle(Discord.ButtonStyle.Secondary)
                  const cRetryRow = new Discord.ActionRowBuilder<Discord.ButtonBuilder>().addComponents(btnCaptchaRetry)
                  const embCaptchaFailed = new Discord.EmbedBuilder()
                    .setColor(colors.error)
                    .setTitle(`${emojis.cross} - Failed to verify`)
                    .setDescription('You entered the wrong captcha. Please try again.\n\nIf this problem persists, contact the moderation team of the server.')

                  await cInputResponse.deleteReply();
                  const cFailedMessage = await cSentMessage.edit({ embeds: [embCaptchaFailed], components: [cRetryRow], files: [] });

                  try {
                    const cFailedInteraction = await cFailedMessage.awaitMessageComponent({ filter: cButtonFilter, time: (1000 * 60 * 5) });

                    switch (cFailedInteraction.customId) {
                      case 'captcha_retry':
                        const embNewCaptcha = new Discord.EmbedBuilder()
                          .setColor(colors.error)
                          .setTitle(`${emojis.animatedLoading} Grabbing new captcha...`)

                        await cFailedInteraction.deferUpdate();
                        await interaction.editReply({ embeds: [embNewCaptcha] });

                        captchaPrompter(interaction);

                        // await captcha_failed_embed_interaction.deleteReply();
                        cButtonCollector.empty();
                        cButtonCollector.stop();
                        // captcha_embed_message.delete();

                        break;
                    }
                  } catch (error) {
                    throw error;
                  }
                }
              }
            } catch (error) {
              throw error;
            }
            break;

          case `captcha_regen`:
            cModalInteraction.deferUpdate();
            cSentMessage.delete();
            captchaPrompter(interaction);
            break;
        }
      });
    }
    captchaPrompter(interaction);
  }
}