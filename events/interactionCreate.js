const { Events, MessageFlags } = require('discord.js');
const caseIDButton = require('../handlers/buttons/caseIDButton.js');
const suggestMCButton = require('../handlers/buttons/suggestMCButton.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (interaction.isChatInputCommand()) {

        const command = interaction.client.commands.get(interaction.commandName);

        if (!command) {
            console.error(`No command matching ${interaction.commandName} was found.`);
            return;
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
            } else {
                await interaction.reply({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
            }
        }
        } else if (interaction.isButton()) {
            if (interaction.customId.startsWith('caseID-') === true ) {
                caseIDButton(interaction);
            } else if (interaction.customId.startsWith('suggestMC-') === true) {
                suggestMCButton(interaction);
            }
        }
    },
};