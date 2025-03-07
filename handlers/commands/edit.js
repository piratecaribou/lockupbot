const mysql = require("mysql2/promise");
const sanitize = require("../functions/sqlSanitize");
const authenticator = require("../functions/authenticator");
const { databaseHost, databaseName, databaseUsername, databasePassword} = require("../../config.json");
const {EmbedBuilder, MessageFlags, ModalBuilder, TextInputBuilder, ActionRowBuilder, TextInputStyle} = require("discord.js");

module.exports = async (interaction) => {

    // Error Embed
    const errorEmbed = new EmbedBuilder()
        .setColor(0xB22222)
        .setDescription("An error occurred during this process, please alert <@658043211591450667>.");

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
        return
    }

    try {
        // Mysql Query
        const [query] = await pool.query(
            "SELECT caseID, platform, perpetrator, reason, note FROM cases WHERE caseID = '" + await sanitize.encode(interaction.options.getString("case-id")) + "';");

        // If Case ID Not Found
        if (query.length === 0) {
            const caseIDNotFoundEmbed = new EmbedBuilder()
                .setColor(0xB22222)
                .setDescription("Sorry we could not find that case. Please check the Case ID and try again.")
            await interaction.reply({embeds: [caseIDNotFoundEmbed], flags: MessageFlags.Ephemeral});
            pool.end()
        } else {
            // Retrieve Query Results
            const {caseID, platform, perpetrator, reason, note} = query[0];

            // Create Modal
            const modal = new ModalBuilder()
                .setCustomId("caseEditModal-" + caseID)
                .setTitle("Editing Case: " + caseID);
            const platformInput = new TextInputBuilder()
                .setCustomId("platformInput")
                .setLabel("Platform (Must Be 'Minecraft' / 'Discord')")
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
                .setMinLength(6)
                .setMaxLength(9)
                .setValue(platform);
            const platformInputRow = new ActionRowBuilder().addComponents(platformInput);

            const perpetratorInput = new TextInputBuilder()
                .setCustomId("perpetratorInput")
                .setLabel("Minecraft Username / Discord UserID")
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
                .setMinLength(3)
                .setMaxLength(19)
                .setValue(perpetrator);
            const perpetratorInputRow = new ActionRowBuilder().addComponents(perpetratorInput);

            const reasonInput = new TextInputBuilder()
                .setCustomId("reasonInput")
                .setLabel("Reason")
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true)
                .setMinLength(1)
                .setMaxLength(255)
                .setValue(reason);
            const reasonInputRow = new ActionRowBuilder().addComponents(reasonInput);

            const noteInput = new TextInputBuilder()
                .setCustomId("noteInput")
                .setLabel("Note")
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true)
                .setMaxLength(255)
                .setValue(note === null ? "how did you see this?" : note);
            const noteInputRow = new ActionRowBuilder().addComponents(noteInput);

            // Send Variations Of Modals
            if (note === null) {
                modal.addComponents(platformInputRow, perpetratorInputRow, reasonInputRow);
                await interaction.showModal(modal);
                pool.end()
            } else {
                modal.addComponents(platformInputRow, perpetratorInputRow, reasonInputRow, noteInputRow);
                await interaction.showModal(modal);
                pool.end()
            }
        }
    } catch (err) {
        console.log(err);
        pool.end();
        await interaction.reply({ embeds: [errorEmbed], flags: MessageFlags.Ephemeral });
    }

}