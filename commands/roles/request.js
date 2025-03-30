const { SlashCommandBuilder, MessageFlags} = require("discord.js");
const requestAccess = require("../../handlers/commands/requestAccess.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("request")
        .setDescription("Request base command")
        .setContexts ([0, 1, 2])
        .setIntegrationTypes([0, 1])
        .addSubcommand(subcommand =>
            subcommand
                .setName("access")
                .setDescription("Request access")),
    async execute(interaction) {
        if (interaction.options.getSubcommand() === "access") {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });
            requestAccess(interaction);
        }
    },
};