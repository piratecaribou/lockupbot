const { SlashCommandBuilder, MessageFlags} = require("discord.js");
const setRole = require("../../handlers/commands/setRole.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("admin")
        .setDescription("Admin base command")
        .setContexts ([1, 2])
        .setIntegrationTypes([0, 1])
        .addSubcommand(subcommand =>
            subcommand
                .setName("roles")
                .setDescription("Set roles for a user")
                .addUserOption( option=>
                    option.setName("user")
                        .setDescription("The user, who's roles you want to set")
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName("role")
                        .setDescription("The role to set the user as")
                        .setChoices({name: 'Admin', value: 'admin'}, {name: 'User', value: 'user'}, {name: 'Remove acsess', value: 'remove'})
                    .setRequired(true))),
    async execute(interaction) {
        if (interaction.options.getSubcommand() === "roles") {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });
            setRole(interaction);
        }
    },
};