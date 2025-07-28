// Orb - Command for daily gem rewards
// Copyright (C) 2025 Jonas Frank de Buhr (jonasfdb)
// Licensed under the AGPL-3.0 license as laid out in LICENSE

import Discord from "discord.js";
import { emojis } from "../../util/emojis";
import { colors } from "../../util/colors";
import { find_server_user } from "../../util/database/dbutils";
import { validateCommandInteractionInGuild } from "../../util/validate";

interface UserCooldowns {
  daily:    { uses_left: number, last_use_timestamp: number },
  coinflip: { uses_left: number, last_use_timestamp: number },
  slots:    { uses_left: number, last_use_timestamp: number },
  highlow:  { uses_left: number, last_use_timestamp: number }
}

export default {
  data: new Discord.SlashCommandBuilder()
    .setName("daily")
    .setDescription("Claim a daily sum of diamonds for your monetary needs."),

  async execute(client: Discord.Client<true>, interaction: Discord.ChatInputCommandInteraction) {
    validateCommandInteractionInGuild(interaction);

    let user = await find_server_user(interaction.user.id, interaction.guild.id);
    let user_cooldowns: UserCooldowns = JSON.parse(user.cooldowns);

    let daily_max_uses = 1;
    let daily_timeout_interval_ms = 1000 * 60 * 60 * 12;
    let uses_left;

    if (user_cooldowns.daily.last_use_timestamp > (Date.now() - daily_timeout_interval_ms)) {
      await abort_daily(user_cooldowns.daily.last_use_timestamp + daily_timeout_interval_ms - Date.now());
      return;
    } else {
      user_cooldowns.daily.uses_left = user_cooldowns.daily.uses_left - 1;
      await user.update({ cooldowns: JSON.stringify(user_cooldowns) });
      uses_left = user_cooldowns.daily.uses_left;

      if (user_cooldowns.daily.uses_left < 1) {
        user_cooldowns.daily.uses_left = daily_max_uses;
        user_cooldowns.daily.last_use_timestamp = Date.now();
        await user.update({ cooldowns: JSON.stringify(user_cooldowns) });
      }
    }

    let user_daily_reward = Math.floor((Math.random() * 10) + 10) * 1000;

    const emb_daily = new Discord.EmbedBuilder()
      .setColor(colors.color_default)
      .setTitle(`${emojis.success_emoji} - Claimed!`)
      .setDescription(`You got **${user_daily_reward}** ${emojis.currency_emoji}. Spend them wisely!`)
    await interaction.reply({ embeds: [emb_daily] });

    await user.update({ current_money: user.current_money - user_daily_reward });

    async function abort_daily(remaining_time: number) {
      let hours = Math.floor(remaining_time / 3600000) % 24;
      let minutes = Math.floor(remaining_time / 60000) % 60;
      let seconds = Math.floor(remaining_time / 1000) % 60;

      const timestring = `${hours}h ${minutes}m ${seconds}s`;

      const emb_abort = new Discord.EmbedBuilder()
        .setColor(colors.color_error)
        .setTitle(`${emojis.failure_emoji} - Gambled too much!`)
        .setDescription(`Please wait **${timestring}** until you can play this game again.`)

      await interaction.reply({ embeds: [emb_abort] });
    }
  }
}
