const mysql = require("mysql2/promise");
const {MessageFlags, EmbedBuilder} = require("discord.js");
const { databaseHost, databaseName, databaseUsername, databasePassword, request } = require("../../config.json");
const findCase = require("../functions/findCase");
const authenticator = require("../functions/authenticator");
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
    if (roleResultAuthenticator !== "user" && roleResultAuthenticator !== "admin") {
        const unauthorizedEmbed = new EmbedBuilder()
            .setColor(0xB22222)
            .setDescription("You do not have access to the evidence lockup system. If you believe this is a mistake, or would like to request access please use: " + request)
        await interaction.editReply({ embeds: [unauthorizedEmbed], flags: MessageFlags.Ephemeral });
        pool.end()
        return
    }

    // Get Options
    const caseID = interaction.options.getString("case-id");

    try {
        // Find Current Cases
        let query = "SELECT * FROM cases WHERE caseID = ?"
        const [result] = await pool.query(query, [caseID]);
        const {note} = query[0];
        // If No Case Found
        if (result.length === 0) {
            const caseIDNotFoundEmbed = new EmbedBuilder()
                .setColor(0xB22222)
                .setDescription("Sorry we could not find that case. Please check the Case ID and try again.")
            await interaction.editReply({embeds: [caseIDNotFoundEmbed], flags: MessageFlags.Ephemeral});
            pool.end()
            // Case Found No Note
        } else if (note === null) {
            const noNoteEmbed = new EmbedBuilder()
                .setColor(0xB22222)
                .setDescription("We could not find a note for this case. Check the Case ID and try again.")
            await interaction.editReply({embeds: [noNoteEmbed], flags: MessageFlags.Ephemeral});
            pool.end()
            // Case Found And A Note
        } else {
            // Delete Note
            query = "UPDATE cases SET note = NULL WHERE caseID = ?"
            await pool.query(query, [caseID])

            findCase(interaction, caseID, "Deleted a note from:", null, null)

            // Create Log Entry
            const logEntry = format("dd/MM/yyyy hh:mm:ss", new Date()) + " » " + senderUsername + " (" + senderUserID + ") deleted a note from: " + caseID + " note: " + note + "\n"
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