const mysql = require("mysql2/promise");
const {MessageFlags, EmbedBuilder} = require("discord.js");
const { databaseHost, databaseName, databaseUsername, databasePassword } = require("../../config.json");
const findCase = require("../functions/findCase");
const path = require("path");
const authenticator = require("../functions/authenticator");
const sanitize = require ("../../handlers/functions/sqlSanitize");
const format = require("date-format");
const fs = require("fs");

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

    // Get CaseID & Evidence
    const caseID = interaction.options.getString("case-id");
    const sanitizedCaseID = await sanitize.encode(caseID);
    const evidenceToDelete = interaction.options.getInteger("evidence-number") - 1;

    try {
        // Find Current Cases
        const [query] = await pool.query(
            "SELECT * FROM cases WHERE caseID = '" + sanitizedCaseID + "';");
        const {caseID, evidence} = query[0];
        let evidenceArray = evidence.split(",");
        // If No Case Found
        if (query.length === 0) {
            const caseIDNotFoundEmbed = new EmbedBuilder()
                .setColor(0xB22222)
                .setDescription("Sorry we could not find that case. Please check the Case ID and try again.")
            await interaction.editReply({embeds: [caseIDNotFoundEmbed], flags: MessageFlags.Ephemeral});
            pool.end()
            // If Case Found But Only One Evidence
        } else if (evidenceArray.length === 1){
            const caseIDNotFoundEmbed = new EmbedBuilder()
                .setColor(0xB22222)
                .setDescription("A case must have at least one piece of evidence. Please add another piece of evidence before trying again.")
            await interaction.editReply({embeds: [caseIDNotFoundEmbed], flags: MessageFlags.Ephemeral});
            pool.end()
             // Case Found But Number Larger Than Expected
        } else if (evidenceArray.length < (evidenceToDelete + 1)) {
            const toBigEmbed = new EmbedBuilder()
                .setColor(0xB22222)
                .setDescription("The evidence number: `" + (evidenceToDelete + 1) + "` you have selected is too large. Please select a number between `1` and `" + evidenceArray.length + "`")
            await interaction.editReply({embeds: [toBigEmbed], flags: MessageFlags.Ephemeral});
            pool.end()
            // Case Found And 1+ Evidence
        } else {
            const evidencePath = path.join("./evidence", evidenceArray[evidenceToDelete]);
            const evidencePathNew = path.join("./evidence/deleted", evidenceArray[evidenceToDelete]);
            fs.copyFileSync(evidencePath, evidencePathNew);
            fs.unlinkSync(evidencePath);

            evidenceArray.splice(evidenceToDelete, 1);

            await pool.query(
                "UPDATE cases SET evidence = '" + evidenceArray.toString() + "' WHERE caseID = '" + sanitizedCaseID + "';"
            )

            findCase(interaction, caseID, "Deleted evidence from:")

            // Create Log Entry
            const logEntry = format("dd/MM/yyyy hh:mm:ss", new Date()) + " » " + senderUsername + " (" + senderUserID + ") deleted a piece of evidence from: " + caseID + " file name: " + evidenceArray[evidenceToDelete] + "\n"
            fs.appendFileSync("./logs/deletes.log", logEntry, {encoding: "utf8"}, function (err) {
                if (err) {
                    console.log(err);
                }
            });
            pool.end();
        }
    } catch (err) {

    }
}