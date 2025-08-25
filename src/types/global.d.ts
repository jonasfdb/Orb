// Orb - Client type interface
// Copyright (C) 2025 Jonas Frank de Buhr (jonasfdb)
// Licensed under the AGPL-3.0 license as laid out in LICENSE

import { Client, Collection } from 'discord.js';

declare module "discord.js" {
  interface Client {
    commands: Collection;
  }
}
