require('dotenv').config();
const { REST, Routes } = require('discord.js');

const commands = [
  // your slash commands here
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log('Deploying slash commands...');
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );
    console.log('Slash commands deployed successfully.');
    process.exit(0); // 👈 THIS IS THE KEY
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();