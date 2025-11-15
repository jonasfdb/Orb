// Orb - Event handler for messageCreate events
// Copyright (C) 2025 Jonas Frank de Buhr (jonasfdb)
// Licensed under the AGPL-3.0 license as laid out in LICENSE

import Discord, { ColorResolvable, Events } from "discord.js";
import { findGuildMember, findUser, findGuild } from "../util/database/dbutils";
import { validateMessageInDM, validateMessageInGuild } from "../util/validate";
import { RoleReward } from "../types/interfaces";

async function messageOnGuild(message: Discord.Message): Promise<void> {
  validateMessageInGuild(message);
  const server_user_data = await findGuildMember(message.author.id, message.guild.id);
  const server = await findGuild(message.guild.id);
  const user = await findUser(message.author.id);

  const random_xp = Math.floor(Math.random() * 9) + 3; // Min 3, Max 12 (mee6 has max 30, this is to balance because orb has no cooldown)

  try {
    server_user_data.currentXP = server_user_data.currentXP + random_xp;
    server_user_data.totalXP = server_user_data.totalXP + random_xp;
    user.lifetimeXP = user.lifetimeXP + random_xp;

    await server_user_data.save();
    await user.save();
  } catch (error) {
    console.error(`Failed to append ${random_xp} XP to ${message.author.id} on server ${message.guild.id}, XP did not change.`);
    throw error;
  }

  if ((server_user_data.currentXP + random_xp) > server_user_data.requiredXPForNextLevel) {
    const next_level = server_user_data.currentLevel + 1;

    let rewardsArray: RoleReward[] = [];
    let roleRewardsToGive: string[] = [];
    let roleRewardsToTake: string[] = [];

    let user_profile_picture = message.author.displayAvatarURL({ extension: 'webp' });
    let levelup_embed = new Discord.EmbedBuilder()
      .setColor(user.profileColor as ColorResolvable)
      .setAuthor({ name: `${message.author.username} leveled up!`, iconURL: user_profile_picture })
      .setTitle(`Level ${server_user_data.currentLevel}   \u{22D9}   **Level ${server_user_data.currentLevel + 1}**  \u{1F389}`)

    try {
      rewardsArray = server.roleRewardsString ? JSON.parse(server.roleRewardsString) : [];
      rewardsArray.forEach(reward => {
        if (reward.minLevel === next_level) { roleRewardsToGive.push(reward.roleID) };        // reward to give
        if (reward.maxLevel === next_level) { roleRewardsToTake.push(reward.roleID) };        // reward to remove
      })
    } catch {
      rewardsArray = [];
    }

    if (roleRewardsToGive.length > 0) {
      let rr_string = '';
      roleRewardsToGive.forEach((reward) => {
        message.member.roles.add(reward);
        rr_string = rr_string + `\u{2514} <@&${reward}>\n`;
      });
      levelup_embed.setFields({
        name: `Rewards:`,
        value: rr_string,
        inline: false
      });
    }

    if (roleRewardsToTake.length > 0) {
      roleRewardsToTake.forEach((reward) => {
        message.member.roles.remove(reward);
      })
    }

    await message.channel.send({ embeds: [levelup_embed] });

    server_user_data.set({
      currentLevel: server_user_data.currentLevel + 1,
      currentXP: 1,
      requiredXPForNextLevel: 5 * ((server_user_data.currentLevel + 1) ** 2) + (50 * (server_user_data.currentLevel + 1)) + 100   
      //  mee6 formula = 5 * (currLvl ^ 2) + (50 * currLvl) + 100, add - currXP at end to check how much xp needed still
    })
    await server_user_data.save();
    //   TO GET TOTAL XP FROM LEVEL 0 TO DESIRED LEVEL, DO AN INTEGRAL
  }
}

export default {
  name: Events.MessageCreate,

  async execute(message: Discord.Message) {
    if (message.author.bot) return;
    if (message.inGuild()) {
      messageOnGuild(message);
    } else {
      validateMessageInDM(message);
      message.reply({ content: 'Sorry, Orb is not yet able to do much in DMs. Check back later!' })
      return;
    }
  },
};