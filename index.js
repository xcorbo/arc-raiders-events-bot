const { Client, GatewayIntentBits } = require("discord.js")
const fs = require("fs")
require("dotenv").config()

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
})

const schedule = JSON.parse(fs.readFileSync("./schedule.json", "utf8")).data

function parseTimeToday(timeStr) {
  const [h, m] = timeStr.split(":").map(Number)
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return d
}

function getEventWindow(startStr, endStr) {
  const start = parseTimeToday(startStr)
  let end = parseTimeToday(endStr)

  if (end <= start) {
    end.setDate(end.getDate() + 1) // midnight wrap
  }

  return { start, end }
}

function unix(date) {
  return Math.floor(date.getTime() / 1000)
}

client.once("clientReady", () => {
  console.log(`Logged in as ${client.user.tag}`)
})

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return

  try {
    const now = new Date()
    const hours = interaction.options.getInteger("hours") ?? 2
    const windowEnd = new Date(now.getTime() + hours * 60 * 60 * 1000)

    let mapGroups = {}

    for (const ev of schedule) {
      for (const t of ev.times) {
        const { start, end } = getEventWindow(t.start, t.end)

        const relevant =
          interaction.commandName === "eventsall"
            ? end > now
            : end > now && start < windowEnd

        if (!relevant) continue

        const line =
          start <= now
            ? `Started <t:${unix(start)}:R> -> ends <t:${unix(end)}:R>`
            : `Starts <t:${unix(start)}:R> -> ends <t:${unix(end)}:R>`

        if (!mapGroups[ev.map]) mapGroups[ev.map] = []
        mapGroups[ev.map].push(`• ${ev.name} — ${line}`)
      }
    }

    if (Object.keys(mapGroups).length === 0) {
      return interaction.reply("No active or upcoming events.")
    }

    let output = ""
    for (const map of Object.keys(mapGroups)) {
      output += `**${map}**\n`
      output += mapGroups[map].join("\n") + "\n\n"
    }

    await interaction.reply(output.trim())
  } catch (err) {
    console.error(err)
    await interaction.reply("Error processing events.")
  }
})

client.login(process.env.DISCORD_TOKEN)
