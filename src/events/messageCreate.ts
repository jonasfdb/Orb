// Orb - Event handler for messageCreate events
// Copyright (C) 2025 Jonas Frank de Buhr (jonasfdb)
// Licensed under the AGPL-3.0 license as laid out in LICENSE

import Discord, { ColorResolvable, Events } from "discord.js";
import { find_server_user, find_server, find_user } from "../util/database/dbutils";
import { ServerUser } from "../util/database/models/ServerUser.js";
import { GlobalUser } from "../util/database/models/GlobalUser.js";
import { validateMessageInDM, validateMessageInGuild } from "../util/validate";
import { RoleReward } from "../types/interfaces";

async function messageOnGuild(message: Discord.Message): Promise<void> {
  validateMessageInGuild(message);
  const server_user_data = await find_server_user(message.author.id, message.guild.id);
  const server = await find_server(message.guild.id);
  const user = await find_user(message.author.id);

  const random_xp = Math.floor(Math.random() * 11) + 1; // Min 1, Max 12 (mee6 has max 30, this is to balance because orb has no cooldown)

  try {
    await ServerUser.update({
      current_xp: server_user_data.current_xp + random_xp,
      total_xp: server_user_data.total_xp + random_xp
    },
      { where: { user_id: message.author.id, server_id: message.guild.id } }
    );

    await GlobalUser.update({
      lifetime_xp: user.lifetime_xp + random_xp
    },
      { where: { user_id: message.author.id } }
    )
  } catch (error) {
    console.error(`Failed to append ${random_xp} XP to ${message.author.id} on server ${message.guild.id}, XP did not change.`);
    throw error;
  }

  if ((server_user_data.current_xp + random_xp) > server_user_data.next_required_xp) {
    const next_level = server_user_data.current_level + 1;

    let rewardsArray: RoleReward[] = [];
    let roleRewardsToGive: string[] = [];
    let roleRewardsToTake: string[] = [];

    let user_profile_picture = message.author.displayAvatarURL({ extension: 'webp' });
    let levelup_embed = new Discord.EmbedBuilder()
      .setColor(user.profile_color as ColorResolvable)
      .setAuthor({ name: `${message.author.username} leveled up!`, iconURL: user_profile_picture })
      .setTitle(`Level ${server_user_data.current_level}   \u{22D9}   **Level ${server_user_data.current_level + 1}**  \u{1F389}`)

    try {
      rewardsArray = server.role_rewards_level_string ? JSON.parse(server.role_rewards_level_string) : [];
      rewardsArray.forEach(reward => {
        if (reward.min_level === next_level) { roleRewardsToGive.push(reward.role_id) };        // reward to give
        if (reward.max_level === next_level) { roleRewardsToTake.push(reward.role_id) };        // reward to remove
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
      current_level: server_user_data.current_level + 1,
      current_xp: 1,
      next_required_xp: 5 * ((server_user_data.current_level + 1) ** 2) + (50 * (server_user_data.current_level + 1)) + 100   
      //  mee6 formula = 5 * (currLvl ^ 2) + (50 * currLvl) + 100, add - currXP at end to check how much xp needed still
    })

    //   TO GET TOTAL XP FROM LEVEL 0 TO DESIRED LEVEL, DO AN INTEGRAL
    await server_user_data.save();
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