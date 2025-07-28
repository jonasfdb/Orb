// Orb - Command for users to generate a QR code containing the server's invite link
// Copyright (C) 2025 Jonas Frank de Buhr (jonasfdb)
// Licensed under the AGPL-3.0 license as laid out in LICENSE.

// This script uses the symbology package, which is licensed under the GPL-3.0 license.
// This package is used here in compliance with the AGPL-3.0 license as per Section 13 of the AGPL-3.0 license.

import Discord from "discord.js";
import { colors } from "../../util/colors";
import { nanoid } from "nanoid";
import canvas from "@napi-rs/canvas";
import fs from "fs"
import pkg from 'symbology';
import { validateCommandInteractionInGuild } from "../../util/validate";
import { getGuildIcon } from "../../util/helpers";
const { SymbologyType, createFile } = pkg;

export default {
  data: new Discord.SlashCommandBuilder()
    .setName('qr')
    .setDescription('Generate a specific QR code server invite.')
    .addIntegerOption((option) => option
      .setName('days-valid')
      .setDescription('How many days the invite link is valid for.')
      .setMinValue(1)
      .setMaxValue(365)
  ),

  async execute(client: Discord.Client<true>, interaction: Discord.ChatInputCommandInteraction) {
    validateCommandInteractionInGuild(interaction);

    const qr_uuid = nanoid(12);
    const max_age = interaction.options.getInteger('days-valid') || 0;
    const invite_link = await interaction.channel.createInvite({
      maxAge: 60 * 60 * 24 * max_age
    })

    try {
      const { data } = await createFile({
        symbology: SymbologyType.QRCODE,
        showHumanReadableText: false,
        scale: 5,
        // outputOptions: OutputOption.BARCODE_DOTTY_MODE,
        fileName: `./src/util/qr_storage/qr_${qr_uuid}.png`,
      }, `${invite_link}`)

      const qr_canvas = canvas.createCanvas(400, 400);
      const qr_canvas_context = qr_canvas.getContext('2d');
      const qr_bg = await canvas.loadImage(`./src/util/qr_storage/whitespace.png`);
      const qr_image_file = await canvas.loadImage(`./src/util/qr_storage/qr_${qr_uuid}.png`);

      qr_canvas_context.drawImage(qr_bg, 0, 0, 400, 400);
      qr_canvas_context.drawImage(qr_image_file, 40, 40, 320, 320);
      qr_canvas_context.save();

      const qr_image = new Discord.AttachmentBuilder(await qr_canvas.encode('png'), { name: 'qr.png' })

      const qr_embed = new Discord.EmbedBuilder()
        .setColor(colors.color_default)
        .setAuthor({ name: interaction.guild.name, iconURL: getGuildIcon(interaction) })
        .setImage('attachment://qr.png')

      interaction.reply({ embeds: [qr_embed], files: [qr_image] });

      fs.unlinkSync(`./src/util/qr_storage/qr_${qr_uuid}.png`);
    } catch (err) {
      console.error(err);
    }
  }
}
