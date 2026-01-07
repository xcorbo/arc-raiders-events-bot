require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const schedule = require('./schedule.json');

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

function getUpcomingHoursUTC(hoursAhead) {
  const now = new Date();
  now.setUTCMinutes(0, 0, 0);

  const hours = [];
  for (let i = 0; i <= hoursAhead; i++) {
    const d = new Date(now.getTime() + i * 60 * 60 * 1000);
    const hh = String(d.getUTCHours()).padStart(2, '0');
    hours.push(`${hh}:00`);
  }
  return hours;
}

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== 'events') return;

  const hoursAhead = interaction.options.getInteger('hours') ?? 2;
  const hours = getUpcomingHoursUTC(hoursAhead);

  let reply = `🛰 **ARC Raiders – Upcoming Events (UTC)**\n`;

  for (const hour of hours) {
    const slot = schedule[hour];
    if (!slot) continue;

    let hourHasEvents = false;
    let block = `\n⏰ **${hour}**\n`;

    for (const [zone, events] of Object.entries(slot)) {
      const entries = [];
      if (events.minor) entries.push(`Minor: ${events.minor}`);
      if (events.major) entries.push(`Major: ${events.major}`);

      if (entries.length > 0) {
        hourHasEvents = true;
        block += `• **${zone}** → ${entries.join(' | ')}\n`;
      }
    }

    if (hourHasEvents) reply += block;
  }

  if (reply.trim() === '🛰 **ARC Raiders – Upcoming Events (UTC)**') {
    reply += '\nNo events in the selected time window.';
  }

  await interaction.reply(reply);
});

client.login(process.env.DISCORD_TOKEN);