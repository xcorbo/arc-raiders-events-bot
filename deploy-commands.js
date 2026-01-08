const { REST, Routes, SlashCommandBuilder } = require("discord.js")
require("dotenv").config()

const commands = [
  new SlashCommandBuilder()
    .setName("events")
    .setDescription("Show active and upcoming ARC Raiders events")
    .addIntegerOption(opt =>
      opt
        .setName("hours")
        .setDescription("How many hours ahead to look")
        .setMinValue(1)
        .setMaxValue(23)
    ),

  new SlashCommandBuilder()
    .setName("eventsall")
    .setDescription("Show all events for today")
]

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN)

;(async () => {
  try {
    console.log("Deploying slash commands...")
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands.map(c => c.toJSON()) }
    )
    console.log("Commands deployed")
  } catch (e) {
    console.error(e)
  }
})()
