const { SlashCommandBuilder, MessageFlags} = require("discord.js");
const createCase = require("../../handlers/commands/createCase.js");
const findCase = require("../../handlers/commands/findCase.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("case")
        .setDescription("Case base command")
        .addSubcommand(subcommand =>
            subcommand
                .setName("find")
                .setDescription("Finds a case from a CaseID / Username / Discord User")
                .addStringOption(option =>
                    option.setName('case-id')
                        .setDescription('The case id of the punishment')
                        .setMinLength(6)
                        .setMaxLength(6)
                        .setRequired(false))
                .addStringOption(option =>
                    option.setName('username')
                        .setDescription('The minecraft username of the punished player')
                        .setMaxLength(20)
                        .setRequired(false))
                 .addUserOption(option =>
                    option.setName('user')
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
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        if (interaction.options.getSubcommand() === "minecraft" || interaction.options.getSubcommand() === "discord") {
            createCase(interaction);
        } else if (interaction.options.getSubcommand() === "find") {
            findCase(interaction);
        }
    },
};