const mysql = require('mysql');
const log = require('./logger');

async function readPool(pool, query) {
    return new Promise((resolve, reject) => {
        pool.getConnection(function (err, connection) {
            if (err) reject(err);
            connection.query(query, function (err, result) {
                if (err) reject(err);
                resolve(result);
                connection.release();
            });
            log.info('Executed');
        });
    });
}

module.exports = {readPool}