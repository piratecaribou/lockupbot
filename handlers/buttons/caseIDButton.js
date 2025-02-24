const { MessageFlags } = require('discord.js');
module.exports = async (interaction) => {
    const caseID = interaction.customId.split('-')[1];
    await interaction.reply({
        content: caseID,
        flags: MessageFlags.Ephemeral
    });
}