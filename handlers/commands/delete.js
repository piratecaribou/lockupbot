const mysql = require("mysql2/promise");
const {MessageFlags, EmbedBuilder} = require("discord.js");
const { databaseHost, databaseName, databaseUsername, databasePassword} = require("../../config.json");
const authenticator = require("../functions/authenticator");
const format = require("date-format");
const fs = require("fs");
const path = require("path");

module.exports = async (interaction) => {

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

    // Sender Data
    const senderUserID = interaction.user.id;
    const senderUsername = interaction.user.username;

    // Authenticator
    const roleResultAuthenticator = await authenticator.role(senderUserID, pool);
    if (roleResultAuthenticator === "null") {
        const unauthorizedEmbed = new EmbedBuilder()
            .setColor(0xB22222)
            .setDescription("You do not have access to the evidence lockup system. If you believe this is a mistake, or would like to request access please use: " + request)
        await interaction.editReply({ embeds: [unauthorizedEmbed], flags: MessageFlags.Ephemeral });
        pool.end()
        return}

    // Get CaseID
    const caseIDInput = interaction.options.getString("case-id");

    // Delete Case & Move Evidence Ect
    try {
        // Find Current Cases
        let query = "SELECT * FROM cases WHERE caseID = ?"
        const [result] = await pool.query(query, [caseIDInput]);
        const {platform, perpetrator, reason, evidence, note} = result[0];
        // If Case Not Found
        if (result.length === 0) {
            const caseIDNotFoundEmbed = new EmbedBuilder()
                .setColor(0xB22222)
                .setDescription("Sorry we could not find that case. Please check the Case ID and try again.")
            await interaction.editReply({embeds: [caseIDNotFoundEmbed], flags: MessageFlags.Ephemeral});
            pool.end()
            // Case Found
        } else {
            // Delete DB Record
            query = "DELETE FROM cases WHERE caseID = ?"
            await pool.query(query, [caseIDInput]);

            // Move Evidence
            let evidenceArray = evidence.split(",");
            for (let i = 0; i < evidenceArray.length; i++) {
                const evidencePath = path.join("./evidence", evidenceArray[i]);
                const evidencePathNew = path.join("./evidence/deleted", evidenceArray[i]);
                fs.copyFileSync(evidencePath, evidencePathNew);
                fs.unlinkSync(evidencePath);
            }

            const successEmbed = new EmbedBuilder()
                .setColor(0x66CDAA)
                .setDescription("Deleted Punishment Case: **" + caseIDInput + "**")
            await interaction.editReply({ embeds: [successEmbed], flags: MessageFlags.Ephemeral });

            // Create Log Entry
            const logEntry = format("dd/MM/yyyy hh:mm:ss", new Date()) + " » " + senderUsername + " (" + senderUserID + ") deleted a punishment case: " + caseIDInput + ", " + platform + ", " + perpetrator + ", " + reason + ", " + (note === null ? "no note!" : note) + "\n"
            fs.appendFile("./logs/deletes.log", logEntry, {encoding: "utf8"}, function (err) {
                if (err) {
                    console.log(err);
                }
            });
            pool.end();
        }
    } catch (err) {

        // Error Embed
        const errorEmbed = new EmbedBuilder()
            .setColor(0xB22222)
            .setDescription("An error occurred during this process, please alert <@658043211591450667>.")

        console.log(err);
        pool.end();
        await interaction.editReply({ embeds: [errorEmbed], flags: MessageFlags.Ephemeral });
    }


}