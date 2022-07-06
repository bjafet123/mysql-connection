const mysql = require('mysql');

function read (connection, query, callback) {
	connection.query(query, function (err, result) {
		if (err) throw new Error('No connection established.');
		callback(result);
		connection.end();
	});
}

function readPool (pool, query, callback) {
	pool.getConnection(function (err, connection) {
		if (err) throw err;
		connection.query(query, function (err, result) {
			if (err) throw new Error('No connection established.');;
			callback(result);
			connection.release();
		});
	});
}

module.exports = {readPool}