const mysql = require("mysql2/promise");
const {EmbedBuilder, MessageFlags} = require("discord.js");
const { databaseHost, databaseName, databaseUsername, databasePassword} = require("../../config.json");
const findCase = require("../functions/findCase");
const authenticator = require("../functions/authenticator");
const mime = require("mime-types");
const path = require("path");
const fetch = require("node-fetch");
const fs = require("fs");
const format = require("date-format");

module.exports = async (interaction) => {

    // Error Embed
    const errorEmbed = new EmbedBuilder()
        .setColor(0xB22222)
        .setDescription("An error occurred during this process, please alert <@658043211591450667>.")

    // Sender Data
    const senderUserID = interaction.user.id;
    const senderUsername = interaction.user.username;
    const caseIDInput = interaction.options.getString("case-id");

    // Mysql pool
    const pool = mysql.createPool({
        host: databaseHost,
        user: databaseUsername,
        database: databaseName,
        password: databasePassword,
        waitForConnections: true,
        connectionLimit: 1,
        idleTimeout: 60000,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0,
    });

    // Authenticator
    const roleResultAuthenticator = await authenticator.role(senderUserID, pool);
    if (roleResultAuthenticator === "null") {
        const unauthorizedEmbed = new EmbedBuilder()
            .setColor(0xB22222)
            .setDescription("You do not have access to the evidence lockup system. If you believe this is a mistake, or would like to request access please use: " + request)
        await interaction.editReply({ embeds: [unauthorizedEmbed], flags: MessageFlags.Ephemeral });
        pool.end()
        return}

    try {
        let query = "SELECT evidence, caseID FROM cases WHERE caseID = ?";
        const [result] = await pool.query(query, [caseIDInput]);
        // If Case ID Not Found
        if (result.length === 0) {
            const caseIDNotFoundEmbed = new EmbedBuilder()
                .setColor(0xB22222)
                .setDescription("Sorry we could not find that case. Please check the Case ID and try again.")
            await interaction.editReply({embeds: [caseIDNotFoundEmbed], flags: MessageFlags.Ephemeral});
            pool.end()
            // Case ID Found
        } else {
            // Get Next Evidence Number
            let evidenceArray = result[0].evidence.split(",");
            let lastEvidenceNumber = parseInt(evidenceArray[evidenceArray.length - 1].split("-")[1].split(".")[0]) + 1;

            // Download Evidence
            const evidencePath = path.join("./evidence", caseIDInput + "-" + lastEvidenceNumber + "." + mime.extension(interaction.options.getAttachment("evidence").contentType));
            fetch(interaction.options.getAttachment("evidence").url).then(res => res.body.pipe(fs.createWriteStream(evidencePath)));

            // Update Mysql Database
            const evidenceString = result[0].evidence + "," + caseIDInput + "-" + lastEvidenceNumber + "." + mime.extension(interaction.options.getAttachment("evidence").contentType)
            query = "UPDATE cases SET evidence = ? WHERE caseID = ?";
            await pool.query(query, [evidenceString, caseIDInput]);
            findCase(interaction, interaction.options.getString("case-id"), "Added evidence to case:")
            pool.end()

            // Create Log Entry
            const logEntry = format("dd/MM/yyyy hh:mm:ss", new Date()) + " » " + senderUsername + " (" + senderUserID + ") added the file: " + interaction.options.getString("case-id") + "-" + lastEvidenceNumber + "." + mime.extension(interaction.options.getAttachment("evidence").contentType) + " to: " + interaction.options.getString("case-id") + "\n"
            fs.appendFile("./logs/edits.log", logEntry, {encoding: "utf8"}, function (err) {
                if (err) {
                    console.log(err);
                }
            });
        }
    } catch (err) {
        console.log(err)
        pool.end()
        await interaction.editReply({ embeds: [errorEmbed], flags: MessageFlags.Ephemeral });
    }
}