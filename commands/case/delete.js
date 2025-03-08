const { SlashCommandBuilder, MessageFlags} = require("discord.js");
const caseDelete = require("../../handlers/commands/delete.js");
const deleteNote = require("../../handlers/commands/deleteNote.js");
const deleteEvidence = require("../../handlers/commands/deleteEvidence.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("delete")
        .setDescription("Delete base command")
        .addSubcommand(subcommand =>
            subcommand
                .setName("case")
                .setDescription("Delete a case")
                .addStringOption(option =>
                    option.setName("case-id")
                        .setDescription("The case id of the punishment")
                        .setMinLength(6)
                        .setMaxLength(6)
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName("note")
                .setDescription("Delete a note from a case")
                .addStringOption(option =>
                    option.setName("case-id")
                        .setDescription("The case id of the punishment")
                        .setMinLength(6)
                        .setMaxLength(6)
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName("evidence")
                .setDescription("Delete evidence from a case")
                .addStringOption(option =>
                    option.setName("case-id")
                        .setDescription("The case id of the punishment")
                        .setMinLength(6)
                        .setMaxLength(6)
                        .setRequired(true))
                .addIntegerOption(option =>
                    option.setName("evidence-number")
                        .setDescription("The piece of evidence to delete")
                        .setRequired(true)
                        .setMinValue(1))),
    async execute(interaction) {
        if (interaction.options.getSubcommand() === "case") {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });
            caseDelete(interaction);
        } else if (interaction.options.getSubcommand() === "note") {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });
            deleteNote(interaction);
        } else if (interaction.options.getSubcommand() === "evidence") {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });
            deleteEvidence(interaction);
        }
    },
};