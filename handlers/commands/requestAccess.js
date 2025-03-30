const mysql = require("mysql2/promise");
const fs = require("fs");
const format = require("date-format");
const {MessageFlags, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder} = require("discord.js");
const { databaseHost, databaseName, databaseUsername, databasePassword} = require("../../config.json");
const authenticator = require("../functions/authenticator");

module.exports = async (interaction) => {
    // Error Embed
    const errorEmbed = new EmbedBuilder()
        .setColor(0xB22222)
        .setDescription("An error occurred during this process, please alert <@658043211591450667>.")

    // Vars
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
    if (roleResultAuthenticator === "user" || roleResultAuthenticator === "admin") {
        const haveAccessEmbed = new EmbedBuilder()
            .setColor(0xB22222)
            .setDescription("You already have access to the evidence lockup system!")
        await interaction.editReply({ embeds: [haveAccessEmbed], flags: MessageFlags.Ephemeral });
        pool.end()
        return
    } else if (roleResultAuthenticator === "requested") {
        const alreadyRequestedEmbed = new EmbedBuilder()
            .setColor(0xB22222)
            .setDescription("You already have requested access to the evidence lockup system, your request is being reviewed.")
        await interaction.editReply({ embeds: [alreadyRequestedEmbed], flags: MessageFlags.Ephemeral });
        pool.end()
        return
    }

    // Embeds & Buttons
    const requestEmbed = new EmbedBuilder()
        .setColor(0x008080)
        .setDescription("<@" + senderUserID + "> requested access to the evidence lockup bot.")
        .setAuthor({ name: interaction.user.username, iconURL: interaction.user.avatarURL()})
    const roleUser = new ButtonBuilder()
        .setCustomId("roleUser-" + senderUserID)
        .setLabel("Grant Access")
        .setStyle(ButtonStyle.Success);
    const roleDeny = new ButtonBuilder()
        .setCustomId("roleDeny-" + senderUserID)
        .setLabel("Deny Access")
        .setStyle(ButtonStyle.Danger);
    const buttonRow = new ActionRowBuilder()
        .addComponents(roleUser, roleDeny);


    // Update Database
    try {
        let query = "INSERT INTO users (userID, role) VALUES (?, 'requested');"
        await pool.query(query, [senderUserID])
    } catch (e) {
        console.log(e);
        await interaction.editReply({ embeds: [errorEmbed], flags: MessageFlags.Ephemeral });
        pool.end()
        return;
    } finally {
        pool.end()
    }

    // Send message to pirate
    interaction.client.users.send("658043211591450667", {embeds: [requestEmbed], components: [buttonRow]})

    // Reply to user
    const sentEmbed = new EmbedBuilder()
        .setColor(0x008080)
        .setDescription("Your request has been sent to the administrators, you will be notified when your request has been reviewed.")
    interaction.editReply({embeds: [sentEmbed], flags: MessageFlags.Ephemeral})

    // Create Log Entry
    const logEntry = format("dd/MM/yyyy hh:mm:ss", new Date()) + " » " + senderUsername + " (" + senderUserID + ") requested access \n"
    fs.appendFile("./logs/users.log", logEntry, {encoding: "utf8"}, function (err) {
        if (err) {
            console.log(err);
        }
    });
}