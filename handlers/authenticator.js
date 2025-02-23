const mysql = require('mysql2/promise')
const { databaseHost, databaseName, databaseUsername, databasePassword } = require('../config.json');
module.exports = {
    role: async (senderUserID) => {

        const connection = await mysql.createConnection({
            //config.json
            host: databaseHost,
            user: databaseUsername,
            database: databaseName,
            password: databasePassword
        });

        try {
            const [results] = await connection.query(
                "SELECT role FROM users WHERE userID = '" + senderUserID + "';"
            );
            if (results.length === 0) {
                return 'null'; // No user found
            }
            if (results[0].role === 'user') {
                return 'user';
            } else if (results[0].role === 'admin') {
                return 'admin';
            } else {
                return 'null'; // Something vry wrong had to happen to get to this point
            }
        } catch (err) {
            console.log(err);
        }
    }
};
