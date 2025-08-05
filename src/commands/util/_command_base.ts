// Orb - Command file template
// Copyright (C) 2025 Jonas Frank de Buhr (jonasfdb)
// Licensed under the AGPL-3.0 license as laid out in LICENSE

import Discord from "discord.js";

export default {
  data: new Discord.SlashCommandBuilder()
    .setName('name')
    .setDescription('description'),
    // subcommands
    // options
    // and shit

  async execute(client: Discord.Client<true>, interaction: Discord.ChatInputCommandInteraction) {
    // what the command will do
  }
}