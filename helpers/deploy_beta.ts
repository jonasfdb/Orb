// Orb - Script to deploy commands to a test server
// Copyright (C) 2025 Jonas Frank de Buhr (jonasfdb)
// Licensed under the AGPL-3.0 license as laid out in LICENSE

import { REST, Routes } from "discord.js";
import { config } from "../config/config.js";
import { pathToFileURL, fileURLToPath } from "url";
import fs from "fs"
import path from "path";

const { clientId, token, testGuildId } = config;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.join(__filename, '..');

const rest = new REST().setToken(token as string);

const commands_folders_path = path.join(__dirname, '../src/commands');
const commands_folders = fs.readdirSync(commands_folders_path);
let commands: any[] = [];

for (const folder of commands_folders) {
  const commands_path = path.join(commands_folders_path, folder);
  const commands_files = fs.readdirSync(commands_path).filter(file => file.endsWith('.ts'));

  for (const file of commands_files) {
    const file_path = path.join(commands_path, file);
    const command = await import(pathToFileURL(file_path).href).then(module => module.default);

    if ('data' in command && 'execute' in command) {
      commands.push(command.data.toJSON())
    } else {
      console.error(`Command at ${file_path} is missing data or execute property!`)
    }

    console.log(file_path);
  }
}

try {
  console.log(`Refreshing ${commands.length} commands...`);
  //  commands = []   // uncomment to delete all commands
  const data: any = await rest.put(Routes.applicationGuildCommands(clientId as string, testGuildId as string), { body: commands });
  console.warn(`Successfully reloaded ${data.length} application commands.`);
} catch (error) {
  console.trace(error);
};
