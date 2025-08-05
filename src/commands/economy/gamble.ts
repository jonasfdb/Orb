// Orb - Command for various gambling minigames, e.g. slot machine and coinflip
// Copyright (C) 2025 Jonas Frank de Buhr (jonasfdb)
// Licensed under the AGPL-3.0 license as laid out in LICENSE

import Discord from "discord.js";
import { emojis } from "../../util/emojis";
import { colors } from "../../util/colors";
import { find_server_user } from "../../util/database/dbutils";
import { validateCommandInteractionInGuild, validateInteractionCallbackResponse, validateNumber } from "../../util/validate";

interface UserCooldowns {
  daily: { uses_left: number, last_use_timestamp: number },
  coinflip: { uses_left: number, last_use_timestamp: number },
  slots: { uses_left: number, last_use_timestamp: number },
  highlow: { uses_left: number, last_use_timestamp: number }
}

export default {
  data: new Discord.SlashCommandBuilder()
    .setName("gamble")
    .setDescription("Gambling place holder command.")
    .addSubcommand((subcommand) => subcommand
      .setName('slots')
      .setDescription('Slotmachine placeholder')
      .addIntegerOption((option) => option
        .setName('bet')
        .setDescription('How much gems you wish to bet.')
        .setMinValue(10)
        .setMaxValue(10000)
        .setRequired(true)
      )
    )
    .addSubcommand((subcommand) => subcommand
      .setName('coinflip')
      .setDescription('Coinflip placeholder')
      .addIntegerOption((option) => option
        .setName('bet')
        .setDescription('How much gems you wish to bet.')
        .setMinValue(10)
        .setMaxValue(10000)
        .setRequired(true)
      )
      .addStringOption((option) => option
        .setName('coin')
        .setDescription('The side you think the coin lands on.')
        .addChoices(
          { name: 'Heads', value: 'heads' },
          { name: 'Tails', value: 'tails' }
        )
        .setRequired(true)
      )
    )
    .addSubcommand((subcommand) => subcommand
      .setName('high-low')
      .setDescription('Highlow placeholder')
      .addIntegerOption((option) => option
        .setName('bet')
        .setDescription('How much gems you wish to bet.')
        .setMinValue(10)
        .setMaxValue(10000)
        .setRequired(true)
      )
    ),

  async execute(client: Discord.Client<true>, interaction: Discord.ChatInputCommandInteraction) {
    validateCommandInteractionInGuild(interaction);

    let user = await find_server_user(interaction.user.id, interaction.guild.id);
    let user_cooldowns: UserCooldowns = JSON.parse(user.cooldowns);

    let coinflip_max_uses = 10;
    let coinflip_timeout_interval_ms = 1000 * 60 * 10;

    let slots_max_uses = 10;
    let slots_timeout_interval_ms = 1000 * 60 * 10;

    let highlow_max_uses = 5;
    let highlow_timeout_interval_ms = 1000 * 60 * 60 * 3;

    let bet;
    let uses_left;

    switch (interaction.options.getSubcommandGroup() || interaction.options.getSubcommand()) {
      case 'coinflip':
        bet = interaction.options.getInteger('bet');
        validateNumber(bet);

        if (bet > user.current_money) {
          await abort_game_no_funds('Coinflip');
          return;
        }

        if (user_cooldowns.coinflip.last_use_timestamp > (Date.now() - coinflip_timeout_interval_ms)) {
          await abort_game_timeout(user_cooldowns.coinflip.last_use_timestamp + coinflip_timeout_interval_ms - Date.now());
          return;
        } else {
          user_cooldowns.coinflip.uses_left = user_cooldowns.coinflip.uses_left - 1;
          await user.update({ cooldowns: JSON.stringify(user_cooldowns) });
          uses_left = user_cooldowns.coinflip.uses_left;

          if (user_cooldowns.coinflip.uses_left < 1) {
            user_cooldowns.coinflip.uses_left = coinflip_max_uses;
            user_cooldowns.coinflip.last_use_timestamp = Date.now();
            await user.update({ cooldowns: JSON.stringify(user_cooldowns) });
          }
        }

        let coinflip_result = (Math.floor(Math.random() * 2)) ? 'heads' : 'tails';
        if (coinflip_result === interaction.options.getString('coin')) {
          const emb_coinflip_result = new Discord.EmbedBuilder()
            .setColor(colors.color_default)
            .setTitle(`\u{1F389} - You won!`)
            .setDescription(`The coin landed on **${coinflip_result}**.\nYou won **${bet * 2}** ${emojis.currency_emoji}!`)
            .setFooter({ text: `${uses_left}/${coinflip_max_uses} uses left.` });
          await interaction.reply({ embeds: [emb_coinflip_result] });

          await user.update({ current_money: user.current_money + (bet * 2) });
        } else {
          const emb_coinflip_result = new Discord.EmbedBuilder()
            .setColor(colors.color_default)
            .setTitle(`\u{1FAC2} - You lost...`)
            .setDescription(`The coin landed on **${coinflip_result}**.\nYou lost **${bet}** ${emojis.currency_emoji}.`)
            .setFooter({ text: `${uses_left}/${coinflip_max_uses} uses left.` });
          await interaction.reply({ embeds: [emb_coinflip_result] });

          await user.update({ current_money: user.current_money - bet });
        }
        break;

      case 'slots':
        bet = interaction.options.getInteger('bet');
        validateNumber(bet);

        if (bet > user.current_money) {
          await abort_game_no_funds('Slots');
          return;
        }

        if (user_cooldowns.slots.last_use_timestamp > (Date.now() - slots_timeout_interval_ms)) {
          await abort_game_timeout(user_cooldowns.slots.last_use_timestamp + slots_timeout_interval_ms - Date.now());
          return;
        } else {
          user_cooldowns.slots.uses_left = user_cooldowns.slots.uses_left - 1;
          await user.update({ cooldowns: JSON.stringify(user_cooldowns) });
          uses_left = user_cooldowns.slots.uses_left;

          if (user_cooldowns.slots.uses_left < 1) {
            user_cooldowns.slots.uses_left = slots_max_uses;
            user_cooldowns.slots.last_use_timestamp = Date.now();
            await user.update({ cooldowns: JSON.stringify(user_cooldowns) });
          }
        }

        const symbols = [
          { emoji: emojis.red_gem, weight: 1000, multiplier: 2 },
          { emoji: emojis.blue_gem, weight: 475, multiplier: 10 },
          { emoji: emojis.green_gem, weight: 255, multiplier: 20 },
          { emoji: emojis.pink_gem, weight: 130, multiplier: 50 },
          { emoji: emojis.darkblue_gem, weight: 55, multiplier: 5000 }
        ];

        function pick_symbol_unweighted(): { emoji: string, weight: number, multiplier: number } {
          let r = Math.floor(Math.random() * 1000);
          let symbol: { emoji: string, weight: number, multiplier: number };

          if (r < symbols[4].weight) { symbol = symbols[4] }
          else if (r < symbols[3].weight) { symbol = symbols[3] }
          else if (r < symbols[2].weight) { symbol = symbols[2] }
          else if (r < symbols[1].weight) { symbol = symbols[1] }
          else { symbol = symbols[0] }

          return symbol;
        }

        const grid = Array.from({ length: 3 }, () => Array.from({ length: 3 }, () => pick_symbol_unweighted()));
        const midRow = grid[1];
        const allSame = midRow.every(s => s.emoji === midRow[0].emoji);

        let payout = 0;
        let title: string, desc: string;
        if (allSame) {
          const sym = midRow[0];
          payout = bet * sym.multiplier;
          if (sym.multiplier >= 1000) {  // jackpot
            title = '🎉 JACKPOT! 🎉';
            desc = `All three 🔷! You win **${payout}** ${emojis.currency_emoji}!`;
          } else {
            title = '🎉 You hit a match! 🎉';
            desc = `Three ${sym.emoji} = **${sym.multiplier}×** → you win **${payout}** ${emojis.currency_emoji}!`;
          }
        } else {
          title = '😢 No match...';
          desc = `Better luck next time. You lost **${bet}** ${emojis.currency_emoji}.`;
          payout = -bet;
        }

        let slots_embed = new Discord.EmbedBuilder()
          .setColor(colors.color_default)
          .setTitle(title)
          .setDescription(desc + `\n\n` +
            grid.map(row => row.map(s => s.emoji).join(' ')).join('\n') +
            `\n\n`)
          .setFooter({ text: `${uses_left}/${slots_max_uses} uses left.` })

        // 5) Reply and update money
        await interaction.reply({ embeds: [slots_embed] });
        await user.update({ current_money: user.current_money + payout });
        break;

      case 'high-low':
        bet = interaction.options.getInteger('bet');
        validateNumber(bet);

        if (bet > user.current_money) {
          await abort_game_no_funds('High-low');
          return;
        }

        if (user_cooldowns.highlow.last_use_timestamp > (Date.now() - highlow_timeout_interval_ms)) {
          await abort_game_timeout(user_cooldowns.highlow.last_use_timestamp + highlow_timeout_interval_ms - Date.now());
          return;
        } else {
          user_cooldowns.highlow.uses_left = user_cooldowns.highlow.uses_left - 1;
          await user.update({ cooldowns: JSON.stringify(user_cooldowns) });
          uses_left = user_cooldowns.highlow.uses_left;

          if (user_cooldowns.highlow.uses_left < 1) {
            user_cooldowns.highlow.uses_left = highlow_max_uses;
            user_cooldowns.highlow.last_use_timestamp = Date.now();
            await user.update({ cooldowns: JSON.stringify(user_cooldowns) });
          }
        }

        let highlow_multiplier = 1;
        let highlow_iteration = 0;
        let highlow_last_numbers = [];
        let highlow_continue = true;

        let highlow_random_number = Math.floor(Math.random() * 100);
        highlow_last_numbers.push(highlow_random_number);

        const btn_highlow_start = new Discord.ButtonBuilder()
          .setCustomId('begin')
          .setLabel('Begin!')
          .setStyle(Discord.ButtonStyle.Primary);

        const row_highlow_start = new Discord.ActionRowBuilder<Discord.ButtonBuilder>().addComponents(btn_highlow_start);

        const emb_highlow_start = new Discord.EmbedBuilder()
          .setTitle(`Higher or Lower?`)
          .setDescription(
            `Guess if the number I am thinking of is higher or lower than the previous one!\n\n` +
            `Your bet **doubles** each time you guess right, and you can chicken out at any time. ` +
            `If you guess right, you can win big! But if you guess wrong, **you lose the entire bet!**\n\n` +
            `The number we start with is... **${highlow_random_number}**!\n\n` +
            `Multiplier: ${highlow_multiplier}x -> Cash out ${bet * highlow_multiplier} ${emojis.currency_emoji}`
          )
          .setColor(colors.color_default)
          .setFooter({ text: `${uses_left}/${highlow_max_uses} uses left.` });

        let highlow_start_message = await interaction.reply({ embeds: [emb_highlow_start], components: [row_highlow_start], withResponse: true });
        validateInteractionCallbackResponse(highlow_start_message);

        try {
          const collectorFilter = (i: Discord.MessageComponentInteraction) => i.user.id === interaction.user.id;
          const highlow_confirmation = await highlow_start_message.resource.message.awaitMessageComponent({ filter: collectorFilter, time: 1000 * 60 });

          await interaction.deleteReply();

          if (highlow_confirmation.customId === 'begin') {
            await highlow_confirmation.deferReply();
            while (highlow_continue) {
              highlow_random_number = Math.floor(Math.random() * 100);
              while (highlow_random_number === highlow_last_numbers[highlow_iteration]) {
                highlow_random_number = Math.floor(Math.random() * 100);
              }

              const btn_higher = new Discord.ButtonBuilder()
                .setCustomId('higher')
                .setLabel('Higher')
                .setStyle(Discord.ButtonStyle.Success);

              const btn_lower = new Discord.ButtonBuilder()
                .setCustomId('lower')
                .setLabel('Lower')
                .setStyle(Discord.ButtonStyle.Danger);


              const btn_cashout = new Discord.ButtonBuilder()
                .setCustomId('cashout')
                .setLabel('Chicken Out')
                .setStyle(Discord.ButtonStyle.Secondary);

              const row_highlow = new Discord.ActionRowBuilder<Discord.ButtonBuilder>().addComponents(btn_higher, btn_lower, btn_cashout);

              const emb_highlow_game = new Discord.EmbedBuilder()
                .setTitle(`Higher or Lower?`)
                .setDescription(
                  `I am thinking of a number. Is it **lower** or **higher** than ${highlow_last_numbers[highlow_iteration]}?\n\n` +
                  `Previous: **${highlow_last_numbers.join(` > `)} > ...**\nYou guessed right ${highlow_iteration} times.\n\n` +
                  `Multiplier: ${highlow_multiplier}x -> Cash out ${bet * highlow_multiplier} ${emojis.currency_emoji}`
                )
                .setColor(colors.color_default)
                .setFooter({ text: `${uses_left}/${highlow_max_uses} uses left.` });

              let highlow_response = await highlow_confirmation.editReply({ embeds: [emb_highlow_game], components: [row_highlow] });
              // console.log(highlow_response);

              try {
                const collectorFilter = (i: Discord.MessageComponentInteraction) => i.user.id === interaction.user.id;
                const highlow_user_guess = await highlow_response.awaitMessageComponent({ filter: collectorFilter, time: 1000 * 60 });
                highlow_user_guess.deferUpdate();

                if ((highlow_user_guess.customId === 'higher' && (highlow_random_number > highlow_last_numbers[highlow_iteration])) ||
                  (highlow_user_guess.customId === 'lower' && (highlow_random_number < highlow_last_numbers[highlow_iteration]))
                ) {
                  // the user guesses right here, nothing happens, just restart the loop
                } else if (highlow_user_guess.customId === 'cashout') {
                  console.log("cashout");
                  highlow_continue = false;

                  const emb_highlow_cashout = new Discord.EmbedBuilder()
                    .setTitle(`You chickened out!`)
                    .setDescription(
                      `You multiplier was **${highlow_multiplier}x**, so you win **${bet * highlow_multiplier}** ${emojis.currency_emoji}!\n\n` +
                      `Numbers: **${highlow_last_numbers.join(` > `)}**\nYou had ${highlow_iteration} correct guesses.`
                    )
                    .setColor(colors.color_success)
                    .setFooter({ text: `${uses_left}/${highlow_max_uses} uses left.` });

                  await user.update({ current_money: user.current_money + (bet * highlow_multiplier) });

                  await highlow_confirmation.editReply({ embeds: [emb_highlow_cashout], components: [] });
                } else {
                  console.log("LOSER")
                  highlow_continue = false;

                  const emb_highlow_loss = new Discord.EmbedBuilder()
                    .setTitle(`You lost!`)
                    .setDescription(
                      `Oh no! You guessed wrong! My number was **${highlow_random_number}**.\n\n` +
                      `You multiplier was **${highlow_multiplier}x**, so you lose **${bet * highlow_multiplier}** ${emojis.currency_emoji}...\n\n` +
                      `Numbers: **${highlow_last_numbers.join(` > `)} > ${highlow_random_number}**\nYou had ${highlow_iteration} correct guesses.`
                    )
                    .setColor(colors.color_error)
                    .setFooter({ text: `${uses_left}/${highlow_max_uses} uses left.` });

                  await highlow_confirmation.editReply({ embeds: [emb_highlow_loss], components: [] });

                  if (user.current_money < (bet * highlow_multiplier)) {
                    await user.update({ current_money: 0 });
                  } else {
                    await user.update({ current_money: user.current_money - (bet * highlow_multiplier) });
                  }
                }
              } catch (error) {
                console.error(error);
              }

              highlow_last_numbers.push(highlow_random_number);
              highlow_multiplier = highlow_multiplier + highlow_multiplier;
              highlow_iteration++;
            }
          }
        } catch (error) {
          console.error(error)
        }
        break;
    }

    async function abort_game_no_funds(game: string) {
      const emb_game_abort = new Discord.EmbedBuilder()
        .setColor(colors.color_error)
        .setTitle(`${emojis.failure_emoji} - No funds!`)
        .setDescription(`You can't bet more gems than you actually have!`)

      await interaction.reply({ embeds: [emb_game_abort] });
    }

    async function abort_game_timeout(remaining_time: number) {
      let hours = Math.floor(remaining_time / 3600000) % 24;
      let minutes = Math.floor(remaining_time / 60000) % 60;
      let seconds = Math.floor(remaining_time / 1000) % 60;

      const timestring = `${hours}h ${minutes}m ${seconds}s`;

      const emb_game_abort = new Discord.EmbedBuilder()
        .setColor(colors.color_error)
        .setTitle(`${emojis.failure_emoji} - Gambled too much!`)
        .setDescription(`Please wait **${timestring}** until you can play this game again.`)

      await interaction.reply({ embeds: [emb_game_abort] });
    }
  }
}
