import Discord from "discord.js";

export default {
  data: new Discord.SlashCommandBuilder()
    .setName('configure')
    .setDescription('description'),

  async execute(client: Discord.Client<true>, interaction: Discord.ChatInputCommandInteraction) {
    // what the command will do
  }
}