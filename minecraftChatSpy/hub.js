const mineflayer = require('mineflayer')

const bot = mineflayer.createBot({
    host: 'java.lifestealsmp.com',
    username: 'pirateslays',
    version: '1.20',
    auth: 'microsoft'
})

bot.on('spawn', () => {
    console.log(`Mineflayer bot logged in as ${bot.username}`)
})

bot.on('messagestr', (rawMessage) => {
    if (!rawMessage.includes('›') || rawMessage.startsWith('DC')) return
    let message = rawMessage.split('› ')[1]
    let usernameRaw = rawMessage.split(' ›')[0]
    let spaces = usernameRaw.split(' ')
    let username = spaces[spaces.length - 1]

    console.log(username)

    console.log(message)
})

bot.on('kicked', console.log)
bot.on('error', console.log)