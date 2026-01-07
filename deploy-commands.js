require('dotenv').config();
const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const commands = [
  new SlashCommandBuilder()
    .setName('events')
    .setDescription('Show ARC Raiders events for the next hours')
    .addIntegerOption(opt =>
      opt
        .setName('hours')
        .setDescription('How many hours ahead (default: 2)')
        .setMinValue(1)
        .setMaxValue(6)
    )
    .toJSON()
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log('Registering slash commands...');
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );
    console.log('Slash commands registered.');
  } catch (error) {
    console.error(error);
  }
})();