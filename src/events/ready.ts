// Orb - Event handler for when the client is ready
// Copyright (C) 2025 Jonas Frank de Buhr (jonasfdb)
// Licensed under the AGPL-3.0 license as laid out in LICENSE

import { ActivityType, Client, Events } from "discord.js";

export default {
	name: Events.ClientReady,
	once: true,

	async execute(client: Client<true>) {
		client.user!.setPresence({ status: "online", activities: [{ name: 'existence', type: ActivityType.Competing }] });
		console.warn(`Startup successful! Bot is ready!`);
	},
};