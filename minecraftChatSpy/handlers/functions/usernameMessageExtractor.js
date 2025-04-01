module.exports = {
    message: async (rawMessage) => {
        // If a server message or a discord message
        if (!rawMessage.includes('›') || rawMessage.startsWith('DC')) return
        // Parse message
        return rawMessage.split('› ')[1]
    },
    username: async (rawMessage) => {
        // If a server message or a discord message
        if (!rawMessage.includes('›') || rawMessage.startsWith('DC')) return
        // Get username
        let usernameRaw = rawMessage.split(' ›')[0]
        let spaces = usernameRaw.split(' ')
        return spaces[spaces.length - 1]
    }
}