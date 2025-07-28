// Orb - TypeScript assertive functions and type checkers as well as other validation functions
// Copyright (C) 2025 Jonas Frank de Buhr (jonasfdb)
// Licensed under the AGPL-3.0 license as laid out in LICENSE

import Discord from "discord.js";

export function validateClientReady(client: Discord.Client): asserts client is Discord.Client<true> {
  if(!client.isReady()) {
    throw new Error(`Client not ready!`);
  }
}

export function validateCommandInteractionInGuild(interaction: Discord.CommandInteraction): asserts interaction is Discord.CommandInteraction & {
  guild: Discord.Guild;
  member: Discord.GuildMember;
  channel: Discord.GuildChannel;
  isRepliable: true;
} {
  if (!interaction.guild || !interaction.member || !interaction.channel) {
    throw new Error('Guild, member, or channel missing.');
  }

  if (interaction.channel.isDMBased() || !interaction.inGuild()) {
    throw new Error('Command must be used on server.')
  }

  if (!interaction.isRepliable()) {
    throw new Error('Interaction is not repliable.')
  }
}

export function validateCommandInteractionInDM(interaction: Discord.CommandInteraction): asserts interaction is Discord.CommandInteraction & {
  member: Discord.GuildMember;
  channel: Discord.TextBasedChannel;
  isRepliable: true;
} {
  if (!interaction.member || !interaction.channel) {
    throw new Error('Guild, member, or channel missing.');
  }

  if (!interaction.channel.isDMBased()) {
    throw new Error('Command must be used in DMs.');
  }

  if (!interaction.isRepliable()) {
    throw new Error('Interaction is not repliable.')
  }
}

export function validateMessageInGuild(message: Discord.Message): asserts message is Discord.Message<true> & {
  member: Discord.GuildMember
} {
  if (!message.guild || !message.member || !message.channel) {
    throw new Error('Guild, member, or channel missing.');
  }

  if (message.channel.isDMBased() || !message.inGuild()) {
    throw new Error('Message expected to be on server, got something else.')
  }
}

export function validateMessageInDM(message: Discord.Message): asserts message is Discord.Message<false> {
  if (!message.member || !message.channel) {
    throw new Error('Member or channel missing.');
  }

  if (!message.channel.isDMBased() || message.inGuild()) {
    throw new Error('Message expected to be in DM, got something else.')
  }
}

export function validateInteractionCallbackResponse(interactionCallback: Discord.InteractionCallbackResponse): asserts interactionCallback is Discord.InteractionCallbackResponse & {
  interaction: Discord.InteractionCallback,
  resource: Discord.InteractionCallbackResource & {
    message: Discord.Message,
  }
} {
  if (!interactionCallback || !interactionCallback.interaction || !interactionCallback.resource) {
    throw new Error('Expected InteractionCallbackResponse, got something else or has missing properties.')
  }

  if (!interactionCallback.resource?.message) {
    throw new Error('InnteractionCallbackResponse is missing properties in its resources.')
  }
}

export function validateGuildMember(member: unknown): asserts member is Discord.GuildMember {
  if (!member || !(member instanceof Discord.GuildMember)) {
    throw new Error("Expected GuildMember, got something else.");
  }
}

export function validateGuildTextChannel(channel: unknown): asserts channel is Discord.GuildTextBasedChannel {
  if (!channel || !(channel instanceof Discord.TextChannel || channel instanceof Discord.NewsChannel || channel instanceof Discord.ThreadChannel)) {
      throw new Error('Expected GuildTextBasedChannel, got something else.')
    }
}

export function validateGuildVoiceChannel(channel: unknown): asserts channel is Discord.VoiceBasedChannel {
  if (!channel || !(channel instanceof Discord.VoiceChannel)) {
    throw new Error("Expected VoiceBasedChannel, got something else.");
  }
}

export function validateGuildChannel(channel: unknown): asserts channel is Discord.GuildChannel {
  if (!channel || !(channel instanceof Discord.GuildChannel)) {
    throw new Error("Expected GuildChannel, got something else.");
  }
}

export function validateRole(role: unknown): asserts role is Discord.Role {
  if (!role || !(role instanceof Discord.Role)) {
    throw new Error('Expected Role, got something else.')
  }
}

export function validateNumber(number: unknown): asserts number is number {
  if (!number || typeof number !== 'number') {
    throw new Error("Expected Number, got something else.")
  }
}

export function validateString(string: unknown): asserts string is string {
  if (!string || typeof string !== 'string') {
    throw new Error('Expected String, got something else.')
  }
}
