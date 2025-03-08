const { SlashCommandBuilder, MessageFlags} = require("discord.js");
const createCase = require("../../handlers/commands/createCase.js");
const findCase = require("../../handlers/commands/findCase.js");
const addEvidence = require("../../handlers/commands/addEvidence.js");
const addNote = require("../../handlers/commands/addNote.js");
const edit = require("../../handlers/commands/edit.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("case")
        .setDescription("Case base command")
        .addSubcommand(subcommand =>
                subcommand
                    .setName("edit")
                    .setDescription("Edit a case")
                    .addStringOption(option =>
                        option.setName("case-id")
                            .setDescription("The case id of the punishment")
                            .setMinLength(6)
                            .setMaxLength(6)
                            .setRequired(true)))
        .addSubcommandGroup(subcommandGroup =>
            subcommandGroup
                .setName("add")
                .setDescription("Add base command")
                .addSubcommand(subcommand =>
                    subcommand
                        .setName("note")
                        .setDescription("Add a note to a case")
                        .addStringOption(option =>
                            option.setName("case-id")
                                .setDescription("The case id of the punishment")
                                .setMinLength(6)
                                .setMaxLength(6)
                                .setRequired(true))
                        .addStringOption(option =>
                            option.setName("note")
                                .setDescription("The note to add to the case")
                                .setMaxLength(255)
                                .setRequired(true)))
                .addSubcommand(subcommand =>
                subcommand
                    .setName("evidence")
                    .setDescription("Add evidence to a case")
                    .addStringOption(option =>
                        option.setName("case-id")
                            .setDescription("The case id of the punishment")
                            .setMinLength(6)
                            .setMaxLength(6)
                            .setRequired(true))
                    .addAttachmentOption( option=>
                        option.setName("evidence")
                            .setDescription("The evidence to add to the case")
                            .setRequired(true))))
        .addSubcommand(subcommand =>
            subcommand
                .setName("find")
                .setDescription("Finds a case from a CaseID / Username / Discord User")
                .addStringOption(option =>
                    option.setName("case-id")
                        .setDescription("The case id of the punishment")
                        .setMinLength(6)
                        .setMaxLength(6)
                        .setRequired(false))
                .addStringOption(option =>
                    option.setName("username")
                        .setDescription("The minecraft username of the punished player")
                        .setMaxLength(20)
                        .setRequired(false))
                 .addUserOption(option =>
                    option.setName("user")
                        .setDescription("The discord user of the punished user")
                        .setRequired(false)))
        .addSubcommandGroup(subcommandGroup =>
            subcommandGroup
                .setName("create")
                .setDescription("Create base command")
                .addSubcommand(subcommand =>
                    subcommand
                        .setName("minecraft")
                        .setDescription("Create a minecraft punishment case")
                        .addStringOption(option =>
                            option.setName("username")
                                .setDescription("The username of the player being punished")
                                .setMaxLength(20)
                                .setRequired(true))
                        .addStringOption(option =>
                            option.setName("reason")
                                .setDescription("The reason for the punishment")
                                .setMaxLength(255)
                                .setRequired(true))
                        .addAttachmentOption( option=>
                            option.setName("evidence")
                                .setDescription("The evidence for the punishment")
                                .setRequired(true)))
                .addSubcommand(subcommand =>
                    subcommand
                        .setName("discord")
                        .setDescription("Crease a discord punishment case")
                        .addUserOption( option=>
                            option.setName("user")
                                .setDescription("The user being punished")
                                .setRequired(true))
                        .addStringOption(option =>
                            option.setName("reason")
                                .setDescription("The reason for the punishment")
                                .setMaxLength(255)
                                .setRequired(true))
                        .addAttachmentOption( option=>
                            option.setName("evidence")
                                .setDescription("The evidence for the punishment")
                                .setRequired(true)))),
    async execute(interaction) {
        if (interaction.options.getSubcommand() === "minecraft" || interaction.options.getSubcommand() === "discord") {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });
            createCase(interaction);
        } else if (interaction.options.getSubcommand() === "find") {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });
            findCase(interaction);
        } else if (interaction.options.getSubcommand() === "evidence") {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });
            addEvidence(interaction);
        } else if (interaction.options.getSubcommand() === "note") {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });
            addNote(interaction);
        } else if (interaction.options.getSubcommand() === "edit") {
            edit(interaction);
        }
    },
};