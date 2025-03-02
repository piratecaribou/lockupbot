const sanitize = require("./sqlSanitize");
const edit = require("../../config.json");
const path = require("path");
const {AttachmentBuilder, EmbedBuilder, MessageFlags} = require("discord.js");
const mysql = require("mysql2/promise");

module.exports = async (interaction) => {

    // Error Embed
    const errorEmbed = new EmbedBuilder()
        .setColor(0xB22222)
        .setDescription("An error occurred during this process, please alert <@658043211591450667>.")

    // Query MySQL Database
    const connection = await mysql.createConnection({
        host: databaseHost,
        user: databaseUsername,
        database: databaseName,
        password: databasePassword,
    });

    // Query MySql
    try {
        const [results] = await connection.query(
            "SELECT * FROM cases WHERE caseID = '" + await sanitize.encode(interaction.options.getString("case-id")) + "';");
        connection.end();

        // If CaseID Found
        if (results.length > 0) {
            const {caseID, platform, perpetrator, executor, reason, evidence, time, note} = results[0];
            let evidenceArray = evidence.split(",");
            for (let i = 0; i < evidenceArray.length; i++) {
                const evidencePath = path.join("./evidence", evidenceArray[i]);
                const evidenceAttachment = new AttachmentBuilder(evidencePath)
                    .setName(evidenceArray[i]);
                // If Last Piece Of Evidence
                if ((i + 1) === evidenceArray.length) {
                    // If First Loop
                    if (i === 0) {
                        // If A Minecraft Punishment
                        if (platform === "minecraft") {
                            // If No Note Recorded
                            if (note === "") {
                                const successEmbed = new EmbedBuilder()
                                    .setColor(0x008080)
                                    .setDescription("Found a minecraft punishment.")
                                    .addFields(
                                        {name: "**Punished Player**", value: "`" + perpetrator + "`", inline: true},
                                        {name: "**Reason**", value: "`" + reason + "`", inline: true},
                                        {name: "**Case ID**", value: "`" + caseID + "`", inline: true},
                                        {name: "**Case Information**", value: "`🏹` <@" + executor + ">\n" + "`🕰️` <t:" + time + ":R>", inline: true},
                                        {name: "", value: "If you made a mistake, or would like to add something, you can edit the case using " + edit + ".", inline: true})
                                await interaction.editReply({embeds: [successEmbed], content: "", files: [evidenceAttachment], flags: MessageFlags.Ephemeral});
                                // Note Recorded
                            } else {
                                const successEmbed = new EmbedBuilder()
                                    .setColor(0x008080)
                                    .setDescription("Found a minecraft punishment.")
                                    .addFields(
                                        {name: "**Punished Player**", value: "`" + perpetrator + "`", inline: true},
                                        {name: "**Reason**", value: "`" + reason + "`", inline: true},
                                        {name: "**Case ID**", value: "`" + caseID + "`", inline: true},
                                        {name: "**Case Information**", value: "`🏹` <@" + executor + ">\n" + "`🕰️` <t:" + time + ":R>", inline: true},
                                        {name: "", value: "If you made a mistake, or would like to add something, you can edit the case using " + edit + ".", inline: true},
                                        {name: "**Note**", value: "```" + note + "```", inline: false})
                                await interaction.editReply({embeds: [successEmbed], content: "", files: [evidenceAttachment], flags: MessageFlags.Ephemeral});
                            }
                            // If A Discord Punishment
                        } else if (platform === "discord") {
                            // If No Note Recorded
                            if (note === "") {
                                const successEmbed = new EmbedBuilder()
                                    .setColor(0x008080)
                                    .setDescription("Found a discord punishment.")
                                    .addFields(
                                        {name: "**Punished User**", value: "<@" + perpetrator + ">", inline: true},
                                        {name: "**Reason**", value: "`" + reason + "`", inline: true},
                                        {name: "**Case ID**", value: "`" + caseID + "`", inline: true},
                                        {name: "**Case Information**", value: "`🏹` <@" + executor + ">\n" + "`🕰️` <t:" + times + ":R>", inline: true},
                                        {name: "", value: "If you made a mistake, or would like to add something, you can edit the case using " + edit + ".", inline: true})
                                await interaction.editReply({embeds: [successEmbed], content: "", files: [evidenceAttachment], flags: MessageFlags.Ephemeral});
                                // Note Recorded
                            } else {
                                const successEmbed = new EmbedBuilder()
                                    .setColor(0x008080)
                                    .setDescription("Found a discord punishment.")
                                    .addFields(
                                        {name: "**Punished User**", value: "<@" + perpetrator + ">", inline: true},
                                        {name: "**Reason**", value: "`" + reason + "`", inline: true},
                                        {name: "**Case ID**", value: "`" + caseID + "`", inline: true},
                                        {name: "**Case Information**", value: "`🏹` <@" + executor + ">\n" + "`🕰️` <t:" + times + ":R>", inline: true},
                                        {name: "", value: "If you made a mistake, or would like to add something, you can edit the case using " + edit + ".", inline: true},
                                        {name: "**Note**", value: "```" + note + "```", inline: false})
                                await interaction.editReply({embeds: [successEmbed], content: "", files: [evidenceAttachment], flags: MessageFlags.Ephemeral});
                            }
                        }
                        // If Not First Loop
                    } else {
                        // If A Minecraft Punishment
                        if (platform === "minecraft") {
                            // If No Note Recorded
                            if (note === "") {
                                const successEmbed = new EmbedBuilder()
                                    .setColor(0x008080)
                                    .setDescription("Found a minecraft punishment.")
                                    .addFields(
                                        {name: "**Punished Player**", value: "`" + perpetrator + "`", inline: true},
                                        {name: "**Reason**", value: "`" + reason + "`", inline: true},
                                        {name: "**Case ID**", value: "`" + caseID + "`", inline: true},
                                        {name: "**Case Information**", value: "`🏹` <@" + executor + ">\n" + "`🕰️` <t:" + time + ":R>", inline: true},
                                        {name: "", value: "If you made a mistake, or would like to add something, you can edit the case using " + edit + ".", inline: true})
                                await interaction.followUp({content: `Evidence ${(i + 1)}:`, embeds: [successEmbed], files: [evidenceAttachment], flags: MessageFlags.Ephemeral});
                                // Note Recorded
                            } else {
                                const successEmbed = new EmbedBuilder()
                                    .setColor(0x008080)
                                    .setDescription("Found a minecraft punishment.")
                                    .addFields(
                                        {name: "**Punished Player**", value: "`" + perpetrator + "`", inline: true},
                                        {name: "**Reason**", value: "`" + reason + "`", inline: true},
                                        {name: "**Case ID**", value: "`" + caseID + "`", inline: true},
                                        {name: "**Case Information**", value: "`🏹` <@" + executor + ">\n" + "`🕰️` <t:" + time + ":R>", inline: true},
                                        {name: "", value: "If you made a mistake, or would like to add something, you can edit the case using " + edit + ".", inline: true},
                                        {name: "**Note**", value: "```" + note + "```", inline: false})
                                await interaction.followUp({content: `Evidence ${(i + 1)}:`, embeds: [successEmbed], files: [evidenceAttachment], flags: MessageFlags.Ephemeral});
                            }
                            // If A Discord Punishment
                        } else if (platform === "discord") {
                            // If No Note Recorded
                            if (note === "") {
                                const successEmbed = new EmbedBuilder()
                                    .setColor(0x008080)
                                    .setDescription("Found a discord punishment.")
                                    .addFields(
                                        {name: "**Punished User**", value: "<@" + perpetrator + ">", inline: true},
                                        {name: "**Reason**", value: "`" + reason + "`", inline: true},
                                        {name: "**Case ID**", value: "`" + caseID + "`", inline: true},
                                        {name: "**Case Information**", value: "`🏹` <@" + executor + ">\n" + "`🕰️` <t:" + times + ":R>", inline: true},
                                        {name: "", value: "If you made a mistake, or would like to add something, you can edit the case using " + edit + ".", inline: true})
                                await interaction.followUp({content: `Evidence ${(i + 1)}:`, embeds: [successEmbed], files: [evidenceAttachment], flags: MessageFlags.Ephemeral});
                                // Note Recorded
                            } else {
                                const successEmbed = new EmbedBuilder()
                                    .setColor(0x008080)
                                    .setDescription("Found a discord punishment.")
                                    .addFields(
                                        {name: "**Punished User**", value: "<@" + perpetrator + ">", inline: true},
                                        {name: "**Reason**", value: "`" + reason + "`", inline: true},
                                        {name: "**Case ID**", value: "`" + caseID + "`", inline: true},
                                        {name: "**Case Information**", value: "`🏹` <@" + executor + ">\n" + "`🕰️` <t:" + times + ":R>", inline: true},
                                        {name: "", value: "If you made a mistake, or would like to add something, you can edit the case using " + edit + ".", inline: true},
                                        {name: "**Note**", value: "```" + note + "```", inline: false})
                                await interaction.followUp({content: `Evidence ${(i + 1)}:`, embeds: [successEmbed], files: [evidenceAttachment], flags: MessageFlags.Ephemeral})
                            }
                        }
                    }
                    // If Not Last Piece Of Evidence
                } else {
                    // If First Message
                    if (i === 0) {
                        await interaction.editReply({content: `Evidence ${(i + 1)}:`, files: [evidenceAttachment], flags: MessageFlags.Ephemeral});
                        // If Second Message +
                    } else {
                        await interaction.followUp({content: `Evidence ${(i + 1)}:`, files: [evidenceAttachment], flags: MessageFlags.Ephemeral});
                    }
                }
            }
        } else { // Case ID Not Found
            const caseIDNotFoundEmbed = new EmbedBuilder()
                .setColor(0xB22222)
                .setDescription("Sorry we could not find that case. Please check the Case ID and try again.")
            await interaction.editReply({embeds: [caseIDNotFoundEmbed], flags: MessageFlags.Ephemeral});
        }
    } catch (err) {
        await interaction.editReply({embeds: [errorEmbed], flags: MessageFlags.Ephemeral});
        console.log(err);
    }
}