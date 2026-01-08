const { REST, Routes, SlashCommandBuilder } = require('discord.js');
require('dotenv').config();

const commands = [
  new SlashCommandBuilder()
    .setName('events')
    .setDescription('Show active and upcoming events'),
  new SlashCommandBuilder()
    .setName('eventsall')
    .setDescription('Show ALL events for today (debug)')
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log('Deploying commands...');
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );
    console.log('Commands deployed');
  } catch (err) {
    console.error(err);
  }
})();