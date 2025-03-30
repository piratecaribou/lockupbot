const mysql = require("mysql2/promise");
const { databaseHost, databaseName, databaseUsername, databasePassword, request} = require("../../config.json");
const authenticator = require("../functions/authenticator");
const findCase = require("../functions/findCase");
const { EmbedBuilder, MessageFlags, ActionRowBuilder, ButtonBuilder, ButtonStyle} = require("discord.js");

module.exports = async (interaction) => {

    const caseIDInput = interaction.options.getString("case-id");
    const usernameInput = interaction.options.getString("username");
    const userInput = interaction.options.getUser("user");

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
    if (roleResultAuthenticator !== "user" && roleResultAuthenticator !== "admin") {
        const unauthorizedEmbed = new EmbedBuilder()
            .setColor(0xB22222)
            .setDescription("You do not have access to the evidence lockup system. If you believe this is a mistake, or would like to request access please use: " + request)
        await interaction.editReply({ embeds: [unauthorizedEmbed], flags: MessageFlags.Ephemeral });
        pool.end()
        return
    }

    // If CaseID Is Filled Out
    if (!caseIDInput == "") {
        // Call Module
        await findCase(interaction, caseIDInput, null, null, null);
        pool.end()

        // If Username Found
    } else if (!usernameInput == "") {

        // Gets Count Of Records That Matches Input
        try {
            const query = "SELECT COUNT(perpetrator) FROM cases WHERE perpetrator = ?"
            const [countResults] = await pool.query(query, usernameInput);
            const count = countResults[0]['COUNT(perpetrator)'];

            // If No Cases Under Username Provided
            if (count === 0) {
                const usernameNotFoundEmbed = new EmbedBuilder()
                    .setColor(0xB22222)
                    .setDescription("Sorry; we could not find a case under that username. This could mean there are no cases logged under this username.")
                await interaction.editReply({ embeds: [usernameNotFoundEmbed], flags: MessageFlags.Ephemeral });
                pool.end()

                // If A Case Is Found
            } else{

                // Find Cases Vars
                let caseID, reason, time, sendCaseButton

                // Find Cases Matching Username
                const query2 = "SELECT caseID, reason, time FROM cases WHERE perpetrator = ? ORDER BY time DESC"
                const [result] = await pool.query(query2, usernameInput);

                // If Only One Case
                if (count === 1) {
                    await findCase(interaction, result[0].caseID, null, null, null)
                    pool.end()
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
                pool.end()
            }
        } catch (err) {
            await interaction.editReply({ embeds: [errorEmbed], flags: MessageFlags.Ephemeral });
            console.log(err);
            pool.end()
        }
        // If Discord User Found
    } else if (!userInput == "") {
        // Gets Count Of Records That Matches Input
        try {
            const query = "SELECT COUNT(perpetrator) FROM cases WHERE perpetrator = ?"
            const [countResults] = await pool.query(query, userInput.id);
            const count = countResults[0]['COUNT(perpetrator)'];

            // If No Cases Under Username Provided
            if (count === 0) {
                const usernameNotFoundEmbed = new EmbedBuilder()
                    .setColor(0xB22222)
                    .setDescription("Sorry; we could not find a case under that user. This could mean there are no cases logged under this username.")
                await interaction.editReply({ embeds: [usernameNotFoundEmbed], flags: MessageFlags.Ephemeral });
                pool.end()
                // If A Case Is Found
            } else{

                // Find Cases Vars
                let caseID, reason, time, sendCaseButton

                // Find Cases Matching Username
                const query2 = "SELECT caseID, reason, time FROM cases WHERE perpetrator = ? ORDER BY time DESC"
                const [result] = await pool.query(query2, userInput.id);

                // If Only One Case
                if (count === 1) {
                    await findCase(interaction, result[0].caseID, null, null, null)
                    pool.end()
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
                    .setDescription("Discord Punishments For: " + userInput.toString())
                    .addFields(
                        {name: "**Case ID**", value: caseID, inline: true},
                        {name: "**Reason**", value: reason, inline: true},
                        {name: "**Date**", value: time, inline: true})
                await interaction.editReply({ embeds: [successEmbed], components: [sendCaseButton], flags: MessageFlags.Ephemeral });
                pool.end()
            }
        } catch (err) {
            await interaction.editReply({ embeds: [errorEmbed], flags: MessageFlags.Ephemeral });
            console.log(err);
            pool.end()
        }
        // If No Options Inputted
    } else {
        const noInputsEmbed = new EmbedBuilder()
            .setColor(0xB22222)
            .setDescription("You did not input any options. Please specify a Case ID, Username, or User.")
        await interaction.editReply({ embeds: [noInputsEmbed], flags: MessageFlags.Ephemeral });
        pool.end()
    }
}