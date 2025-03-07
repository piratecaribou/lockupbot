const {EmbedBuilder, MessageFlags} = require("discord.js");
const sanitize = require("../functions/sqlSanitize");
const mysql = require("mysql2/promise");
const { databaseHost, databaseName, databaseUsername, databasePassword} = require("../../config.json");
const authenticator = require("../functions/authenticator");
const findCase = require("../functions/findCase");
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
        return
    }

    // Retrieve CaseID
    const caseID = interaction.customId.split("-")[1];

    // Initialise Vars
    let platform, perpetrator, reason, note;

    try {
        // Mysql Query Old Data
        const [query] = await pool.query(
            "SELECT platform, perpetrator, reason, note FROM cases WHERE caseID = '" + caseID + "';");
        platform = query[0].platform;
        perpetrator = query[0].perpetrator;
        reason = query[0].reason;
        note = query[0].note;
    } catch (err) {
        console.log(err);
        pool.end();
        await interaction.reply({ embeds: [errorEmbed], flags: MessageFlags.Ephemeral });
        return;
    }

    // Get Modal Data
    let platformInput = interaction.fields.getTextInputValue("platformInput").toLowerCase();
    let perpetratorInput = interaction.fields.getTextInputValue("perpetratorInput");
    let reasonInput = await sanitize.encode(interaction.fields.getTextInputValue("reasonInput"));
    let noteInput, notePresent = false;
    if (note !== null) {
        noteInput = await sanitize.encode(interaction.fields.getTextInputValue("noteInput"));
        notePresent = true;
    }

    // Ensure All Data Is Filled In Correctly
    if (platformInput === "discord") {
        let regex = /^[0-9]*$/g
        if (regex.test(perpetratorInput) === false || perpetratorInput.length > 19 || perpetratorInput.length < 17) {
            const notValid = new EmbedBuilder()
                .setColor(0xB22222)
                .setDescription("Sorry, the discord user id you entered: `" + perpetratorInput + "`, is not valid. Please try again!")
            await interaction.editReply({ embeds: [notValid], flags: MessageFlags.Ephemeral });
            pool.end();
            return;
        }
    } else if (platformInput === "minecraft") {
        perpetratorInput = await sanitize.encode(perpetratorInput);
    } else {
        const notValid = new EmbedBuilder()
            .setColor(0xB22222)
            .setDescription("Sorry, the platform you entered: `" + platformInput + "`, is not allowed. The only allowed platform types are `minecraft` & `discord`. Please try again using these types.")
        await interaction.editReply({ embeds: [notValid], flags: MessageFlags.Ephemeral });
        pool.end();
        return;
    }

    try {
        if (notePresent === false) {
            // Update Database
            await pool.query(
                "UPDATE cases SET platform = '" + platformInput + "', perpetrator = '" + perpetratorInput + "', reason = '" + reasonInput + "' WHERE caseID = '" + caseID + "';"
            )

            pool.end();
            findCase(interaction, caseID, "Edited A Case:")

            // Create Log Entry
            const logEntry = format("dd/MM/yyyy hh:mm:ss", new Date()) + " » " + senderUsername + " (" + senderUserID + ") edited a punishment case: " + caseID + ", old: " + platform + ", " + perpetrator + ", " + reason + "\n" + "new: " + platformInput + ", " + perpetratorInput + ", " + reasonInput + "\n"
            fs.appendFile("./logs/edits.log", logEntry, {encoding: "utf8"}, function (err) {
                if (err) {
                    console.log(err);
                }
            });
        } else {
            // Update Database
            await pool.query(
                "UPDATE cases SET platform = '" + platformInput + "', perpetrator = '" + perpetratorInput + "', reason = '" + reasonInput + "', note = '" + noteInput + "' WHERE caseID = '" + caseID + "';"
            )

            pool.end();
            findCase(interaction, caseID, "Edited A Case:")

            // Create Log Entry
            const logEntry = format("dd/MM/yyyy hh:mm:ss", new Date()) + " » " + senderUsername + " (" + senderUserID + ") edited a punishment case: " + caseID + ", old: " + platform + ", " + perpetrator + ", " + reason + ", " + note + "\n" + "new: " + platformInput + ", " + perpetratorInput + ", " + reasonInput + ", " + noteInput + "\n"
            fs.appendFile("./logs/edits.log", logEntry, {encoding: "utf8"}, function (err) {
                if (err) {
                    console.log(err);
                }
            });
        }
    } catch (err) {

        // Error Embed
        const errorEmbed = new EmbedBuilder()
            .setColor(0xB22222)
            .setDescription("An error occurred during this process, please alert <@658043211591450667>.")

        console.log(err);
        pool.end();
        await interaction.reply({ embeds: [errorEmbed], flags: MessageFlags.Ephemeral });
    }
}