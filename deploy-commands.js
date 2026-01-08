import { REST, Routes, SlashCommandBuilder } from "discord.js";

const commands = [
  new SlashCommandBuilder()
    .setName("events")
    .setDescription("Show ARC Raiders events for the next 2 hours"),

  new SlashCommandBuilder()
    .setName("eventsall")
    .setDescription("Show ALL ARC Raiders events for today (UTC)")
].map(c => c.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

await rest.put(
  Routes.applicationCommands(process.env.CLIENT_ID),
  { body: commands }
);

console.log("✅ Slash commands deployed");