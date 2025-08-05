// Orb - Event handler for messageCreate events
// Copyright (C) 2025 Jonas Frank de Buhr (jonasfdb)
// Licensed under the AGPL-3.0 license as laid out in LICENSE

import Discord, { ColorResolvable, Events, RoleResolvable } from "discord.js";
import { find_server_user, find_server, find_user } from "../util/database/dbutils";
import { ServerUser } from "../util/database/models/ServerUser.js";
import { GlobalUser } from "../util/database/models/GlobalUser.js";
import { validateMessageInDM, validateMessageInGuild } from "../util/validate";

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
    console.trace(error);
    return;
  }

  if (server_user_data.current_xp + random_xp > server_user_data.next_required_xp) {
    const next_level = server_user_data.current_level + 1;

    let rewardsArray;
    try {
      rewardsArray = server.role_rewards_level_string
        ? JSON.parse(server.role_rewards_level_string)
        : [];
    } catch {
      rewardsArray = [];
    }

    let role_reward_awarded = false;
    let role_reward_removed = false;
    let role_reward_given_id = '';
    let role_reward_taken_id = '';

    // find reward to give
    for (let i = 0; i < rewardsArray.length; i++) {
      const reward = rewardsArray[i];

      if (reward.min_level === next_level) {
        role_reward_given_id = reward.role_id;
        role_reward_awarded = true;
        break;
      }
    }

    // find reards to remove
    for (let i = 0; i < rewardsArray.length; i++) {
      const reward = rewardsArray[i];

      if (reward.max_level === next_level) {
        role_reward_taken_id = reward.role_id;
        role_reward_removed = true;
        break;
      }
    }

    if (role_reward_removed) {
      const role_to_remove = await message.guild.roles.fetch(role_reward_taken_id);
      if (role_to_remove) {
        await message.member.roles.remove(role_to_remove);
      }
    }

    if (role_reward_awarded) {
      const role_to_give = await message.guild.roles.fetch(role_reward_given_id);
      if (role_to_give) {
        await message.member.roles.add(role_to_give);
      }

      const user_profile_picture = message.author.displayAvatarURL({ extension: 'webp' });

      let levelup_embed = new Discord.EmbedBuilder()
        .setColor(user.profile_color as ColorResolvable)
        .setAuthor({ name: `${message.author.username} leveled up!`, iconURL: user_profile_picture })
        .setTitle(`Level ${server_user_data.current_level}   \u{22D9}   **Level ${server_user_data.current_level + 1}**  \u{1F389}`)
        .addFields({
          name: `Rewards:`,
          value: `\u{2514} <@&${role_reward_given_id}>`,
          inline: false
        })

      let role_reward = await message.guild.roles.fetch(role_reward_given_id);
      console.log(role_reward)

      try {
        await message.member.roles.add(role_reward as RoleResolvable);
      } catch (error) {
        console.trace(error)
      }

      try {
        await message.reply({ embeds: [levelup_embed] });
      } catch (error) {
        console.trace(error);
      }
    } else {
      const user_profile_picture = message.author.displayAvatarURL({ extension: 'webp' });

      let levelup_embed = new Discord.EmbedBuilder()
        .setColor(user.profile_color as ColorResolvable)
        .setAuthor({ name: `${message.author.username} leveled up!`, iconURL: user_profile_picture })
        .setTitle(`Level ${server_user_data.current_level}   \u{22D9}   **Level ${server_user_data.current_level + 1}**  \u{1F389}`)

      await message.channel.send({ embeds: [levelup_embed] });
    }

    server_user_data.set({
      current_level: server_user_data.current_level + 1,
      current_xp: 1,
      next_required_xp: 5 * ((server_user_data.current_level + 1) ** 2) + (50 * (server_user_data.current_level + 1)) + 100   
      //  mee6 formula = 5 * (currLvl ^ 2) + (50 * currLvl) + 100, add - currXP at end to check how much xp needed still
    })

    //   TO GET TOTAL XP FROM LEVEL 0 TO DESIRED LEVEL, DO AN INTEGRAL

    let levelup_success = await server_user_data.save();

    if (levelup_success.current_xp = 1) {
      console.log(`Leveled up user ${server_user_data.user_id} on server ${server_user_data.server_id}`);
    } else {
      console.log(`Levelup of ${server_user_data.user_id} on server ${server_user_data.server_id} has failed.`);
    }
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
      return;
    }
  },
};