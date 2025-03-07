const mysql = require("mysql2/promise");
const {MessageFlags, EmbedBuilder} = require("discord.js");
const { databaseHost, databaseName, databaseUsername, databasePassword} = require("../../config.json");
const authenticator = require("../functions/authenticator");
const sanitize = require ("../../handlers/functions/sqlSanitize");
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
    const caseID = interaction.options.getString("case-id");
    const sanitizedCaseID = await sanitize.encode(caseID);

    // Delete Case & Move Evidence Ect
    try {
        const [query] = await pool.query(
            "SELECT * FROM cases WHERE caseID = '" + sanitizedCaseID + "';");
        const {platform, perpetrator, reason, evidence, note} = query[0];
        if (query.length === 0) {
            const caseIDNotFoundEmbed = new EmbedBuilder()
                .setColor(0xB22222)
                .setDescription("Sorry we could not find that case. Please check the Case ID and try again.")
            await interaction.editReply({embeds: [caseIDNotFoundEmbed], flags: MessageFlags.Ephemeral});
            pool.end()
        } else {
            await pool.query(
                "DELETE FROM cases WHERE caseID = '" + sanitizedCaseID + "';");

            let evidenceArray = evidence.split(",");
            for (let i = 0; i < evidenceArray.length; i++) {
                const evidencePath = path.join("./evidence", evidenceArray[i]);
                const evidencePathNew = path.join("./evidence/deleted", evidenceArray[i]);
                fs.copyFileSync(evidencePath, evidencePathNew);
                fs.unlinkSync(evidencePath);
            }

            // Create Log Entry
            const logEntry = format("dd/MM/yyyy hh:mm:ss", new Date()) + " » " + senderUsername + " (" + senderUserID + ") deleted a punishment case: " + caseID + ", " + platform + ", " + perpetrator + ", " + reason + ", " + (note === null ? "no note!" : note) + "\n"
            fs.appendFileSync("./logs/deletes.log", logEntry, {encoding: "utf8"}, function (err) {
                if (err) {
                    console.log(err);
                }
            });


            const successEmbed = new EmbedBuilder()
                .setColor(0x66CDAA)
                .setDescription("Deleted Punishment Case: **" + caseID + "**")
            await interaction.editReply({ embeds: [successEmbed], flags: MessageFlags.Ephemeral });

            pool.end()
        }
    } catch (err) {

        // Error Embed
        const errorEmbed = new EmbedBuilder()
            .setColor(0xB22222)
            .setDescription("An error occurred during this process, please alert <@658043211591450667>.")

        console.log(err);
        pool.end();
        await interaction.editReply({ embeds: [errorEmbed], flags: MessageFlags.Ephemeral });
    } finally {
        pool.end();
    }


}