const authenticator = require("../functions/authenticator.js");
const mysql = require("mysql2/promise");
const fs = require("fs");
const format = require("date-format");
const { databaseHost, databaseName, databaseUsername, databasePassword} = require("../../config.json");
const {EmbedBuilder, MessageFlags} = require("discord.js");

module.exports = async (interaction) => {

    // Vars
    let userID = interaction.options.getUser("user").id;
    let username = interaction.options.getUser("user").username;
    let role = interaction.options.getString("role");

    // Sender Data
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
    if (roleResultAuthenticator !== "admin") {
        const unauthorizedEmbed = new EmbedBuilder()
            .setColor(0xB22222)
            .setDescription("You do not have access to admin commands. If you believe this is a mistake please contact <@658043211591450667>.")
        await interaction.editReply({ embeds: [unauthorizedEmbed], flags: MessageFlags.Ephemeral });
        pool.end()
        return
    }

    if (role === "remove") {
        // Delete user
        try {
            let query = "DELETE FROM users WHERE userID = ?;"
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
            .setDescription("Removed <@" + userID + ">  access the evidence lockup bot.")
        interaction.editReply({embeds: [successEmbed], flags: MessageFlags.Ephemeral})

        // Create Log Entry
        const logEntry = format("dd/MM/yyyy hh:mm:ss", new Date()) + " » " + senderUsername + " (" + senderUserID + ") removed: " + username + " (" + userID + ")" + "'s access \n"
        fs.appendFile("./logs/users.log", logEntry, {encoding: "utf8"}, function (err) {
            if (err) {
                console.log(err);
            }
        });
    } else {
        // Check user is present in database
        try {
            let query = "SELECT * FROM users WHERE userID = ?;"
            let [result] = await pool.query(query, [userID])

            // User not present therefore adding user
            if (result.length === 0) {
                query = "INSERT INTO users (userID, role) VALUES (?, 'requested');"
                await pool.query(query, [userID])

                // Reply to user
                const successEmbed = new EmbedBuilder()
                    .setColor(0x008080)
                    .setDescription("Set <@" + userID + ">  role to: `" + role + "`")
                interaction.editReply({embeds: [successEmbed], flags: MessageFlags.Ephemeral})

                // Create Log Entry
                const logEntry = format("dd/MM/yyyy hh:mm:ss", new Date()) + " » " + senderUsername + " (" + senderUserID + ") set: " + username + " (" + userID + ")" + "'s role to: " + role + "\n"
                fs.appendFile("./logs/users.log", logEntry, {encoding: "utf8"}, function (err) {
                    if (err) {
                        console.log(err);
                    }
                });
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
        // User already present therefore setting there role
        try {
            let query = "UPDATE users SET role = ? WHERE userID = ?;"
            await pool.query(query, [role, userID])
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
            .setDescription("Set <@" + userID + ">  role to: `" + role + "`")
        interaction.editReply({embeds: [successEmbed], flags: MessageFlags.Ephemeral})

        // Create Log Entry
        const logEntry = format("dd/MM/yyyy hh:mm:ss", new Date()) + " » " + senderUsername + " (" + senderUserID + ") set: " + username + " (" + userID + ")" + "'s role to: " + role + "\n"
        fs.appendFile("./logs/users.log", logEntry, {encoding: "utf8"}, function (err) {
            if (err) {
                console.log(err);
            }
        });
    }
}