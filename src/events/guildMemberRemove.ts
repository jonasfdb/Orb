// Orb - Event handler for guildMemberRemove events
// Copyright (C) 2025 Jonas Frank de Buhr (jonasfdb)
// Licensed under the AGPL-3.0 license as laid out in LICENSE

import Discord, { Events } from "discord.js";
import { findGuildSettings } from "../util/database/dbutils";
import { colors } from "../../util/json/colors";

export default {
  name: Events.GuildMemberRemove,
  async execute(member: Discord.GuildMember) {
    let server = await findGuildSettings(member.guild.id);
    let left_user = member.user;
    let left_user_icon = left_user.displayAvatarURL({ extension: 'webp' }).toString();

    if (!server.channelsLeaveID || !server.leaveMessagesEnabled) {
      console.log(server.channelsLeaveID, server.leaveMessagesEnabled)
      return;
    }

    let leave_message_prototype = server.messagesLeave;
    let leave_message = leave_message_prototype.replace(/USER/g, left_user.username).replace(/SERVER/g, member.guild.name)

    const guild_member_leave_embed = new Discord.EmbedBuilder()
      .setColor(colors.default)
      .setAuthor({ name: `${left_user.username} left`, iconURL: left_user_icon })
      .setDescription(`${leave_message}`)
      .setFooter({ text: `Member count: ${member.guild.memberCount}` })

    const leave_message_channel = await member.guild.channels.cache.get(server.channelsLeaveID);
    if (leave_message_channel && leave_message_channel.isTextBased()) {
      await leave_message_channel.send({ embeds: [guild_member_leave_embed] });
    }
    // if no leave message, do nothing
    // console.log(`Member ${left_user.id} on server ${member.guild.id} left`);
  },
};
