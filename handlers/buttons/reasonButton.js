const { MessageFlags } = require("discord.js");
module.exports = async (interaction) => {
    const reason = interaction.customId.split("௵")[1];
    await interaction.reply({
        content: reason,
        flags: MessageFlags.Ephemeral
    });
}