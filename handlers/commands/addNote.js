const mysql = require("mysql2/promise");
const {MessageFlags, EmbedBuilder} = require("discord.js");
const { databaseHost, databaseName, databaseUsername, databasePassword, edit } = require("../../config.json");
const findCase = require("../functions/findCase");
const authenticator = require("../functions/authenticator");
const sanitize = require ("../../handlers/functions/sqlSanitize");
const format = require("date-format");
const fs = require("fs");

module.exports = async (interaction) => {

    // Error Embed
    const errorEmbed = new EmbedBuilder()
        .setColor(0xB22222)
        .setDescription("An error occurred during this process, please alert <@658043211591450667>.")

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
    const roleResultAuthenticator = await authenticator.role(interaction.user.id, pool);
    if (roleResultAuthenticator === "null") {
        const unauthorizedEmbed = new EmbedBuilder()
            .setColor(0xB22222)
            .setDescription("You do not have access to the evidence lockup system. If you believe this is a mistake, or would like to request access please use: " + request)
        await interaction.editReply({ embeds: [unauthorizedEmbed], flags: MessageFlags.Ephemeral });
        pool.end()
        return}

    // Find Existing Notes
    try {
        const [query] = await pool.query(
            "SELECT note, caseID FROM cases WHERE caseID = '" + await sanitize.encode(interaction.options.getString("case-id")) + "';");
        // If Case ID Not Found
        if (query.length === 0) {
            const caseIDNotFoundEmbed = new EmbedBuilder()
                .setColor(0xB22222)
                .setDescription("Sorry we could not find that case. Please check the Case ID and try again.")
            await interaction.editReply({embeds: [caseIDNotFoundEmbed], flags: MessageFlags.Ephemeral});
            pool.end()
            // If Case ID Found And No Note
        } else if (query[0].note === null) {
            // Update MYSQL
            await pool.query(
                "UPDATE cases SET note = '" + await sanitize.encode(interaction.options.getString("note")) + "' WHERE caseID = '" + await sanitize.encode(interaction.options.getString("case-id")) + "';");
            pool.end()
            //Send Updated Embed
            findCase(interaction, interaction.options.getString("case-id"), "Added a note:")
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

    // Sender Data
    const senderUserID = interaction.user.id;
    const senderUsername = interaction.user.username;

    // Create Log Entry
    const logEntry = format("dd/MM/yyyy hh:mm:ss", new Date()) + " » " + senderUsername + " (" + senderUserID + ") added the a note: " + interaction.options.getString("note") + " to: " + interaction.options.getString("case-id") + "\n"
    fs.appendFile("./logs/edits.log", logEntry, {encoding: "utf8"}, function (err) {
        if (err) {
            console.log(err);
        }
    });
}