const { MessageFlags } = require("discord.js");
module.exports = async (interaction) => {
    const reason = interaction.customId.replace("reasonDC-", "");
    await interaction.reply({
        content: reason,
        flags: MessageFlags.Ephemeral
    });
}