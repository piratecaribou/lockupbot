const { MessageFlags, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, AttachmentBuilder } = require("discord.js");
const path = require("path");
const fetch = require("node-fetch");
const authenticator = require("../functions/authenticator.js");
const { databaseHost, databaseName, databaseUsername, databasePassword, request, edit } = require("../../config.json");
const mysql = require("mysql2/promise");
const mime = require("mime-types");
const fs = require("fs");
const format = require("date-format");
const sanitize = require ("../../handlers/functions/sqlSanitize");

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
    if (roleResultAuthenticator === "null") {
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
        await pool.query(
            "INSERT INTO cases (caseID, platform, perpetrator, executor, reason, evidence, time) VALUES ('" + caseID + "', '" + platform + "', '" + await sanitize.encode(user) + "', '" + senderUserID + "', '" + await sanitize.encode(reason) + "', '" + caseID + "-1." + evidenceContentType + "', '" + timestamp + "');"
        );
        pool.end()
    } catch (err) {
        await interaction.editReply({ embeds: [errorEmbed], flags: MessageFlags.Ephemeral });
        console.log(err);
        pool.end()
        return
    }

    // Build Success Embed
    if (interaction.options.getSubcommand() === "minecraft") {
        const successEmbed = new EmbedBuilder()
            .setColor(0x6A5ACD)
            .setDescription("Successfully created a minecraft punishment case.")
            .addFields(
                {name: "**Punished Player**", value: "`" + user + "`", inline: true},
                {name: "**Reason**", value: "`" + reason + "`", inline: true},
                {name: "**Case ID**", value: "`" + caseID + "`", inline: true},
                {name: "**Case ID**", value: "`🏹` <@" + senderUserID + ">\n" + "`🕰️` <t:" + timestamp + ":R>", inline: true},
                {name: "", value: "If you made a mistake, you can edit the case using" + edit + ".", inline: true})
        // Create Buttons & Add To Button Row
        const caseIDButton = new ButtonBuilder()
            .setCustomId("caseID-" + caseID)
            .setLabel("Case ID")
            .setEmoji("🔑")
            .setStyle(ButtonStyle.Secondary);
        const suggestButton = new ButtonBuilder()
            .setCustomId("suggestMC-" + caseID)
            .setLabel("Suggest Command")
            .setEmoji("🪄")
            .setStyle(ButtonStyle.Secondary);
        const buttonRow = new ActionRowBuilder()
            .addComponents(caseIDButton, suggestButton);

        // Get Evidence
        const evidenceAttachment = new AttachmentBuilder(evidenceURL)
            .setName(caseID + "-1." + evidenceContentType);

        // Send Embed + Messages
        await interaction.editReply({
            embeds: [successEmbed],
            components: [buttonRow],
            files: [evidenceAttachment],
            flags: MessageFlags.Ephemeral
        });

        // Create Log Entry
        const logEntry = format("dd/MM/yyyy hh:mm:ss", new Date()) + " » " + senderUsername + " (" + senderUserID + ") created a minecraft punishment case: " + caseID + "\n"
        fs.appendFile("./logs/cases.log", logEntry, {encoding: "utf8"}, function (err) {
            if (err) {
                console.log(err);
            }
        });
    } else {
        const successEmbed = new EmbedBuilder()
            .setColor(0x6A5ACD)
            .setDescription("Successfully created a discord punishment case.")
            .addFields(
                {name: "**Punished User**", value: "<@" + user + ">", inline: true},
                {name: "**Reason**", value: "`" + reason + "`", inline: true},
                {name: "**Case ID**", value: "`" + caseID + "`", inline: true},
                {name: "**Case ID**", value: "`🏹` <@" + senderUserID + ">\n" + "`🕰️` <t:" + timestamp + ":R>", inline: true},
                {name: "", value: "If you made a mistake, you can edit the case using" + edit + ".", inline: true})
        // Create Buttons & Add To Button Row
        const caseIDButton = new ButtonBuilder()
            .setCustomId("caseID-" + caseID)
            .setLabel("Case ID")
            .setEmoji("🔑")
            .setStyle(ButtonStyle.Secondary);
        const suggestButton = new ButtonBuilder()
            .setCustomId("reasonDC௵" + reason.replace("௵", "") + " - " + caseID)
            .setLabel("Reason")
            .setEmoji("📜")
            .setStyle(ButtonStyle.Secondary);
        const buttonRow = new ActionRowBuilder()
            .addComponents(caseIDButton, suggestButton);

        // Get Evidence
        const evidenceAttachment = new AttachmentBuilder(evidenceURL)
            .setName(caseID + "-1." + evidenceContentType);

        // Send Embed + Messages
        await interaction.editReply({
            embeds: [successEmbed],
            components: [buttonRow],
            files: [evidenceAttachment],
            flags: MessageFlags.Ephemeral
        });

        // Create Log Entry
        const logEntry = format("dd/MM/yyyy hh:mm:ss", new Date()) + " » " + senderUsername + " (" + senderUserID + ") created a discord punishment case: " + caseID + "\n"
        fs.appendFile("./logs/cases.log", logEntry, {encoding: "utf8"}, function (err) {
            if (err) {
                console.log(err);
            }
        });
    }
};