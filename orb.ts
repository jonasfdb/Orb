/*
  Orb - Startup Script
  Copyright (C) 2025 Jonas Frank de Buhr (jonasfdb)

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU Affero General Public License as published
  by the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU Affero General Public License for more details.

  You should have received a copy of the GNU Affero General Public License
  along with this program.  If not, see <https://www.gnu.org/licenses/>.

  To contact the author of this program, do so via one of these ways:
  - E-Mail: jonasdebuhr@gmail.com
  - Discord direct message: jonasfdb

  In accordance with the AGPL v3.0, all other source code files in this
  project will have a shortened version of this header.
*/

import Discord from "discord.js";
import fs from "fs";
import path from "path";
import { pathToFileURL, fileURLToPath } from "url";
import cron from "node-cron";
import { exec } from "child_process";
import { config } from "./config/config";
import { initDatabase } from "./src/util/database/dbinit";

// config data
const { token, dbURL } = config;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.join(__filename, '..');

const gatewayIntentList = new Discord.IntentsBitField();
gatewayIntentList.add(
  Discord.GatewayIntentBits.Guilds,
  Discord.GatewayIntentBits.GuildMessages,
  Discord.GatewayIntentBits.DirectMessages,
  Discord.GatewayIntentBits.GuildMembers,
);

console.log(`Starting...`)

const commands = []
const commands_folders_path = path.join(__dirname, 'src', 'commands');
const commands_folders = fs.readdirSync(commands_folders_path);

// ts interface to later add collection .commands to client is in /interfaces/client.d.ts
const client = new Discord.Client({
  intents: gatewayIntentList
})
client.commands = new Discord.Collection();

console.log(`Retrieving commands...`);

for(const folder of commands_folders) {
  const commands_path = path.join(commands_folders_path, folder);
  const commands_files = fs.readdirSync(commands_path).filter(file => file.endsWith('.ts') || file.endsWith('.mjs'));

  for(const file of commands_files) {
    const file_path = path.join(commands_path, file);

    if (file_path.includes('_command_base.ts')){
      // do not import command base
      break;
    }

    const command = await import(pathToFileURL(file_path).href)
      .then(module => module.default)

    if ('data' in command && 'execute' in command) {
      client.commands.set(command.data.name, command);
      commands.push(command.data.toJSON());
      console.log(`> Imported ${file_path}`);
    } else {
      console.warn(`Command at ${file_path} is missing properties`);
    }
  }
}

console.log(`Retrieving events...`)
const events_path = path.join(__dirname, 'src', 'events');
const events_files = fs.readdirSync(events_path).filter(file => file.endsWith('.ts') || file.endsWith('.mjs'));

for (const file of events_files) {
	const file_path = path.join(events_path, file);

  const event = await import(pathToFileURL(file_path).href)
    .then(module => module.default)

  if (file_path.includes('_event_base.ts')){
    // do not import event base
    break;
  }

	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));     //    ... means spread
	} else {
		client.on(event.name, (...args) => event.execute(...args));
	}

  console.log(`> Imported ${file_path}`);
};

// init database
await initDatabase();
console.log(`Logging in...`)

// Make daily database backups by exporting via pg_dump
// \*/1 * * *  for testing (runs command once per minute)
cron.schedule('0 0 * * *', () => {
  const db_backup_timestamp = "D" + new Date().toISOString().replace(/:/g, '-').slice(0, -8);
  const db_backup_filename = `backup_${db_backup_timestamp}.sql`;
  const db_backup_filepath = path.join(__dirname, "db_backup", db_backup_filename);

  const db_pgdump_command = `pg_dump -d "${dbURL}" -f "${db_backup_filepath}"`;

  exec(db_pgdump_command, (error, stdout, stderr) => {
    if (error) {
      console.trace('Error on database backup:', error);
    } else {
      console.warn('Database backup created successfully: ', db_backup_filename);
    }
  })

  try {
    const retention_days = 7  // how long to keep old files for, in days

    const backup_dir = path.join(__dirname, "db_backup")
    const files = fs.readdirSync(backup_dir);

    const current_date = new Date();

    for (const file of files) {
      if (file.startsWith('backup_') && file.endsWith('.sql')) {
        const timestamp_string_prototype = file.replace('backup_', '').replace('.sql', '');
        let timestamp = new Date(timestamp_string_prototype.split("T")[0].replace("D", "") + "T" + timestamp_string_prototype.split("T")[1].replace(/-/g, ':') + ":00.000Z");

        const millisecond_time_difference = current_date.getTime() - timestamp.getTime();   // getTime gets ms from date so it can be subtracted as number
        // const minute_time_difference = millisecond_time_difference / (1000 * 60) + 1;
        const days_time_difference = millisecond_time_difference / (1000 * 60 * 60 * 24);

        if (days_time_difference >= retention_days) {
          const filePath = path.join(backup_dir, file);
          fs.unlink(filePath, (error => {
            if (error) {
              console.trace(error)
            } else {
              console.warn(`Deleted old backup file: ${file}`);
            }
          }));
        }
      }
    }
  } catch (error) {
    console.trace('Error deleting old backup files:', error);
  }
});

// finally, log in once done with startup
client.login(token);
