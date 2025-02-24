const { SlashCommandBuilder } = require('discord.js');
const createMinecraft = require('../../handlers/commands/createMinecraft.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('case')
        .setDescription('Case base command')
        .addSubcommandGroup(subcommandGroup =>
            subcommandGroup
                .setName('create')
                .setDescription('Create base command')
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('minecraft')
                        .setDescription('Create a minecraft punishment case')
                        .addStringOption(option =>
                            option.setName('username')
                                .setDescription('The username of the player being punished')
                                .setMaxLength(20)
                                .setRequired(true))
                        .addStringOption(option =>
                            option.setName('reason')
                                .setDescription('The reason for the punishment')
                                .setMaxLength(255)
                                .setRequired(true))
                        .addAttachmentOption( option=>
                            option.setName('evidence')
                                .setDescription('The evidence for the punishment')
                                .setRequired(true)))
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('discord')
                        .setDescription('Crease a discord punishment case')
                        .addUserOption( option=>
                            option.setName('user')
                                .setDescription('The user being punished')
                                .setRequired(true))
                        .addStringOption(option =>
                            option.setName('reason')
                                .setDescription('The reason for the punishment')
                                .setMaxLength(255)
                                .setRequired(true))
                        .addAttachmentOption( option=>
                            option.setName('evidence')
                                .setDescription('The evidence for the punishment')
                                .setRequired(true)))),
    async execute(interaction) {
        if (interaction.options.getSubcommand() === 'minecraft') {
            createMinecraft(interaction);
        }
    },
};