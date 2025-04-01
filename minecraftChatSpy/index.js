const mineflayer = require('mineflayer');

function createBot() {
    // Join a server
    let bot = mineflayer.createBot({
        host: 'java.lifestealsmp.com',
        username: 'protoncaribou',
        version: '1.20',
        auth: 'microsoft'
    });

    bot.on('messagestr', (rawMessage) => {
        if (rawMessage.startsWith('[')) {
            let username = rawMessage.split(' ')[1]
            let itemNameRaw = rawMessage.split('[')[2]
            let itemName = itemNameRaw.split(']')[0]
            console.log(`Username: ${username} Item name: ${itemName}`)
        }
        // If a server message or a discord message
        if (!rawMessage.includes('›') || rawMessage.startsWith('DC')) return

        // Parse the message
        let message = rawMessage.split('› ')[1]

        // Get username
        let usernameRaw = rawMessage.split(' ›')[0]
        let spaces = usernameRaw.split(' ')
        let username = spaces[spaces.length - 1]
        console.log(`Username: ${username} Message: ${message}`)
    })

    // If kicked rejoin
    bot.on('end', (reason) => {
        console.log(`Bot was kicked from the server`)
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

// Call function
createBot()
