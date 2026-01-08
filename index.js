import fs from "fs";
import { Client, GatewayIntentBits } from "discord.js";

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const HOURS_AHEAD = 2;

// ---- LOAD SCHEDULE ----
const schedule = JSON.parse(
  fs.readFileSync("./schedule.json", "utf-8")
);

// ---- TIME HELPERS ----
function timeToDate(baseDate, timeStr) {
  const [h, m] = timeStr.split(":").map(Number);
  const d = new Date(baseDate);
  d.setUTCHours(h, m, 0, 0);
  return d;
}

// ---- BUILD EVENTS ----
function buildEvents({ hoursAhead = null, todayOnly = false }) {
  const now = new Date();
  const cutoff = hoursAhead
    ? new Date(now.getTime() + hoursAhead * 60 * 60 * 1000)
    : null;

  const todayUTC = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate()
  ));

  const days = todayOnly
    ? [todayUTC]
    : [todayUTC, new Date(todayUTC.getTime() + 86400000)];

  const events = [];

  for (const entry of schedule.data) {
    for (const day of days) {
      for (const t of entry.times) {
        let start = timeToDate(day, t.start);
        let end = timeToDate(day, t.end);

        // Handle midnight rollover
        if (end <= start) {
          end = new Date(end.getTime() + 86400000);
        }

        if (hoursAhead) {
          if (end < now || start > cutoff) continue;
        }

        events.push({
          name: entry.name,
          map: entry.map,
          startUnix: Math.floor(start.getTime() / 1000),
          endUnix: Math.floor(end.getTime() / 1000)
        });
      }
    }
  }

  return events.sort((a, b) => a.startUnix - b.startUnix);
}

// ---- FORMAT HELPERS ----
function formatRelative(startUnix, endUnix) {
  const now = Math.floor(Date.now() / 1000);

  if (now >= startUnix && now <= endUnix) {
    return `▶ Started ${Math.floor((now - startUnix) / 60)}m ago — ends in ${Math.ceil((endUnix - now) / 60)}m`;
  }

  if (now < startUnix) {
    return `▶ Starts in ${Math.ceil((startUnix - now) / 60)}m — ends in ${Math.ceil((endUnix - now) / 60)}m`;
  }

  return `▶ Ended ${Math.floor((now - endUnix) / 60)}m ago`;
}

function groupByMap(events) {
  return events.reduce((acc, e) => {
    if (!acc[e.map]) acc[e.map] = [];
    acc[e.map].push(e);
    return acc;
  }, {});
}

// ---- READY ----
client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// ---- COMMANDS ----
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  // /events → next 2 hours
  if (interaction.commandName === "events") {
    const events = buildEvents({ hoursAhead: HOURS_AHEAD });

    if (!events.length) {
      return interaction.reply("No events in the next 2 hours.");
    }

    const grouped = groupByMap(events);
    let msg = "**🛰️ ARC Raiders — Events (Next 2h)**\n\n";

    for (const map of Object.keys(grouped)) {
      msg += `🗺️ **${map.toUpperCase()}**\n`;

      for (const e of grouped[map]) {
        msg += `• **${e.name}**\n`;
        msg += `  ${formatRelative(e.startUnix, e.endUnix)}\n`;
        msg += `  ⏰ <t:${e.startUnix}:t> → <t:${e.endUnix}:t>\n\n`;
      }
    }

    return interaction.reply(msg);
  }

  // /eventsall → all events today
  if (interaction.commandName === "eventsall") {
    const events = buildEvents({ todayOnly: true });

    if (!events.length) {
      return interaction.reply("No events found for today.");
    }

    const grouped = groupByMap(events);
    let msg = "**🛰️ ARC Raiders — ALL Events Today (UTC)**\n\n";

    for (const map of Object.keys(grouped)) {
      msg += `🗺️ **${map.toUpperCase()}**\n`;

      for (const e of grouped[map]) {
        msg += `• **${e.name}**\n`;
        msg += `  ${formatRelative(e.startUnix, e.endUnix)}\n`;
        msg += `  ⏰ <t:${e.startUnix}:t> → <t:${e.endUnix}:t>\n\n`;
      }
    }

    return interaction.reply(msg);
  }
});

// ---- LOGIN ----
client.login(process.env.DISCORD_TOKEN);