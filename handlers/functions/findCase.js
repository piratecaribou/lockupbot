const { databaseHost, databaseName, databaseUsername, databasePassword, edit } = require("../../config.json");
const path = require("path");
const {AttachmentBuilder, EmbedBuilder, MessageFlags} = require("discord.js");
const mysql = require("mysql2/promise");

module.exports = async (interaction, caseID, description) => {

    // Error Embed
    const errorEmbed = new EmbedBuilder()
        .setColor(0xB22222)
        .setDescription("An error occurred during this process, please alert <@658043211591450667>.")

    // Embed Function
    async function createEmbed({ platform, description, perpetrator, reason, caseID, executor, time, note }) {
        const embed = new EmbedBuilder()
            .setColor(0x008080)
            .setDescription(description);

        // Perp Field
        const punishedField =
            platform === "minecraft"
                ? { name: "**Punished Player**", value: "`" + perpetrator + "`", inline: true }
                : { name: "**Punished User**", value: "<@" + perpetrator + ">", inline: true };

        embed.addFields(
            punishedField,
            { name: "**Reason**", value: "`" + reason + "`", inline: true },
            { name: "**Case ID**", value: "`" + caseID + "`", inline: true },
            { name: "**Case Information**", value: "`🏹` <@" + executor + ">\n" + "`🕰️` <t:" + time + ":R>", inline: true },
            { name: "", value: "If you made a mistake, or would like to add something, you can edit the case using " + edit + ".", inline: true }
        );

        // Add Note Field
        if (note !== null) {
            embed.addFields({ name: "**Note**", value: "```" + note + "```", inline: false });
        }
        return embed;
    }

    // Query MySQL Database
    const connection = await mysql.createConnection({
        host: databaseHost,
        user: databaseUsername,
        database: databaseName,
        password: databasePassword,
    });

    // Query MySql
    try {
        const query = "SELECT * FROM cases WHERE caseID = ?";
        const [results] = await connection.query(query, [caseID]);
        connection.end();

        // If CaseID Found
        if (results.length > 0) {
            const {caseID, platform, perpetrator, executor, reason, evidence, time, note} = results[0];

            // Create Description If Null
            if (description == null) {
                description = platform === "minecraft" ? "Found a minecraft punishment." : "Found a discord punishment.";
            }


            let evidenceArray = evidence.split(",");
            for (let i = 0; i < evidenceArray.length; i++) {
                const evidencePath = path.join("./evidence", evidenceArray[i]);
                const evidenceAttachment = new AttachmentBuilder(evidencePath).setName(evidenceArray[i]);
                const embed = await createEmbed({
                    platform,
                    description,
                    perpetrator,
                    reason,
                    caseID,
                    executor,
                    time,
                    note,
                });

                // If Last Piece Of Evidence
                if ((i + 1) === evidenceArray.length) {
                    // If First Loop
                    if (i === 0) {
                        await interaction.editReply({
                            embeds: [embed],
                            content: "",
                            files: [evidenceAttachment],
                            flags: MessageFlags.Ephemeral,
                        });
                        // If Not First Loop
                    } else {
                        await interaction.followUp({
                            content: `Evidence ${i + 1}:`,
                            embeds: [embed],
                            files: [evidenceAttachment],
                            flags: MessageFlags.Ephemeral,
                        });
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
            console.log("Case ID Not Found");
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