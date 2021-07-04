const mysql = require("mysql");

const pool = mysql.createPool({
    host: "localhost",
    database: "proyeksoa",
    user: "root",
    password: ""
});

function getConnection() {
    return new Promise(function (resolve, reject) {
        pool.getConnection(function (err, connection) {
            if (err) {
                reject(err);
            } else {
                resolve(connection);
            }
        });
    });
}

async function executeQuery(query) {
    return new Promise(async function (resolve, reject) {
        const conn = await getConnection();
        conn.query(query, function (err, result) {
            conn.release();
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
}

module.exports = {
    "getConnection": getConnection,
    "executeQuery": executeQuery
}