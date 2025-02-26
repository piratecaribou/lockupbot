const { MessageFlags, EmbedBuilder} = require("discord.js");
const mysql = require("mysql2/promise");
const OpenAI = require("openai");
const { databaseHost, databaseName, databaseUsername, databasePassword, apikey } = require("../../config.json");
const sanitize = require ("../functions/sqlSanitize");

module.exports = async (interaction) => {
    // Validity
    let valid = false;

    // Get CaseID
    const caseID = interaction.customId.split("-")[1];

    // Error Embed
    const errorEmbed = new EmbedBuilder()
        .setColor(0xB22222)
        .setDescription("An error occurred during this process, please alert <@658043211591450667>.")

    while (valid === false) {
        // Query MySQL Database
        const connection = await mysql.createConnection({
            host: databaseHost,
            user: databaseUsername,
            database: databaseName,
            password: databasePassword,
        });

        try {
            const [results] = await connection.query(
                "SELECT perpetrator, reason FROM cases WHERE caseID = '" + caseID + "'"
            );
            connection.end();

            // Get Data From Database
            const username = results[0].perpetrator
            const reason = results[0].reason

            // Retrieve OpenAi Key From Config.JSON
            const openai = new OpenAI({
                apiKey: apikey,
            });

            // Send Chat Completion Request
            const response = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    {
                        "role": "system",
                        "content": [
                            {
                                "text": "You will be provided with a punishment reason, off that reason you must decide what actions to take against the user. You must use the information supplied to you from the following information. You should be consistent with the actions you provide.\nFor Bans, If the report reason is or with words to the same effect:\n“hacking” or “hacks”, use the !hacking flag.\n “Blacklisted Mods”, “Mods” or “Disallowed Mods” use the !blacklisted-mods flag.\n “Off Server Trading” use the !off-server-trading flag.\n“Inappropriate skin” use the !inappropriate-skin flag.\n“Inappropriate name” use the !inappropriate-name flag.\n“Aggerated racism” use the !aggravated-racism flag\n“Credit Scamming” “Scamming” “Fake Items” use the !scamming flag.\n“EasyMc” use the !easymc flag.\n“Bot account”, “Spam Bots” use the !bot-account flag.\n“Account Stealing” & “Account Hacking” use the !stealing-accounts flag.\n“Stolen Account”, “Compromised Account” & “Hacked Account use the !stolen-account flag.\n“Doxxing” use the !doxxing flag.\nFor mutes, if the report reason is or with words to the same effect: (If only toxicity is mentioned, default to a !minor flag)\n“Swearing”, “Spamming”, “Encouraging Spamming”, “Foreign Languages In Public Chat”, “Minor Toxicity” & “Toxicty” use the !minor flag.\n“Advertising”, “Talking About Controversial Topics”, “Talking About Politics” & “Moderate Toxicity”, use the !moderate flag.\n“Insulting”, “Racism”, “Homophobia”, “Sizeism”, “Ableism” “Xenophobia”, “Misogyny”, “Transphobia”, “Sexism”, “Threatening”, “Death Wishing”, “Doxx Threats”, “Doxxing Threats”, “DDOS Threats”, “Inappropriate Message Content” & “Major Toxicity”\nFor reasons that do not fit into the above categories, here are some punishment length guides:\nInappropriate Item Names: 7d (7 days)\nBug Abusing: 30d (30 days)\nFor bans that use flags, they should output the reason as “null”.\nFor mutes (!major, !moderate & !minor) & bans that use durations, relevant and coherent, and most importantly short, (should be 1-2 words long) reasons should be given. Try and be specific which the punishment reason, such as “You Retard” -> “Ableism” rather than “Insulting”. The reason outputted may be the same reason provided to you. ",
                                "type": "text"
                            }
                        ]
                    },
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": await sanitize.encode(reason)
                            }
                        ]
                    }
                ],
                response_format: {
                    "type": "json_schema",
                    "json_schema": {
                        "name": "punishment-interpretation",
                        "strict": true,
                        "schema": {
                            "type": "object",
                            "properties": {
                                "action": {
                                    "type": "string",
                                    "description": "Specifies whether the action is to ban or mute.",
                                    "enum": [
                                        "ban",
                                        "mute"
                                    ]
                                },
                                "punishment_details": {
                                    "anyOf": [
                                        {
                                            "type": "string",
                                            "description": "What type of punishment is required, if not applicable specify the length of the punishment. Only output !minor, !moderate & !major, when the action is a mute.",
                                            "enum": [
                                                "!hacking",
                                                "!blacklisted-mods",
                                                "!off-server-trading",
                                                "!inappropriate-skin",
                                                "!inappropriate-name",
                                                "!aggravated-racism",
                                                "!scamming",
                                                "!easymc",
                                                "!bot-account",
                                                "!stealing-accounts",
                                                "!stolen-account",
                                                "!doxxing",
                                                "!minor",
                                                "!moderate",
                                                "!major"
                                            ]
                                        },
                                        {
                                            "type": "string",
                                            "description": "Specifies the length of the punishment, 5 minutes = 5m, 1 hour = 1h, 7 days = 7d, permanent = permanent."
                                        }
                                    ]
                                },
                                "reason": {
                                    "type": "string",
                                    "description": "Reason for punishments."
                                }
                            },
                            "required": [
                                "action",
                                "punishment_details",
                                "reason"
                            ],
                            "additionalProperties": false
                        }
                    }
                },
                temperature: 0.25,
                max_completion_tokens: 2048,
                top_p: 1,
                frequency_penalty: 0,
                presence_penalty: 0
            });
            // Retrieve Data
            const contentString = response.choices[0].message.content;
            const contentData = JSON.parse(contentString);
            const openAiAction = contentData.action;
            const openAiReason = contentData.reason;
            const openAiPunishmentDetails = contentData.punishment_details;

            // Sending Resulting Data
            if (openAiAction === "mute") {
                if (openAiReason === "null") {
                    await interaction.editReply({
                        content: "Something Went Wrong! Re-Sending Request. Sit tight",
                        flags: MessageFlags.Ephemeral
                    })
                    continue;
                }
                await interaction.editReply({
                    content: "mute " + username + " " + openAiPunishmentDetails + " " + openAiReason,
                    flags: MessageFlags.Ephemeral
                });
                return;
            } else if (openAiAction === "ban") {
                if (openAiPunishmentDetails.startsWith("!") === true) {
                    if (openAiPunishmentDetails === "!hacking") {
                        await interaction.editReply({
                            content: "ban " + username + " " + openAiPunishmentDetails + " Cheating (1st offense)",
                            flags: MessageFlags.Ephemeral
                        });
                        await interaction.followUp({
                            content: "ban " + username + " " + openAiPunishmentDetails + " Cheating (2nd+ offense)",
                            flags: MessageFlags.Ephemeral
                        });
                        return;
                    } else if (openAiPunishmentDetails === "!blacklisted-mods") {
                        await interaction.editReply({
                            content: "ban " + username + " " + openAiPunishmentDetails + " Blacklisted mods (1st offense)",
                            flags: MessageFlags.Ephemeral
                        });
                        await interaction.followUp({
                            content: "ban " + username + " " + openAiPunishmentDetails + " Blacklisted mods (2nd offense)",
                            flags: MessageFlags.Ephemeral
                        });
                        await interaction.followUp({
                            content: "ban " + username + " " + openAiPunishmentDetails + " Blacklisted mods (3rd+ offense)",
                            flags: MessageFlags.Ephemeral
                        });
                        return;
                    } else if (openAiPunishmentDetails === "!off-server-trading") {
                        await interaction.editReply({
                            content: "ban " + username + " " + openAiPunishmentDetails + " Off-server trading (1st offense)",
                            flags: MessageFlags.Ephemeral
                        });
                        await interaction.followUp({
                            content: "ban " + username + " " + openAiPunishmentDetails + " Off-server trading (2nd offense)",
                            flags: MessageFlags.Ephemeral
                        });
                        await interaction.followUp({
                            content: "ban " + username + " " + openAiPunishmentDetails + " Off-server trading (3rd+ offense)",
                            flags: MessageFlags.Ephemeral
                        });
                        return;
                    } else if (openAiPunishmentDetails === "!inappropriate-skin") {
                        await interaction.editReply({
                            content: "ban " + username + " " + openAiPunishmentDetails + " Inappropriate skin (1st offense)",
                            flags: MessageFlags.Ephemeral
                        });
                        await interaction.followUp({
                            content: "ban " + username + " " + openAiPunishmentDetails + " Inappropriate skin (2nd+ offense)",
                            flags: MessageFlags.Ephemeral
                        });
                        return;
                    } else if (openAiPunishmentDetails === "!inappropriate-name") {
                        await interaction.editReply({
                            content: "ban " + username + " " + openAiPunishmentDetails + " Inappropriate name)",
                            flags: MessageFlags.Ephemeral
                        });
                        return;
                    } else if (openAiPunishmentDetails === "!aggravated-racism") {
                        await interaction.editReply({
                            content: "ban " + username + " " + openAiPunishmentDetails + " Aggravated racism (1st offense)",
                            flags: MessageFlags.Ephemeral
                        });
                        await interaction.followUp({
                            content: "ban " + username + " " + openAiPunishmentDetails + " Aggravated racism (2nd offense)",
                            flags: MessageFlags.Ephemeral
                        });
                        await interaction.followUp({
                            content: "ban " + username + " " + openAiPunishmentDetails + " Aggravated racism (3rd+ offense)",
                            flags: MessageFlags.Ephemeral
                        });
                        return;
                    } else if (openAiPunishmentDetails === "!scamming") {
                        await interaction.editReply({
                            content: "ban " + username + " " + openAiPunishmentDetails + " Scamming for store items (1st offense)",
                            flags: MessageFlags.Ephemeral
                        });
                        await interaction.followUp({
                            content: "ban " + username + " " + openAiPunishmentDetails + " Scamming for store items (2nd offense)",
                            flags: MessageFlags.Ephemeral
                        });
                        await interaction.followUp({
                            content: "ban " + username + " " + openAiPunishmentDetails + " Scamming for store items (3rd+ offense)",
                            flags: MessageFlags.Ephemeral
                        });
                        return;
                    } else if (openAiPunishmentDetails === "!easymc") {
                        await interaction.editReply({
                            content: "ban " + username + " " + openAiPunishmentDetails + " Using alt accounts (EasyMC)",
                            flags: MessageFlags.Ephemeral
                        });
                        return;
                    } else if (openAiPunishmentDetails === "!bot-account") {
                        await interaction.editReply({
                            content: "ban " + username + " " + openAiPunishmentDetails + " Bot Account",
                            flags: MessageFlags.Ephemeral
                        });
                        return;
                    } else if (openAiPunishmentDetails === "!stealing-accounts") {
                        await interaction.editReply({
                            content: "ban " + username + " " + openAiPunishmentDetails + " Stealing accounts",
                            flags: MessageFlags.Ephemeral
                        });
                        return;
                    } else if (openAiPunishmentDetails === "!stolen-account") {
                        await interaction.editReply({
                            content: "ban " + username + " " + openAiPunishmentDetails + " Stolen account (Safety reasons)",
                            flags: MessageFlags.Ephemeral
                        });
                        return;
                    } else if (openAiPunishmentDetails === "!doxxing") {
                        await interaction.editReply({
                            content: "ban " + username + " " + openAiPunishmentDetails + " Leaking private information (Doxxing)",
                            flags: MessageFlags.Ephemeral
                        });
                        return;
                    }

                } else if (!openAiPunishmentDetails.startsWith("!") === true) {
                    if (openAiReason === "null") {
                        await interaction.editReply({
                            content: "Something Went Wrong! Re-Sending Request. Sit tight",
                            flags: MessageFlags.Ephemeral
                        })
                        continue;
                    }
                    await interaction.editReply({
                        content: "ban " + username + " " + openAiPunishmentDetails + " " + openAiReason,
                        flags: MessageFlags.Ephemeral
                    });
                    return;
                }
            }

            // If they got here something went vry wrong
            await interaction.editReply({embeds: [errorEmbed], flags: MessageFlags.Ephemeral});
            valid = true;

        } catch (err) {
            console.log(err);
            await interaction.editReply({embeds: [errorEmbed], flags: MessageFlags.Ephemeral});
        }
    }
}