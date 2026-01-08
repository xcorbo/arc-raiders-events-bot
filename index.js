const { Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
require('dotenv').config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const schedule = JSON.parse(
  fs.readFileSync('./schedule.json', 'utf8')
);

function groupByMap(events) {
  const grouped = {};
  for (const event of events) {
    if (!grouped[event.map]) grouped[event.map] = [];
    grouped[event.map].push(event);
  }
  return grouped;
}

function formatEvent(event, now) {
  const started = event.start <= now;
  const startTag = `<t:${event.start}:R>`;
  const endTag = `<t:${event.end}:R>`;

  if (started) {
    return `- ${event.name} -> started ${startTag}, ends ${endTag}`;
  } else {
    return `- ${event.name} -> starts ${startTag}, ends ${endTag}`;
  }
}

function buildMessage(events) {
  const now = Math.floor(Date.now() / 1000);
  const grouped = groupByMap(events);

  let output = '';

  for (const map of Object.keys(grouped)) {
    output += `**${map}**\n`;
    for (const event of grouped[map]) {
      output += `${formatEvent(event, now)}\n`;
    }
    output += '\n';
  }

  return output.trim();
}

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  await interaction.deferReply(); // <-- CRITICAL

  const now = Math.floor(Date.now() / 1000);

  try {
    if (interaction.commandName === 'events') {
      const filtered = schedule.data.filter(e => e.end >= now);

      if (filtered.length === 0) {
        await interaction.editReply('No active or upcoming events.');
        return;
      }

      await interaction.editReply(buildMessage(filtered));
    }

    if (interaction.commandName === 'eventsall') {
      await interaction.editReply(buildMessage(schedule.data));
    }
  } catch (err) {
    console.error(err);
    await interaction.editReply('Error processing events.');
  }
});

client.login(process.env.DISCORD_TOKEN);