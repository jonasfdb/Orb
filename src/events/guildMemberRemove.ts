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

    let pLeaveMessage = server.messagesLeave;
    let leaveMessage = pLeaveMessage.replace(/USER/g, left_user.username).replace(/SERVER/g, member.guild.name)

    const embMemberLeave = new Discord.EmbedBuilder()
      .setColor(colors.default)
      .setAuthor({ name: `${left_user.username} left`, iconURL: left_user_icon })
      .setDescription(`${leaveMessage}`)
      .setFooter({ text: `Member count: ${member.guild.memberCount}` })

    const messageChannel = member.guild.channels.cache.get(server.channelsLeaveID);
    if (messageChannel && messageChannel.isTextBased()) {
      await messageChannel.send({ embeds: [embMemberLeave] });
    }
    // if no leave message, do nothing
    // console.log(`Member ${left_user.id} on server ${member.guild.id} left`);
  },
};
