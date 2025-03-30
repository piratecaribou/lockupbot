const { MessageFlags, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, AttachmentBuilder} = require("discord.js");
const path = require("path");
const fetch = require("node-fetch");
const authenticator = require("../functions/authenticator.js");
const { databaseHost, databaseName, databaseUsername, databasePassword, request } = require("../../config.json");
const mysql = require("mysql2/promise");
const mime = require("mime-types");
const fs = require("fs");
const format = require("date-format");
const findCase = require("../functions/findCase");

module.exports = async (interaction) => {

    // Error Embed
    const errorEmbed = new EmbedBuilder()
        .setColor(0xB22222)
        .setDescription("An error occurred during this process, please alert <@658043211591450667>.")

    // Time
    const timestamp = Math.floor(Date.now() / 1000)

    // Sender Data
    const senderUserID = interaction.user.id;
    const senderUsername = interaction.user.username;

    // Option Data
    let platform = "";
    let user = "";
    if (interaction.options.getSubcommand() === "minecraft") {
        user = interaction.options.getString("username");
        platform = "minecraft";

    } else if (interaction.options.getSubcommand() === "discord") {
        user = interaction.options.getUser("user").id;
        platform = "discord";
    } else {
        await interaction.editReply({ embeds: [errorEmbed], flags: MessageFlags.Ephemeral });
        return;
    }
    const reason = interaction.options.getString("reason");
    const evidenceContentType = mime.extension(interaction.options.getAttachment("evidence").contentType);
    const evidenceURL = interaction.options.getAttachment("evidence").url;

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
        return
    }

    // Case ID Generation
    let caseID = ""
    let unique = false;
    while (unique === false) {
        // ID Generation
        let n = (Math.random() * 0xfffff * 1000000).toString(16);
        caseID = n.slice(0, 6);
        // Unique Checks
        try {
            const [caseIDSearch] = await pool.query(
                "SELECT caseID FROM cases WHERE caseID = '" + caseID + "';"
            );
            if (caseIDSearch.length === 0) {unique = true;}
        } catch (err) {
            await interaction.editReply({ embeds: [errorEmbed], flags: MessageFlags.Ephemeral });
            console.log(err);
            pool.end()
            return
        }
    }

    // Download Evidence
    const evidencePath = path.join("./evidence", caseID + "-1." + evidenceContentType);
    fetch(evidenceURL).then(res => res.body.pipe(fs.createWriteStream(evidencePath)));

    // Send To Mysql Database
    try {
        const query = "INSERT INTO cases (caseID, platform, perpetrator, executor, reason, evidence, time) VALUES ('" + caseID + "', '" + platform + "', ?, '" + senderUserID + "', ?, '" + caseID + "-1." + evidenceContentType + "', '" + timestamp + "');"
        await pool.query(query, [user, reason]);
        pool.end()
    } catch (err) {
        await interaction.editReply({ embeds: [errorEmbed], flags: MessageFlags.Ephemeral });
        console.log(err);
        pool.end()
        return
    }

    // Create Buttons & Add To Button Row
    const caseIDButton = new ButtonBuilder()
        .setCustomId("caseID-" + caseID)
        .setLabel("Case ID")
        .setEmoji("🔑")
        .setStyle(ButtonStyle.Secondary);

    // Get Evidence
    const evidenceAttachment = new AttachmentBuilder(evidenceURL)
        .setName(caseID + "-1." + evidenceContentType);

    if (interaction.options.getSubcommand() === "minecraft") {
        // Create Buttons & Add To Button Row
        const suggestButton = new ButtonBuilder()
            .setCustomId("suggestMC-" + caseID)
            .setLabel("Suggest Command")
            .setEmoji("🪄")
            .setStyle(ButtonStyle.Secondary);
        const buttonRow = new ActionRowBuilder()
            .addComponents(caseIDButton, suggestButton);

        findCase(interaction, caseID, "Successfully created a minecraft punishment case:", buttonRow, evidenceAttachment)

        // Create Log Entry
        const logEntry = format("dd/MM/yyyy hh:mm:ss", new Date()) + " » " + senderUsername + " (" + senderUserID + ") created a minecraft punishment case: " + caseID + "\n"
        fs.appendFile("./logs/cases.log", logEntry, {encoding: "utf8"}, function (err) {
            if (err) {
                console.log(err);
            }
        });
    } else {
        // Create Buttons & Add To Button Row
        const suggestButton = new ButtonBuilder()
            .setCustomId("reasonDC-" + reason + " - " + caseID)
            .setLabel("Reason")
            .setEmoji("📜")
            .setStyle(ButtonStyle.Secondary);
        const buttonRow = new ActionRowBuilder()
            .addComponents(caseIDButton, suggestButton);

        findCase(interaction, caseID, "Successfully created a discord punishment case:", buttonRow, evidenceAttachment)

        // Create Log Entry
        const logEntry = format("dd/MM/yyyy hh:mm:ss", new Date()) + " » " + senderUsername + " (" + senderUserID + ") created a discord punishment case: " + caseID + "\n"
        fs.appendFile("./logs/cases.log", logEntry, {encoding: "utf8"}, function (err) {
            if (err) {
                console.log(err);
            }
        });
    }
};