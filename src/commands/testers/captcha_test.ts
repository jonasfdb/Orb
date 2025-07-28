// Orb - Command to test captcha flow
// Copyright (C) 2025 Jonas Frank de Buhr (jonasfdb)
// Licensed under the AGPL-3.0 license as laid out in LICENSE

import Discord from "discord.js";
import { colors } from "../../util/colors";
import { emojis } from "../../util/emojis";
import { nanoid } from "nanoid";
import { generate_captcha } from "../../util/captcha_generator";
import { validateCommandInteractionInGuild } from "../../util/validate";

export default {
  data: new Discord.SlashCommandBuilder()
    .setName('captcha_test')
    .setDescription('Captcha test lololol'),

  async execute(client: Discord.Client<true>, interaction: Discord.ChatInputCommandInteraction) {
    validateCommandInteractionInGuild(interaction);
    await interaction.deferReply()
    let captcha_has_failed_before = false

    async function captchaPrompter(interaction: Discord.ChatInputCommandInteraction) {
      const captcha_ready = new Discord.ButtonBuilder()
        .setCustomId('captcha_ready')
        .setLabel('Solve captcha')
        .setStyle(Discord.ButtonStyle.Success)
      const captcha_regenerate = new Discord.ButtonBuilder()
        .setCustomId('captcha_regen')
        .setLabel('Get new captcha')
        .setStyle(Discord.ButtonStyle.Secondary)

      const captcha = await generate_captcha();
      const captcha_attachment = captcha.file;
      const captcha_attachment_filename = captcha.attachment;
      const captcha_text = captcha.solution;

      console.log(captcha_text)

      let captcha_embed;

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

        const captcha_button_row = new Discord.ActionRowBuilder<Discord.ButtonBuilder>().addComponents(captcha_ready, captcha_regenerate)

        const captcha_embed_message = await interaction.editReply({ embeds: [captcha_embed], components: [captcha_button_row], files: [captcha_attachment] });

        const collector_filter = (selection: Discord.MessageComponentInteraction) => selection.user.id === interaction.user.id;
        const captcha_button_collector = captcha_embed_message.createMessageComponentCollector({ filter: collector_filter, componentType: Discord.ComponentType.Button, time: (1000 * 60 * 10) });

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
                .setStyle(Discord.TextInputStyle.Short)
                .setMaxLength(6)
                .setMinLength(6)
                .setPlaceholder('ABCDEF')
                .setRequired(true)
              const captcha_input_row = new Discord.ActionRowBuilder<Discord.TextInputBuilder>().addComponents(captcha_input_field)
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

                  // await captcha_input_response.reply({ embeds: [verifying_captcha_embed] });

                  await captcha_input_response.deferUpdate();
                  await interaction.editReply({ embeds: [verifying_captcha_embed], components: [], files: [] });

                  if (user_response.toUpperCase() === captcha_text) {
                    const captcha_passed_embed = new Discord.EmbedBuilder()
                      .setColor(colors.color_success)
                      .setTitle(`${emojis.success_emoji} - Verified!`)
                      .setDescription('Thank you for making sure you are a human! You should now be able to access the server.\n\nIf you are unable to access the server in more than five minutes, contact the moderation team.')

                    // give someone the role here and shit

                    // await interaction.member.roles.remove(await find_server_settings(interaction.guild.id).captcha_unverified_role_id);

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
                      .setStyle(Discord.ButtonStyle.Secondary)
                    const captcha_retry_button_row = new Discord.ActionRowBuilder<Discord.ButtonBuilder>().addComponents(captcha_retry)
                    const captcha_failed_embed = new Discord.EmbedBuilder()
                      .setColor(colors.color_error)
                      .setTitle(`${emojis.failure_emoji} - Failed to verify`)
                      .setDescription('You entered the wrong captcha. Please try again.\n\nIf this problem persists, contact the moderation team of the server.')

                    await captcha_input_response.deleteReply();
                    const captcha_failed_embed_message = await captcha_embed_message.edit({ embeds: [captcha_failed_embed], components: [captcha_retry_button_row], files: [] });

                    try {
                      const captcha_failed_embed_interaction = await captcha_failed_embed_message.awaitMessageComponent({ filter: collector_filter, time: (1000 * 60 * 5) });

                      switch(captcha_failed_embed_interaction.customId) {
                        case 'captcha_retry':
                          const grabbing_new_captcha_embed = new Discord.EmbedBuilder()
                            .setColor(colors.color_error)
                            .setTitle(`${emojis.loading_animation_emoji} Grabbing new captcha...`)

                          await captcha_failed_embed_interaction.deferUpdate();
                          await interaction.editReply({ embeds: [grabbing_new_captcha_embed] });

                          captchaPrompter(interaction);

                          // await captcha_failed_embed_interaction.deleteReply();
                          captcha_button_collector.empty();
                          captcha_button_collector.stop();
                          // captcha_embed_message.delete();

                          break;
                      }
                    } catch (exception) {
                      console.trace(exception)
                    }
                  }
                }
              } catch (exception) {
                console.trace(exception)
              }
              break;

            case `captcha_regen`:
              captcha_modal_interaction.deferUpdate();
              captcha_embed_message.delete();

              captchaPrompter(interaction);
              break;
          }
        });
    }

    captchaPrompter(interaction);
  }
}
