import Discord from 'discord.js';
import { colors } from '../../util/json/colors';
import { emojis } from '../../util/json/emojis';

export async function outOfOrder(interaction: Discord.ChatInputCommandInteraction, reason: string) {
  const oooEmbed = new Discord.EmbedBuilder()
    .setColor(colors.color_warning)
    .setTitle(`${emojis.attention_emoji} - Out of order!`)
    .setDescription(
      `This feature is currently under maintenance, being reworked, or is otherwise not usable. `  +
      `Check the support server or the website for additional information.` +
      `\n\nReason: **${reason}**`
    )

  await interaction.reply({ embeds: [oooEmbed] });
  return;
}