const mysql = require('mysql');
const log = require('./logger');

function read (connection, query, callback) {
	connection.query(query, function (err, result) {
		if (err) throw new Error('No connection established.');
		callback(result);
		connection.end();
	});
}

async function readPool (pool, query) {
	return new Promise((resolve, reject) => {
		pool.getConnection(function (err, connection) {
			if (err) reject(err);
			connection.query(query, function (err, result) {
				if (err) reject(err);
				resolve(result);
				connection.release();
			});
			log.info("Executed");
		});
	});
}

module.exports = {readPool}