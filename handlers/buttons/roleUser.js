const {MessageFlags, EmbedBuilder} = require("discord.js");
const mysql = require("mysql2/promise");
const fs = require("fs");
const format = require("date-format");
const { databaseHost, databaseName, databaseUsername, databasePassword, create } = require("../../config.json");

module.exports = async (interaction) => {

    // Get Vars
    const userID = interaction.customId.split("-")[1];
    const username = interaction.client.users.cache.get(userID).username;
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

    // Query databases
    try {
        let query = "SELECT * FROM users WHERE userID = ?;"
        let [result] = await pool.query(query, [userID])
        if (!(result[0].role === "requested")) {
            const errorEmbed = new EmbedBuilder()
                .setColor(0xB22222)
                .setDescription("This user already has access to the evidence lockup system, current role: `"  + result[0].role + "`.")
            await interaction.editReply({ embeds: [errorEmbed], flags: MessageFlags.Ephemeral });
            pool.end()
            return;
        }
    } catch (e) {
        // Error Embed
        const errorEmbed = new EmbedBuilder()
            .setColor(0xB22222)
            .setDescription("An error occurred during this process, please alert <@658043211591450667>.")
        console.log(e);
        await interaction.editReply({ embeds: [errorEmbed], flags: MessageFlags.Ephemeral });
        pool.end()
        return;
    }
    try {
        let query = "UPDATE users SET role = 'user' WHERE userID = ?;"
        await pool.query(query, [userID])
    } catch (e) {
        // Error Embed
        const errorEmbed = new EmbedBuilder()
            .setColor(0xB22222)
            .setDescription("An error occurred during this process, please alert <@658043211591450667>.")
        console.log(e);
        await interaction.editReply({ embeds: [errorEmbed], flags: MessageFlags.Ephemeral });
        pool.end()
        return;
    } finally {
        pool.end()
    }

    // Reply to user
    const successEmbed = new EmbedBuilder()
        .setColor(0x008080)
        .setDescription("Accepted <@" + userID + "> request to access the evidence lockup bot.")
    interaction.editReply({embeds: [successEmbed], flags: MessageFlags.Ephemeral})

    // Send update to user whom requested access
    const acceptedEmbed = new EmbedBuilder()
        .setColor(0x008080)
        .setDescription("Your request to access the evidence lockup bot has been accepted, get started by using: " + create + "!")
    interaction.client.users.send(userID, {embeds: [acceptedEmbed]})

    // Create Log Entry
    const logEntry = format("dd/MM/yyyy hh:mm:ss", new Date()) + " » " + senderUsername + " (" + senderUserID + ") accepted a access request & set: " + username + " (" + userID + ")" + "'s role to: user \n"
    fs.appendFile("./logs/users.log", logEntry, {encoding: "utf8"}, function (err) {
        if (err) {
            console.log(err);
        }
    });

}