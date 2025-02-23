const { MessageFlags, EmbedBuilder } = require('discord.js');
const path = require("path");
const fetch = require('node-fetch');
const authenticator = require('./authenticator.js');
const { databaseHost, databaseName, databaseUsername, databasePassword, request, edit } = require('../config.json');
const mysql = require("mysql2/promise");
const mime = require("mime-types");
const fs = require('fs');
const format = require('date-format');

module.exports = async (interaction) => {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    //Variables

    let unique = false;
    let caseID = ''
    const timestamp = Math.floor(Date.now() / 1000)

    // Sender Data

    const senderUserID = interaction.user.id;
    const senderUsername = interaction.user.username;

    // Option Data

    const username = interaction.options.getString('username');
    const reason = interaction.options.getString('reason');
    const evidenceContentType = mime.extension(interaction.options.getAttachment('evidence').contentType);
    const evidenceURL = interaction.options.getAttachment('evidence').url;

    // Error Embed
    const errorEmbed = new EmbedBuilder()
        .setColor(0xB22222)
        .setDescription("An error occurred during this process, please alert <@658043211591450667>.")

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
        } catch (err) {
            await interaction.editReply({ embeds: [errorEmbed], flags: MessageFlags.Ephemeral });
            console.log(err);
            return
        }
    }

    // Download Evidence

    const evidencePath = path.join('./evidence', caseID + '-1.' + evidenceContentType);
    fetch(evidenceURL).then(res => res.body.pipe(fs.createWriteStream(evidencePath)));

    // Send To Mysql Database
    const connection = await mysql.createConnection({
        //config.json
        host: databaseHost,
        user: databaseUsername,
        database: databaseName,
        password: databasePassword
    });
    try {
        await connection.query(
            "INSERT INTO cases (caseID, platform, perpetrator, executor, reason, evidence, time) VALUES ('" + caseID + "', 'minecraft', '" + username + "', '" + senderUserID + "', '" + reason + "', '" + caseID + "-1." + evidenceContentType + "', '" + timestamp + "');"
        );
    } catch (err) {
        await interaction.editReply({ embeds: [errorEmbed], flags: MessageFlags.Ephemeral });
        console.log(err);
        return
    }

    // Send Success Embed
    const successEmbed = new EmbedBuilder()
        .setColor(0x6A5ACD)
        .setDescription("Successfully created a minecraft punishment case.")
        .addFields(
            { name: "**Punished Player**", value: "`" + username + "`", inline: true },
            { name: "**Reason**", value: "`" + reason + "`", inline: true },
            { name: "**Case ID**", value: "`" + caseID + "`", inline: true },
            { name: "**Case ID**", value: "`🏹` <@" + senderUserID + ">\n" + "`🕰️` <t:" + timestamp + ":R>", inline: true },
            { name: "", value: "If you made a mistake, you can edit the case using" + edit + ".", inline: true }
        )
    await interaction.editReply({ embeds: [successEmbed], flags: MessageFlags.Ephemeral });

    // Create Log Entry
    const logEntry = format('dd/MM/yyyy hh:mm:ss', new Date()) + " » " + senderUsername + " (" + senderUserID + ") created a minecraft punishment case: " + caseID + "\n"
    fs.appendFile('./logs/cases.log', logEntry, {encoding:'utf8'}, function(err) { if(err) { console.log(err); }});
};
