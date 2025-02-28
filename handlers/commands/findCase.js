const mysql = require("mysql2/promise");
const { databaseHost, databaseName, databaseUsername, databasePassword, request, edit } = require("../../config.json");
const authenticator = require("../functions/authenticator");
const sanitize = require ("../../handlers/functions/sqlSanitize");
const { EmbedBuilder, MessageFlags, AttachmentBuilder} = require("discord.js");
const path = require("path");

module.exports = async (interaction) => {

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

    // If CaseID Is Filled Out
    if (!interaction.options.getString("case-id") == "") {

        // Mysql Query
        try {
            const [results] = await pool.query(
                "SELECT * FROM cases WHERE caseID = '" + await sanitize.encode(interaction.options.getString("case-id")) + "';"
            );
            // If CaseID Found
            if (results.length > 0) {
                const {caseID, platform, perpetrator, executor, reason, evidence, time} = results[0];
                let evidenceArray = evidence.split(",");
                for (let i = 0; i < evidenceArray.length; i++) {
                    const evidencePath = path.join("./evidence", evidenceArray[i]);
                    const evidenceAttachment = new AttachmentBuilder(evidencePath)
                        .setName(evidenceArray[i]);
                    if ( (i + 1) === evidenceArray.length ) {
                        if (i === 0) {
                            if (platform === "minecraft") {
                                const successEmbed = new EmbedBuilder()
                                    .setColor(0x008080)
                                    .setDescription("Found a minecraft punishment.")
                                    .addFields(
                                        {name: "**Punished Player**", value: "`" + perpetrator + "`", inline: true},
                                        {name: "**Reason**", value: "`" + reason + "`", inline: true},
                                        {name: "**Case ID**", value: "`" + caseID + "`", inline: true},
                                        {name: "**Case ID**", value: "`🏹` <@" + executor + ">\n" + "`🕰️` <t:" + time + ":R>", inline: true},
                                        {name: "", value: "If you made a mistake, you can edit the case using" + edit + ".", inline: true})
                                await interaction.editReply({embeds: [successEmbed], content: "", files: [evidenceAttachment], flags: MessageFlags.Ephemeral });
                            } else if (platform === "discord") {
                                const successEmbed = new EmbedBuilder()
                                    .setColor(0x008080)
                                    .setDescription("Found a discord punishment.")
                                    .addFields(
                                        {name: "**Punished User**", value: "<@" + perpetrator + ">", inline: true},
                                        {name: "**Reason**", value: "`" + reason + "`", inline: true},
                                        {name: "**Case ID**", value: "`" + caseID + "`", inline: true},
                                        {name: "**Case ID**", value: "`🏹` <@" + executor + ">\n" + "`🕰️` <t:" + times + ":R>", inline: true},
                                        {name: "", value: "If you made a mistake, you can edit the case using" + edit + ".", inline: true})
                                await interaction.editReply({embeds: [successEmbed], content: "", files: [evidenceAttachment], flags: MessageFlags.Ephemeral });
                            }
                        } else {
                            if (platform === "minecraft") {
                                const successEmbed = new EmbedBuilder()
                                    .setColor(0x008080)
                                    .setDescription("Found a minecraft punishment.")
                                    .addFields(
                                        {name: "**Punished Player**", value: "`" + perpetrator + "`", inline: true},
                                        {name: "**Reason**", value: "`" + reason + "`", inline: true},
                                        {name: "**Case ID**", value: "`" + caseID + "`", inline: true},
                                        {name: "**Case ID**", value: "`🏹` <@" + executor + ">\n" + "`🕰️` <t:" + time + ":R>", inline: true},
                                        {name: "", value: "If you made a mistake, you can edit the case using" + edit + ".", inline: true})
                                await interaction.followUp({content: `Evidence ${(i + 1)}:`, embeds: [successEmbed], files: [evidenceAttachment], flags: MessageFlags.Ephemeral});
                            } else if (platform === "discord") {
                                const successEmbed = new EmbedBuilder()
                                    .setColor(0x008080)
                                    .setDescription("Found a discord punishment.")
                                    .addFields(
                                        {name: "**Punished User**", value: "<@" + perpetrator + ">", inline: true},
                                        {name: "**Reason**", value: "`" + reason + "`", inline: true},
                                        {name: "**Case ID**", value: "`" + caseID + "`", inline: true},
                                        {name: "**Case ID**", value: "`🏹` <@" + executor + ">\n" + "`🕰️` <t:" + times + ":R>", inline: true},
                                        {name: "", value: "If you made a mistake, you can edit the case using" + edit + ".", inline: true})
                                await interaction.followUp({content: `Evidence ${(i + 1)}:`, embeds: [successEmbed], files: [evidenceAttachment], flags: MessageFlags.Ephemeral});
                            }
                        }
                    } else {
                        if (i === 0) {
                            await interaction.editReply({content: `Evidence ${(i + 1)}:`, files: [evidenceAttachment], flags: MessageFlags.Ephemeral });
                        } else {
                            await interaction.followUp({content: `Evidence ${(i + 1)}:`, files: [evidenceAttachment], flags: MessageFlags.Ephemeral });
                        }
                    }
                }
            } else { // Case ID Not Found
                const caseIDNotFoundEmbed = new EmbedBuilder()
                    .setColor(0xB22222)
                    .setDescription("Sorry we could not find that case. Please check the Case ID and try again.")
                await interaction.editReply({ embeds: [caseIDNotFoundEmbed], flags: MessageFlags.Ephemeral });
            }
        } catch (err) {
            console.log(err);
            pool.end()
            return
        }
    }
}