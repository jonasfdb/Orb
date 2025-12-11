// Orb - Event handler for guildMemberRemove events
// Copyright (C) 2025 Jonas Frank de Buhr (jonasfdb)
// Licensed under the AGPL-3.0 license as laid out in LICENSE

import Discord, { Events } from "discord.js";
import { findGuildSettings } from "../util/database/dbutils";
import { colors } from "../../util/json/colors";

export default {
  name: Events.GuildMemberRemove,
  async execute(member: Discord.GuildMember) {
    let dbGuild = await findGuildSettings(member.guild.id);
    let userLeft = member.user;
    let userLeftIcon = userLeft.displayAvatarURL({ extension: 'webp' }).toString();

    if (!dbGuild.channelsLeaveID || !dbGuild.leaveMessagesEnabled) {
      console.log(dbGuild.channelsLeaveID, dbGuild.leaveMessagesEnabled)
      return;
    }

    let pLeaveMessage = dbGuild.messagesLeave;
    let leaveMessage = pLeaveMessage.replace(/USER/g, userLeft.username).replace(/SERVER/g, member.guild.name)

    const embMemberLeave = new Discord.EmbedBuilder()
      .setColor(colors.default)
      .setAuthor({ name: `${userLeft.username} left`, iconURL: userLeftIcon })
      .setDescription(`${leaveMessage}`)
      .setFooter({ text: `Member count: ${member.guild.memberCount}` })

    const messageChannel = member.guild.channels.cache.get(dbGuild.channelsLeaveID);
    if (messageChannel && messageChannel.isTextBased()) {
      await messageChannel.send({ embeds: [embMemberLeave] });
    }
    // if no leave message, do nothing
    // console.log(`Member ${left_user.id} on server ${member.guild.id} left`);
  },
};
