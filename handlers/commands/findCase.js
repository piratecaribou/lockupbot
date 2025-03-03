const mysql = require("mysql2/promise");
const { databaseHost, databaseName, databaseUsername, databasePassword, request} = require("../../config.json");
const authenticator = require("../functions/authenticator");
const sanitize = require ("../../handlers/functions/sqlSanitize");
const findCase = require("../functions/findCase");
const { EmbedBuilder, MessageFlags, ActionRowBuilder, ButtonBuilder, ButtonStyle} = require("discord.js");

module.exports = async (interaction) => {

    // Error Embed
    const errorEmbed = new EmbedBuilder()
        .setColor(0xB22222)
        .setDescription("An error occurred during this process, please alert <@658043211591450667>.")

    // Open Mysql pool
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

    // If CaseID Is Filled Out
    if (!interaction.options.getString("case-id") == "") {
        // Call Module
        await findCase(interaction, interaction.options.getString("case-id"));

        // If Username Found
    } else if (!interaction.options.getString("username") == "") {

        // Gets Count Of Records That Matches Input
        try {
            const [countResults] = await pool.query(
                "SELECT COUNT(perpetrator) FROM cases WHERE perpetrator = '" + await sanitize.encode(interaction.options.getString("username")) + "';")
            const count = countResults[0]['COUNT(perpetrator)'];

            // If No Cases Under Username Provided
            if (count === 0) {
                const usernameNotFoundEmbed = new EmbedBuilder()
                    .setColor(0xB22222)
                    .setDescription("Sorry; we could not find a case under that username. This could mean there are no cases logged under this username.")
                await interaction.editReply({ embeds: [usernameNotFoundEmbed], flags: MessageFlags.Ephemeral });

                // If A Case Is Found
            } else{

                // Find Cases Vars
                let caseID, reason, time, sendCaseButton

                // Find Cases Matching Username
                const [result] = await pool.query(
                    "SELECT caseID, reason, time FROM cases WHERE perpetrator = '" + await sanitize.encode(interaction.options.getString("username")) + "' ORDER BY time DESC;")

                // If Only One Case
                if (count === 1) {
                    await findCase(interaction, result[0].caseID)
                    return
                }

                // Loop Through Cases
                for (let i = 0; i < count; i++) {
                    // If First Iteration
                    if (i === 0) {
                        caseID = "`" + result[i].caseID + "`"
                        reason = "`" + result[i].reason + "`"
                        time = "<t:" + result[i].time + ":R>"

                        // Create Button
                        sendCaseButton = new ButtonBuilder()
                            .setCustomId("sendCaseButton-" + result[i].caseID)
                            .setLabel("Retrieve Most Recent Case")
                            .setEmoji("📜")
                            .setStyle(ButtonStyle.Secondary);
                        sendCaseButton = new ActionRowBuilder()
                            .addComponents(sendCaseButton);

                    } else {
                        caseID = caseID + "\n" + "`" + result[i].caseID + "`"
                        reason = reason + "\n" + "`" + result[i].reason + "`"
                        time = time + "\n" + "<t:" + result[i].time + ":R>"
                    }
                }
                // Send Embed
                const successEmbed = new EmbedBuilder()
                    .setColor(0x31AF9A)
                    .setDescription("Minecraft Punishments For: **" + interaction.options.getString("username") + "**")
                    .addFields(
                        {name: "**Case ID**", value: caseID, inline: true},
                        {name: "**Reason**", value: reason, inline: true},
                        {name: "**Date**", value: time, inline: true})
                await interaction.editReply({ embeds: [successEmbed], components: [sendCaseButton], flags: MessageFlags.Ephemeral });
            }
        } catch (err) {
            await interaction.editReply({ embeds: [errorEmbed], flags: MessageFlags.Ephemeral });
            console.log(err);
            pool.end()
        }
        // If Discord User Found
    } else if (!interaction.options.getUser("user") == "") {
        // Gets Count Of Records That Matches Input
        try {
            const [countResults] = await pool.query(
                "SELECT COUNT(perpetrator) FROM cases WHERE perpetrator = '" + interaction.options.getUser("user").id + "';")
            const count = countResults[0]['COUNT(perpetrator)'];

            // If No Cases Under Username Provided
            if (count === 0) {
                const usernameNotFoundEmbed = new EmbedBuilder()
                    .setColor(0xB22222)
                    .setDescription("Sorry; we could not find a case under that user. This could mean there are no cases logged under this username.")
                await interaction.editReply({ embeds: [usernameNotFoundEmbed], flags: MessageFlags.Ephemeral });

                // If A Case Is Found
            } else{

                // Find Cases Vars
                let caseID, reason, time, sendCaseButton

                // Find Cases Matching Username
                const [result] = await pool.query(
                    "SELECT caseID, reason, time FROM cases WHERE perpetrator = '" + interaction.options.getUser("user").id + "' ORDER BY time DESC;")

                // If Only One Case
                if (count === 1) {
                    await findCase(interaction, result[0].caseID)
                    return
                }

                // Loop Through Cases
                for (let i = 0; i < count; i++) {
                    // If First Iteration
                    if (i === 0) {
                        caseID = "`" + result[i].caseID + "`"
                        reason = "`" + result[i].reason + "`"
                        time = "<t:" + result[i].time + ":R>"

                        // Create Button
                        sendCaseButton = new ButtonBuilder()
                            .setCustomId("sendCaseButton-" + result[i].caseID)
                            .setLabel("Retrieve Most Recent Case")
                            .setEmoji("📜")
                            .setStyle(ButtonStyle.Secondary);
                        sendCaseButton = new ActionRowBuilder()
                            .addComponents(sendCaseButton);

                    } else {
                        caseID = caseID + "\n" + "`" + result[i].caseID + "`"
                        reason = reason + "\n" + "`" + result[i].reason + "`"
                        time = time + "\n" + "<t:" + result[i].time + ":R>"
                    }
                }
                // Send Embed
                const successEmbed = new EmbedBuilder()
                    .setColor(0x31AF9A)
                    .setDescription("Discord Punishments For: " + interaction.options.getUser("user").toString())
                    .addFields(
                        {name: "**Case ID**", value: caseID, inline: true},
                        {name: "**Reason**", value: reason, inline: true},
                        {name: "**Date**", value: time, inline: true})
                await interaction.editReply({ embeds: [successEmbed], components: [sendCaseButton], flags: MessageFlags.Ephemeral });
            }
        } catch (err) {
            await interaction.editReply({ embeds: [errorEmbed], flags: MessageFlags.Ephemeral });
            console.log(err);
            pool.end()
        }
        // If No Options Inputted
    } else {

    }
}