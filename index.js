require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const schedule = require('./schedule.json');

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

function getUpcomingSlots(hoursAhead) {
  const now = new Date();
  const slots = [];

  for (let i = 0; i <= hoursAhead; i++) {
    const d = new Date(now.getTime() + i * 60 * 60 * 1000);
    d.setUTCMinutes(0, 0, 0);

    const hh = String(d.getUTCHours()).padStart(2, '0');
    const key = `${hh}:00`;

    slots.push({
      key,
      date: d,
      timestamp: Math.floor(d.getTime() / 1000)
    });
  }

  return slots;
}

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== 'events') return;

  const hoursAhead = interaction.options.getInteger('hours') ?? 2;
  const slots = getUpcomingSlots(hoursAhead);

  let reply = `🛰 **ARC Raiders – Upcoming Events**\n`;

  for (const slot of slots) {
    const data = schedule[slot.key];
    if (!data) continue;

    let hasEvents = false;
    let block = `\n⏰ <t:${slot.timestamp}:t> → <t:${slot.timestamp}:R>\n`;

    for (const [zone, events] of Object.entries(data)) {
      const parts = [];
      if (events.minor) parts.push(`Minor: ${events.minor}`);
      if (events.major) parts.push(`Major: ${events.major}`);

      if (parts.length) {
        hasEvents = true;
        block += `• **${zone}** → ${parts.join(' | ')}\n`;
      }
    }

    if (hasEvents) reply += block;
  }

  if (reply.trim() === '🛰 **ARC Raiders – Upcoming Events**') {
    reply += '\nNo events in the selected time window.';
  }

  await interaction.reply(reply);
});

client.login(process.env.DISCORD_TOKEN);