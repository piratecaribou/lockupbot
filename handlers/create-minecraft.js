const { CommandInteraction, Attachment, MessageFlags, EmbedBuilder } = require('discord.js');
const path = require("path");
const fetch = require('node-fetch');
const authenticator = require('./authenticator.js');
const { request } = require('../config.json');

module.exports = async (interaction) => {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    // Sender Data

    const senderUserID = interaction.user.id;
    const senderUsername = interaction.user.username;

    // Option Data

    const username = interaction.options.getString('username');
    const reason = interaction.options.getString('reason');
    const evidenceContentType = interaction.options.getAttachment('evidence').contentType;
    const evidenceURL = interaction.options.getAttachment('evidence').url;

    // Authenticator

    const roleResultAuthenticator = await authenticator.role(senderUserID);
    console.log(roleResultAuthenticator);
    if (roleResultAuthenticator === 'null') {
        const unauthorizedEmbed = new EmbedBuilder()
            .setColor(0xB22222)
            .setDescription("You do not have access to the evidence lockup system. If you believe this is a mistake, or would like to request access please use: " + request)
        await interaction.editReply({ embeds: [unauthorizedEmbed], flags: MessageFlags.Ephemeral });
        return
    }// Only Valid Users Below

    await interaction.editReply({ content: 'Secret Pong!', flags: MessageFlags.Ephemeral });

};
