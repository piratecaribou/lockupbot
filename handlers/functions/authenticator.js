module.exports = {
    role: async (senderUserID, pool) => {
        try {
            const [results] = await pool.query(
                "SELECT role FROM users WHERE userID = '" + senderUserID + "';"
            );
            if (results.length === 0) {
                return "null"; // No user found
            }
            if (results[0].role === "user") {
                return "user";
            } else if (results[0].role === "admin") {
                return "admin";
            } else {
                return "null"; // Something vry wrong had to happen to get to this point
            }
        } catch (err) {
            console.log(err);
            return "null";
        }
    }
};
