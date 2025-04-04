const fs = require('fs');
const path = require('path');
module.exports = async (pool, username, message, messageID, flagID) => {

    try {
        // Query mysql databases
        let beforeQuery = "SELECT * FROM messages WHERE id < ? ORDER BY id ASC LIMIT 10"
        let afterQuery = "SELECT * FROM messages WHERE id > ? ORDER BY id ASC LIMIT 10"

        let [beforeMessages] = await pool.query(beforeQuery, [messageID])
        let [afterMessages] = await pool.query(afterQuery, [messageID])

        // If less than 10 messages after
        let attempts = 0;
        while (afterMessages.length < 10 && attempts !== 5) {
            attempts++;

            // Wait before retrying - 5s
            await new Promise(resolve => setTimeout(resolve, 5000));

            // Re query database
            [afterMessages] = await pool.query(afterQuery, [messageID])
        }

        // Produce file
        let chatLog = ""
        for (let i = 0; i < beforeMessages.length; i++) {
            chatLog = chatLog + beforeMessages[i].username +  ' › ' + beforeMessages[i].content + '\n'
        }
        chatLog = chatLog + '[2;34m[2;36m[2;34m[1;34m[1;34m[1;34m[1;34m[1;34m[1;34m[1;37m[1;34m[1;31m[1;36m' + username + '[0m[1;31m[0m[1;34m [1;30m›[0m[1;34m[0m[1;37m ' + message + '[0m[1;34m[0m[1;34m[0m[1;34m[0m[1;34m[0m[1;34m[0m[1;34m[0m[2;34m[0m[2;36m[0m[2;34m[0m\n'
        for (let i = 0; i < afterMessages.length; i++) {
            chatLog = chatLog + afterMessages[i].username +  ' › ' + afterMessages[i].content + '\n'
        }

        // Write file
        const evidencePath = path.join("./chatLogs", flagID + ".txt")
        fs.writeFileSync(evidencePath, chatLog)
    } catch (err) {
        console.log(err)
    }
}