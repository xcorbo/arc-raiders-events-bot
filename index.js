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

// ---- BUILD EVENTS (generic) ----
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

        // midnight rollover
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

// ---- BOT READY ----
client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// ---- SLASH COMMANDS ----
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  // /events → next 2 hours
  if (interaction.commandName === "events") {
    const events = buildEvents({ hoursAhead: HOURS_AHEAD });

    if (!events.length) {
      return interaction.reply("No events in the next 2 hours.");
    }

    let msg = "**🛰️ ARC Raiders — Events (Next 2h)**\n\n";

    for (const e of events) {
      msg += `**${e.map}** — ${e.name}\n`;
      msg += `⏰ <t:${e.startUnix}:R> → <t:${e.endUnix}:R>\n\n`;
    }

    return interaction.reply(msg);
  }

  // /eventsall → ALL events today (UTC)
  if (interaction.commandName === "eventsall") {
    const events = buildEvents({ todayOnly: true });

    if (!events.length) {
      return interaction.reply("No events found for today.");
    }

    let msg = "**🛰️ ARC Raiders — ALL Events Today (UTC)**\n\n";

    for (const e of events) {
      msg += `**${e.map}** — ${e.name}\n`;
      msg += `⏰ <t:${e.startUnix}:t> → <t:${e.endUnix}:t>\n\n`;
    }

    return interaction.reply(msg);
  }
});

// ---- LOGIN ----
client.login(process.env.DISCORD_TOKEN);