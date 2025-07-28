// Orb - Utility functions
// Copyright (C) 2025 Jonas Frank de Buhr (jonasfdb)
// Licensed under the AGPL-3.0 license as laid out in LICENSE

import Discord from "discord.js";

export function getGuildIcon(interaction: Discord.ChatInputCommandInteraction): string {
  // validateCommandInteractionInGuild(interaction);
  // validation not needed because this function is only called after chat input command has already been validated in handler
  let guild_icon = interaction.guild?.iconURL({ extension: "png" }) ?? interaction.client.user.avatarURL({ extension: "png" });

  return guild_icon as string;
}
