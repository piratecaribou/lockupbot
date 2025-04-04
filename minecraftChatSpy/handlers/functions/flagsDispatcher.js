module.exports = async (pool, username, message, service, flag, certainty) => {
    // If regex
    if (service === null) {
        // Query mysql database
        let query = "INSERT INTO flags (username, message, service, flag, certainty) VALUES (?, ?, ?, ?, ?)"
        let [result] = await pool.query(query, [username, message, "regex", flag, null]);
        return result.insertId;

        // If AI
    } else {
        // Query mysql database
        let query = "INSERT INTO flags (username, message, service, flag, certainty) VALUES (?, ?, ?, ?, ?)"
        let [result] = await pool.query(query, [username, message, "ai", flag, certainty]);
        return result.insertId;
    }

}