module.exports = {
    encode: async (string) => {
        let stringEncoded = string.replaceAll(/\\/g, '\\\\')
        stringEncoded = stringEncoded.replaceAll(/"/g, '\\"')
        stringEncoded = stringEncoded.replaceAll(/'/g, "\\'")
        stringEncoded = stringEncoded.replaceAll(/\\--/g, "")
        stringEncoded = stringEncoded.replaceAll(/;/g, ':')
        return stringEncoded;
    }
}