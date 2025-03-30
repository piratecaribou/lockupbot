const mysql = require("mysql2/promise");
const {MessageFlags, EmbedBuilder} = require("discord.js");
const { databaseHost, databaseName, databaseUsername, databasePassword, edit, request } = require("../../config.json");
const findCase = require("../functions/findCase");
const authenticator = require("../functions/authenticator");
const format = require("date-format");
const fs = require("fs");

module.exports = async (interaction) => {

    // Error Embed
    const errorEmbed = new EmbedBuilder()
        .setColor(0xB22222)
        .setDescription("An error occurred during this process, please alert <@658043211591450667>.")

    // Vars
    const caseIDInput = interaction.options.getString("case-id");
    const note = interaction.options.getString("note");
    const senderUserID = interaction.user.id;
    const senderUsername = interaction.user.username;

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
    if (roleResultAuthenticator !== "user" && roleResultAuthenticator !== "admin") {
        const unauthorizedEmbed = new EmbedBuilder()
            .setColor(0xB22222)
            .setDescription("You do not have access to the evidence lockup system. If you believe this is a mistake, or would like to request access please use: " + request)
        await interaction.editReply({ embeds: [unauthorizedEmbed], flags: MessageFlags.Ephemeral });
        pool.end()
        return}

    // Find Existing Notes
    try {
        let query = "SELECT note, caseID FROM cases WHERE caseID = ?"
        const [result] = await pool.query(query, [caseIDInput]);
        // If Case ID Not Found
        if (result.length === 0) {
            const caseIDNotFoundEmbed = new EmbedBuilder()
                .setColor(0xB22222)
                .setDescription("Sorry we could not find that case. Please check the Case ID and try again.")
            await interaction.editReply({embeds: [caseIDNotFoundEmbed], flags: MessageFlags.Ephemeral});
            pool.end()
            // If Case ID Found And No Note
        } else if (result[0].note === null) {
            // Update MYSQL
            query = "UPDATE cases SET note = ? WHERE caseID = ?"
            await pool.query(query, [note, caseIDInput])
            pool.end()
            //Send Updated Embed
            findCase(interaction, caseIDInput, "Added a note:", null, null)
            // Note Found
        } else {
            const noteFoundEmbed = new EmbedBuilder()
                .setColor(0xB22222)
                .setDescription("A note has already been created for this case, you can edit it using: " + edit)
            await interaction.editReply({embeds: [noteFoundEmbed], flags: MessageFlags.Ephemeral});
            pool.end()
        }
    } catch (err) {
        console.log(err);
        pool.end()
        await interaction.editReply({ embeds: [errorEmbed], flags: MessageFlags.Ephemeral });
        return;
    }

    // Create Log Entry
    const logEntry = format("dd/MM/yyyy hh:mm:ss", new Date()) + " » " + senderUsername + " (" + senderUserID + ") added the a note: " + interaction.options.getString("note") + " to: " + interaction.options.getString("case-id") + "\n"
    fs.appendFile("./logs/edits.log", logEntry, {encoding: "utf8"}, function (err) {
        if (err) {
            console.log(err);
        }
    });
}