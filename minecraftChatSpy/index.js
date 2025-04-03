const mineflayer = require('mineflayer');
const mysql = require('mysql2/promise');
const databaseDispatcher = require('./handlers/functions/databaseDispatcher.js')
const checks = require('./handlers/functions/checks.js')
const { databaseHost, databaseName, databaseUsername, databasePassword} = require("../config.json");

function createBot(){
    // Join a server
    let bot = mineflayer.createBot({
        host: 'lifestealsmp.com',
        username: 'protoncaribou',
        version: "1.20",
        auth: 'microsoft'
    });

    /*bot.on('chat', async (username, message) => {
        const checkResults = await checks(message)

        if (checkResults[0] === false) return

        await console.log(`Username: ${username} Message: ${message}`)
        await console.log(checkResults[1])

    })*/

    bot.on('messagestr', async (rawMessage) => {
        let messageID
        let checkResults
        let username
        let message
        if (rawMessage.startsWith('[')) {
            let killMSG
            try {
                killMSG = rawMessage.split('] ')[1]
                username = killMSG.split(' ')[0]
                message = killMSG.split("[")[1].split("]")[0]
            } catch (e) {
                return
            }

            messageID = await databaseDispatcher(pool, username, killMSG)
            // Check message
            checkResults = await checks(message)

            if (checkResults[0] === false) return

            if (checkResults[1] === "openai") {
                await console.log(`Username: ${username} Item name: ${message}`)
                await console.log(checkResults[2] + ", " + checkResults[3])
                return
            }

            await console.log(`Username: ${username} Item name: ${message}`)
            await console.log(checkResults[1])
        } else {
            // If a server message or a discord message
            if (!rawMessage.includes('›') || rawMessage.startsWith('DC') || rawMessage.startsWith('│')) return

            // Parse the message
            message = rawMessage.split('› ')[1]

            // Get username
            let usernameRaw = rawMessage.split(' ›')[0]
            let spaces = usernameRaw.split(' ')
            username = spaces[spaces.length - 1]

            // Send to database
            messageID = await databaseDispatcher(pool, username, message)
            // Check message
            checkResults = await checks(message)

            if (checkResults[0] === false) return

            if (checkResults[1] === "openai") {
                await console.log(`Username: ${username} Username: ${message}`)
                await console.log(checkResults[2] + ", " + checkResults[3])
                return
            }

            await console.log(`Username: ${username} Message: ${message}`)
            await console.log(checkResults[1])
        }

    })

    // If kicked rejoin
    bot.on('end', (reason) => {
        console.log(`Bot was kicked from the server: ${reason}`)
        console.log(`Reconnecting...`)
        createBot()
    })

    // If bot dies
    bot.on('death', reason => {
        bot.respawn
    })

    // Upon logging in
    bot.on('login', () => console.log(`Minecraft chat spy logged in as ${bot.username}`))

    // Upon joining new server
    bot.on('spawn', ()=> {
        bot.waitForChunksToLoad()
        bot.chat("/lifesteal")
    })
}

// Create mysql pool
const pool = mysql.createPool({
    host: databaseHost,
    user: databaseUsername,
    database: databaseName,
    password: databasePassword,
    waitForConnections: true,
    connectionLimit: 20,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
});

// Call function
createBot()
