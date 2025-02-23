const { CommandInteraction, Attachment, MessageFlags, EmbedBuilder } = require('discord.js');
const path = require("path");
const fetch = require('node-fetch');
const authenticator = require('./authenticator.js');
const { databaseHost, databaseName, databaseUsername, databasePassword, request } = require('../config.json');
const mysql = require("mysql2/promise");
const mime = require("mime-types");
const fs = require('fs');

module.exports = async (interaction) => {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    //Variables

    let unique = false;
    let caseID = ''

    // Sender Data

    const senderUserID = interaction.user.id;
    const senderUsername = interaction.user.username;

    // Option Data

    const username = interaction.options.getString('username');
    const reason = interaction.options.getString('reason');
    const evidenceContentType = mime.extension(interaction.options.getAttachment('evidence').contentType);
    const evidenceURL = interaction.options.getAttachment('evidence').url;

    // Authenticator

    const roleResultAuthenticator = await authenticator.role(senderUserID);
    if (roleResultAuthenticator === 'null') {
        const unauthorizedEmbed = new EmbedBuilder()
            .setColor(0xB22222)
            .setDescription("You do not have access to the evidence lockup system. If you believe this is a mistake, or would like to request access please use: " + request)
        await interaction.editReply({ embeds: [unauthorizedEmbed], flags: MessageFlags.Ephemeral });
        return
    }
    // Only Valid Users Below

    // Case ID Generation
    while (unique === false) {
        // ID Generation
        let n = (Math.random() * 0xfffff * 1000000).toString(16);
        caseID = n.slice(0, 6);
        // Unique Checks
        const connection = await mysql.createConnection({
            //config.json
            host: databaseHost,
            user: databaseUsername,
            database: databaseName,
            password: databasePassword
        });
        try {
            const [caseIDSearch] = await connection.query(
                "SELECT caseID FROM cases WHERE caseID = '" + caseID + "';"
            );
            if (caseIDSearch.length === 0) {unique = true;}
        } catch (err) {console.log(err);}
    }

    //Download Evidence

    const evidencePath = path.join('./evidence', caseID + '-1.' + evidenceContentType);
    fetch(evidenceURL).then(res => res.body.pipe(fs.createWriteStream(evidencePath)));


    await interaction.editReply({ content: `case id: ${caseID}`, flags: MessageFlags.Ephemeral });

};
