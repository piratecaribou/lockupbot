module.exports = async (pool, username, message) => {
    let query = "INSERT INTO messages (username, content) VALUES (?, ?)"
    let [result] = await pool.query(query, [username, message]);

    await pool.query("DELETE FROM messages WHERE timestamp < NOW() - INTERVAL 5 MINUTE");

    return result.insertId;
}