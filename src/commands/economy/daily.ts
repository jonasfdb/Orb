// Orb - Command for daily gem rewards
// Copyright (C) 2025 Jonas Frank de Buhr (jonasfdb)
// Licensed under the AGPL-3.0 license as laid out in LICENSE

import Discord from "discord.js";
import { emojis } from "../../../util/json/emojis";
import { colors } from "../../../util/json/colors";
import { findGuildMember } from "../../util/database/dbutils";
import { validateCommandInteractionInGuild } from "../../util/validate";

interface UserCooldowns {
  daily: { uses_left: number, last_use_timestamp: number },
  coinflip: { uses_left: number, last_use_timestamp: number },
  slots: { uses_left: number, last_use_timestamp: number },
  highlow: { uses_left: number, last_use_timestamp: number }
}

export default {
  data: new Discord.SlashCommandBuilder()
    .setName("daily")
    .setDescription("Claim a daily sum of diamonds for your monetary needs."),

  async execute(client: Discord.Client<true>, interaction: Discord.ChatInputCommandInteraction) {
    validateCommandInteractionInGuild(interaction);

    let user = await findGuildMember(interaction.user.id, interaction.guild.id);
    let userCooldowns: UserCooldowns = JSON.parse(user.cooldowns);

    let dailyMaxUses = 1;
    let dailyTimeoutInterval = 1000 * 60 * 60 * 12;
    let usesLeft;

    if (userCooldowns.daily.last_use_timestamp > (Date.now() - dailyTimeoutInterval)) {
      await abort_daily(userCooldowns.daily.last_use_timestamp + dailyTimeoutInterval - Date.now());
      return;
    } else {
      userCooldowns.daily.uses_left = userCooldowns.daily.uses_left - 1;
      await user.update({ cooldowns: JSON.stringify(userCooldowns) });
      usesLeft = userCooldowns.daily.uses_left;

      if (userCooldowns.daily.uses_left < 1) {
        userCooldowns.daily.uses_left = dailyMaxUses;
        userCooldowns.daily.last_use_timestamp = Date.now();
        await user.update({ cooldowns: JSON.stringify(userCooldowns) });
      }
    }

    let dailyReward = Math.floor((Math.random() * 10) + 10) * 1000;

    const embDaily = new Discord.EmbedBuilder()
      .setColor(colors.color_default)
      .setTitle(`${emojis.success_emoji} - Claimed!`)
      .setDescription(`You got **${dailyReward}** ${emojis.currency_emoji}. Spend them wisely!`)
    await interaction.reply({ embeds: [embDaily] });

    await user.update({ currentMoney: user.currentMoney - dailyReward });

    async function abort_daily(timeRemaining: number) {
      let hours = Math.floor(timeRemaining / 3600000) % 24;
      let minutes = Math.floor(timeRemaining / 60000) % 60;
      let seconds = Math.floor(timeRemaining / 1000) % 60;

      const timestring = `${hours}h ${minutes}m ${seconds}s`;

      const embAbort = new Discord.EmbedBuilder()
        .setColor(colors.color_error)
        .setTitle(`${emojis.failure_emoji} - Gambled too much!`)
        .setDescription(`Please wait **${timestring}** until you can play this game again.`)

      await interaction.reply({ embeds: [embAbort] });
    }
  }
}
