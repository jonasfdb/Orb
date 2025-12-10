// Orb - Event handler for messageCreate events
// Copyright (C) 2025 Jonas Frank de Buhr (jonasfdb)
// Licensed under the AGPL-3.0 license as laid out in LICENSE

import Discord, { ColorResolvable, Events } from "discord.js";
import { findGuildMember, findUser, findGuild } from "../util/database/dbutils";
import { validateMessageInDM, validateMessageInGuild } from "../util/validate";
import { RoleReward } from "../types/interfaces";

async function messageOnGuild(message: Discord.Message): Promise<void> {
  validateMessageInGuild(message);
  const dbMember = await findGuildMember(message.author.id, message.guild.id);
  const dbGuild = await findGuild(message.guild.id);
  const dbUser = await findUser(message.author.id);

  const randomXP = Math.floor(Math.random() * 9) + 3; // Min 3, Max 12 (mee6 has max 30, this is to balance because orb has no cooldown)

  try {
    dbMember.currentXP = dbMember.currentXP + randomXP;
    dbMember.totalXP = dbMember.totalXP + randomXP;
    dbUser.lifetimeXP = dbUser.lifetimeXP + randomXP;

    await dbMember.save();
    await dbUser.save();
  } catch (error) {
    console.error(`Failed to append ${randomXP} XP to ${message.author.id} on server ${message.guild.id}, XP did not change.`);
    throw error;
  }

  if ((dbMember.currentXP + randomXP) > dbMember.requiredXPForNextLevel) {
    const nextLevel = dbMember.currentLevel + 1;

    let rewardsArray: RoleReward[] = [];
    let roleRewardsToGive: string[] = [];
    let roleRewardsToTake: string[] = [];

    let memberIcon = message.author.displayAvatarURL({ extension: 'webp' });
    let embLevelup = new Discord.EmbedBuilder()
      .setColor(dbUser.profileColor as ColorResolvable)
      .setAuthor({ name: `${message.author.username} leveled up!`, iconURL: memberIcon })
      .setTitle(`Level ${dbMember.currentLevel}   \u{22D9}   **Level ${dbMember.currentLevel + 1}**  \u{1F389}`)

    try {
      rewardsArray = dbGuild.roleRewardsString ? JSON.parse(dbGuild.roleRewardsString) : [];
      rewardsArray.forEach(reward => {
        if (reward.minLevel === nextLevel) { roleRewardsToGive.push(reward.roleID) };        // reward to give
        if (reward.maxLevel === nextLevel) { roleRewardsToTake.push(reward.roleID) };        // reward to remove
      })
    } catch {
      rewardsArray = [];
    }

    if (roleRewardsToGive.length > 0) {
      let rrString = '';
      roleRewardsToGive.forEach((reward) => {
        message.member.roles.add(reward);
        rrString = rrString + `\u{2514} <@&${reward}>\n`;
      });
      embLevelup.setFields({
        name: `Rewards:`,
        value: rrString,
        inline: false
      });
    }

    if (roleRewardsToTake.length > 0) {
      roleRewardsToTake.forEach((reward) => {
        message.member.roles.remove(reward);
      })
    }

    await message.channel.send({ embeds: [embLevelup] });

    dbMember.set({
      currentLevel: dbMember.currentLevel + 1,
      currentXP: 1,
      requiredXPForNextLevel: 5 * ((dbMember.currentLevel + 1) ** 2) + (50 * (dbMember.currentLevel + 1)) + 100   
      //  mee6 formula = 5 * (currLvl ^ 2) + (50 * currLvl) + 100, add - currXP at end to check how much xp needed still
    })
    await dbMember.save();
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