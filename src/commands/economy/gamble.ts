// Orb - Command for various gambling minigames, e.g. slot machine and coinflip
// Copyright (C) 2025 Jonas Frank de Buhr (jonasfdb)
// Licensed under the AGPL-3.0 license as laid out in LICENSE

import Discord from "discord.js";
import { emojis } from "../../../util/json/emojis";
import { colors } from "../../../util/json/colors";
import { findGuildMember } from "../../util/database/dbutils";
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

    let dbGuildMember = await findGuildMember(interaction.user.id, interaction.guild.id);
    let userCooldowns: UserCooldowns = JSON.parse(dbGuildMember.cooldowns);

    let maxUsesCoinflip = 10;
    let timeoutIntervalCoinflip = 1000 * 60 * 10; // in ms

    let maxUsesSlots = 10;
    let timeoutIntervalSlots = 1000 * 60 * 10;

    let maxUsesHighlow = 5;
    let timeoutIntervalHighlow = 1000 * 60 * 60 * 3;

    let bet;
    let usesLeft;

    switch (interaction.options.getSubcommandGroup() || interaction.options.getSubcommand()) {
      case 'coinflip':
        bet = interaction.options.getInteger('bet');
        validateNumber(bet);

        if (bet > dbGuildMember.currentMoney) {
          await abortGameNoFunds('Coinflip');
          return;
        }

        if (userCooldowns.coinflip.last_use_timestamp > (Date.now() - timeoutIntervalCoinflip)) {
          await abortGameTimeout(userCooldowns.coinflip.last_use_timestamp + timeoutIntervalCoinflip - Date.now());
          return;
        } else {
          userCooldowns.coinflip.uses_left = userCooldowns.coinflip.uses_left - 1;
          await dbGuildMember.update({ cooldowns: JSON.stringify(userCooldowns) });
          usesLeft = userCooldowns.coinflip.uses_left;

          if (userCooldowns.coinflip.uses_left < 1) {
            userCooldowns.coinflip.uses_left = maxUsesCoinflip;
            userCooldowns.coinflip.last_use_timestamp = Date.now();
            await dbGuildMember.update({ cooldowns: JSON.stringify(userCooldowns) });
          }
        }

        let coinflipResult = (Math.floor(Math.random() * 2)) ? 'heads' : 'tails';
        if (coinflipResult === interaction.options.getString('coin')) {
          const embCoinflip = new Discord.EmbedBuilder()
            .setColor(colors.default)
            .setTitle(`\u{1F389} - You won!`)
            .setDescription(`The coin landed on **${coinflipResult}**.\nYou won **${bet * 2}** ${emojis.currency}!`)
            .setFooter({ text: `${usesLeft}/${maxUsesCoinflip} uses left.` });
          await interaction.reply({ embeds: [embCoinflip] });

          await dbGuildMember.update({ currentMoney: dbGuildMember.currentMoney + (bet * 2) });
        } else {
          const embCoinflip = new Discord.EmbedBuilder()
            .setColor(colors.default)
            .setTitle(`\u{1FAC2} - You lost...`)
            .setDescription(`The coin landed on **${coinflipResult}**.\nYou lost **${bet}** ${emojis.currency}.`)
            .setFooter({ text: `${usesLeft}/${maxUsesCoinflip} uses left.` });
          await interaction.reply({ embeds: [embCoinflip] });

          await dbGuildMember.update({ currentMoney: dbGuildMember.currentMoney - bet });
        }
        break;

      case 'slots':
        bet = interaction.options.getInteger('bet');
        validateNumber(bet);

        if (bet > dbGuildMember.currentMoney) {
          await abortGameNoFunds('Slots');
          return;
        }

        if (userCooldowns.slots.last_use_timestamp > (Date.now() - timeoutIntervalSlots)) {
          await abortGameTimeout(userCooldowns.slots.last_use_timestamp + timeoutIntervalSlots - Date.now());
          return;
        } else {
          userCooldowns.slots.uses_left = userCooldowns.slots.uses_left - 1;
          await dbGuildMember.update({ cooldowns: JSON.stringify(userCooldowns) });
          usesLeft = userCooldowns.slots.uses_left;

          if (userCooldowns.slots.uses_left < 1) {
            userCooldowns.slots.uses_left = maxUsesSlots;
            userCooldowns.slots.last_use_timestamp = Date.now();
            await dbGuildMember.update({ cooldowns: JSON.stringify(userCooldowns) });
          }
        }

        const symbols = [
          { emoji: emojis.gemRed, weight: 1000, multiplier: 2 },
          { emoji: emojis.gemBlue, weight: 475, multiplier: 10 },
          { emoji: emojis.gemGreen, weight: 255, multiplier: 20 },
          { emoji: emojis.gemPink, weight: 130, multiplier: 50 },
          { emoji: emojis.gemDarkBlue, weight: 55, multiplier: 5000 }
        ];

        function pickSymbolUnweighted(): { emoji: string, weight: number, multiplier: number } {
          let r = Math.floor(Math.random() * 1000);
          let symbol: { emoji: string, weight: number, multiplier: number };

          if (r < symbols[4].weight) { symbol = symbols[4] }
          else if (r < symbols[3].weight) { symbol = symbols[3] }
          else if (r < symbols[2].weight) { symbol = symbols[2] }
          else if (r < symbols[1].weight) { symbol = symbols[1] }
          else { symbol = symbols[0] }

          return symbol;
        }

        const grid = Array.from({ length: 3 }, () => Array.from({ length: 3 }, () => pickSymbolUnweighted()));
        const midRow = grid[1];
        const allSame = midRow.every(s => s.emoji === midRow[0].emoji);

        let payout = 0;
        let title: string, embedText: string;
        if (allSame) {
          const symbol = midRow[0];
          payout = bet * symbol.multiplier;
          if (symbol.multiplier >= 1000) {  // jackpot
            title = '🎉 JACKPOT! 🎉';
            embedText = `You win **${payout}** ${emojis.currency}!`;
          } else {
            title = '🎉 You hit a match! 🎉';
            embedText = `Three ${symbol.emoji} = **${symbol.multiplier}×** → you win **${payout}** ${emojis.currency}!`;
          }
        } else {
          title = 'None match...';
          embedText = `Better luck next time. You lost **${bet}** ${emojis.currency}.`;
          payout = -bet;
        }

        let embSlots = new Discord.EmbedBuilder()
          .setColor(colors.default)
          .setTitle(title)
          .setDescription(embedText + `\n\n` +
            grid.map(row => row.map(s => s.emoji).join(' ')).join('\n') +
            `\n\n`)
          .setFooter({ text: `${usesLeft}/${maxUsesSlots} uses left.` })

        // 5) Reply and update money
        await interaction.reply({ embeds: [embSlots] });
        await dbGuildMember.update({ currentMoney: dbGuildMember.currentMoney + payout });
        break;

      case 'high-low':
        bet = interaction.options.getInteger('bet');
        validateNumber(bet);

        if (bet > dbGuildMember.currentMoney) {
          await abortGameNoFunds('High-low');
          return;
        }

        if (userCooldowns.highlow.last_use_timestamp > (Date.now() - timeoutIntervalHighlow)) {
          await abortGameTimeout(userCooldowns.highlow.last_use_timestamp + timeoutIntervalHighlow - Date.now());
          return;
        } else {
          userCooldowns.highlow.uses_left = userCooldowns.highlow.uses_left - 1;
          await dbGuildMember.update({ cooldowns: JSON.stringify(userCooldowns) });
          usesLeft = userCooldowns.highlow.uses_left;

          if (userCooldowns.highlow.uses_left < 1) {
            userCooldowns.highlow.uses_left = maxUsesHighlow;
            userCooldowns.highlow.last_use_timestamp = Date.now();
            await dbGuildMember.update({ cooldowns: JSON.stringify(userCooldowns) });
          }
        }

        let highlowMultiplier = 1;
        let highlowIteration = 0;
        let highlowPreviousNumbers = [];
        let highlowAllowedToContinue = true;

        let highlowNextNumber = Math.floor(Math.random() * 100);
        highlowPreviousNumbers.push(highlowNextNumber);

        const btnHighlowBegin = new Discord.ButtonBuilder()
          .setCustomId('begin')
          .setLabel('Begin!')
          .setStyle(Discord.ButtonStyle.Primary);

        const highlowBeginRow = new Discord.ActionRowBuilder<Discord.ButtonBuilder>().addComponents(btnHighlowBegin);

        const embHighlowBegin = new Discord.EmbedBuilder()
          .setTitle(`Higher or Lower?`)
          .setDescription(
            `Guess if the number I am thinking of is higher or lower than the previous one!\n\n` +
            `Your bet **doubles** each time you guess right, and you can chicken out at any time. ` +
            `If you guess right, you can win big! But if you guess wrong, **you lose the entire bet!**\n\n` +
            `The number we start with is... **${highlowNextNumber}**!\n\n` +
            `Multiplier: ${highlowMultiplier}x -> Cash out ${bet * highlowMultiplier} ${emojis.currency}`
          )
          .setColor(colors.default)
          .setFooter({ text: `${usesLeft}/${maxUsesHighlow} uses left.` });

        let highlowStartMessage = await interaction.reply({ embeds: [embHighlowBegin], components: [highlowBeginRow], withResponse: true });
        validateInteractionCallbackResponse(highlowStartMessage);

        try {
          const collectorFilter = (i: Discord.MessageComponentInteraction) => i.user.id === interaction.user.id;
          const highlowConfirm = await highlowStartMessage.resource.message.awaitMessageComponent({ filter: collectorFilter, time: 1000 * 60 });

          await interaction.deleteReply();

          if (highlowConfirm.customId === 'begin') {
            await highlowConfirm.deferReply();
            while (highlowAllowedToContinue) {
              highlowNextNumber = Math.floor(Math.random() * 100);
              while (highlowNextNumber === highlowPreviousNumbers[highlowIteration]) {
                highlowNextNumber = Math.floor(Math.random() * 100);
              }

              const btnHighlowHigher = new Discord.ButtonBuilder()
                .setCustomId('higher')
                .setLabel('Higher')
                .setStyle(Discord.ButtonStyle.Success);

              const btnHighlowLower = new Discord.ButtonBuilder()
                .setCustomId('lower')
                .setLabel('Lower')
                .setStyle(Discord.ButtonStyle.Danger);


              const btnChicken = new Discord.ButtonBuilder()
                .setCustomId('cashout')
                .setLabel('Chicken Out')
                .setStyle(Discord.ButtonStyle.Secondary);

              const highlowGameRow = new Discord.ActionRowBuilder<Discord.ButtonBuilder>().addComponents(btnHighlowHigher, btnHighlowLower, btnChicken);

              const embHighlowGame = new Discord.EmbedBuilder()
                .setTitle(`Higher or Lower?`)
                .setDescription(
                  `I am thinking of a number. Is it **lower** or **higher** than ${highlowPreviousNumbers[highlowIteration]}?\n\n` +
                  `Previous: **${highlowPreviousNumbers.join(` > `)} > ...**\nYou guessed right ${highlowIteration} times.\n\n` +
                  `Multiplier: ${highlowMultiplier}x -> Cash out ${bet * highlowMultiplier} ${emojis.currency}`
                )
                .setColor(colors.default)
                .setFooter({ text: `${usesLeft}/${maxUsesHighlow} uses left.` });

              let highlowResponse = await highlowConfirm.editReply({ embeds: [embHighlowGame], components: [highlowGameRow] });
              // console.log(highlow_response);

              try {
                const collectorFilter = (i: Discord.MessageComponentInteraction) => i.user.id === interaction.user.id;
                const highlowUserGuess = await highlowResponse.awaitMessageComponent({ filter: collectorFilter, time: 1000 * 60 });
                highlowUserGuess.deferUpdate();

                if ((highlowUserGuess.customId === 'higher' && (highlowNextNumber > highlowPreviousNumbers[highlowIteration])) ||
                  (highlowUserGuess.customId === 'lower' && (highlowNextNumber < highlowPreviousNumbers[highlowIteration]))
                ) {
                  // the user guesses right here, nothing happens, just restart the loop
                } else if (highlowUserGuess.customId === 'cashout') {
                  console.log("cashout");
                  highlowAllowedToContinue = false;

                  const embHighlowChicken = new Discord.EmbedBuilder()
                    .setTitle(`You chickened out!`)
                    .setDescription(
                      `You multiplier was **${highlowMultiplier}x**, so you win **${bet * highlowMultiplier}** ${emojis.currency}!\n\n` +
                      `Numbers: **${highlowPreviousNumbers.join(` > `)}**\nYou had ${highlowIteration} correct guesses.`
                    )
                    .setColor(colors.success)
                    .setFooter({ text: `${usesLeft}/${maxUsesHighlow} uses left.` });

                  await dbGuildMember.update({ currentMoney: dbGuildMember.currentMoney + (bet * highlowMultiplier) });

                  await highlowConfirm.editReply({ embeds: [embHighlowChicken], components: [] });
                } else {
                  console.log("LOSER")
                  highlowAllowedToContinue = false;

                  const embHighlowLoss = new Discord.EmbedBuilder()
                    .setTitle(`You lost!`)
                    .setDescription(
                      `Oh no! You guessed wrong! My number was **${highlowNextNumber}**.\n\n` +
                      `You multiplier was **${highlowMultiplier}x**, so you lose **${bet * highlowMultiplier}** ${emojis.currency}...\n\n` +
                      `Numbers: **${highlowPreviousNumbers.join(` > `)} > ${highlowNextNumber}**\nYou had ${highlowIteration} correct guesses.`
                    )
                    .setColor(colors.error)
                    .setFooter({ text: `${usesLeft}/${maxUsesHighlow} uses left.` });

                  await highlowConfirm.editReply({ embeds: [embHighlowLoss], components: [] });

                  if (dbGuildMember.currentMoney < (bet * highlowMultiplier)) {
                    await dbGuildMember.update({ currentMoney: 0 });
                  } else {
                    await dbGuildMember.update({ currentMoney: dbGuildMember.currentMoney - (bet * highlowMultiplier) });
                  }
                }
              } catch (error) {
                console.error(error);
              }

              highlowPreviousNumbers.push(highlowNextNumber);
              highlowMultiplier = highlowMultiplier + highlowMultiplier;
              highlowIteration++;
            }
          }
        } catch (error) {
          throw error;
        }
        break;
    }

    async function abortGameNoFunds(game: string) {
      const embGameAbort = new Discord.EmbedBuilder()
        .setColor(colors.error)
        .setTitle(`${emojis.cross} - No funds!`)
        .setDescription(`You can't bet more gems than you actually have!`)

      await interaction.reply({ embeds: [embGameAbort] });
    }

    async function abortGameTimeout(remaining_time: number) {
      let hours = Math.floor(remaining_time / 3600000) % 24;
      let minutes = Math.floor(remaining_time / 60000) % 60;
      let seconds = Math.floor(remaining_time / 1000) % 60;

      const timestring = `${hours}h ${minutes}m ${seconds}s`;

      const embGameAbort = new Discord.EmbedBuilder()
        .setColor(colors.error)
        .setTitle(`${emojis.cross} - Gambled too much!`)
        .setDescription(`Please wait **${timestring}** until you can play this game again.`)

      await interaction.reply({ embeds: [embGameAbort] });
    }
  }
}
