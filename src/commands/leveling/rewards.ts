// Orb - Command for users to check role rewards on a server
// Copyright (C) 2025 Jonas Frank de Buhr (jonasfdb)
// Licensed under the AGPL-3.0 license as laid out in LICENSE

import Discord from "discord.js";
import { find_server } from "../../util/database/dbutils";
import { colors } from "../../util/colors";
import { validateCommandInteractionInGuild } from "../../util/validate";

export default {
  data: new Discord.SlashCommandBuilder()
    .setName("rewards")
    .setDescription("Shows the role rewards of the server."),

  async execute(client: Discord.Client<true>, interaction: Discord.ChatInputCommandInteraction) {
    validateCommandInteractionInGuild(interaction);
    await interaction.deferReply();

    const server = await find_server(interaction.guild.id);
    let rewardsArray;
    try {
      rewardsArray = server.role_rewards_level_string ? JSON.parse(server.role_rewards_level_string) : [];
    } catch {
      rewardsArray = [];
    }

    // Build embed
    const guild_icon = interaction.guild.iconURL({ extension: "png" }) || client.user.avatarURL({ extension: "png" });
    const reward_list_embed = new Discord.EmbedBuilder()
      .setColor(colors.color_default)
      .setAuthor({ name: `Rewards on ${interaction.guild.name}`, iconURL: guild_icon as string })
      .setTimestamp();

    if (rewardsArray.length === 0) {
      reward_list_embed.setDescription(`There are no rewards on this server.`);
      await interaction.editReply({ embeds: [reward_list_embed] });
      return;
    }

    rewardsArray.sort((a: any, b: any) => a.min_level - b.min_level);
    const lines = rewardsArray.map((reward: any, i: number) => {
      const maxLevelStr = reward.max_level === 2147483647 ? "Infinity" : reward.max_level;
      return `**#${i + 1}** — <@&${reward.role_id}>\n\u{2514} Token: **${reward.token}** | Levels **${reward.min_level} - ${maxLevelStr}**`;
    });

    reward_list_embed.setDescription(lines.join("\n"));
    await interaction.editReply({ embeds: [reward_list_embed] });
  },
};
