
require('dotenv').config();
const express = require('express');
const mysql = require('mysql');
const app = express();
const {readPool} = require('./../helpers/query')

const PORT = process.env.PORT || 5000;

app.use(express.json());

app.get("/",(req, res) => {
	res.send("Service ready.");
});

app.post("/", async (req, res) => {
	try {		 
		const {
				query, 
				host,
				user,
				password,
				database,
				port
			} = req.body;
		
		if (!host) {
			return res.status(400).json({msg: 'Database host parameter missing.'});
		}
		if (!user) {
			return res.status(400).json({msg: 'Database user name parameter missing.'});
		}
		if (!password) {
			return res.status(400).json({msg: 'Database password parameter missing.'});
		}
		if (!database) {
			return res.status(400).json({msg: 'Database name parameter missing.'});
		}
		if (!port) {
			return res.status(400).json({msg: 'Database port parameter missing.'});
		}
		const pool = mysql.createPool({
			host,
			user,
			password,
			database,
			port
		});
		
		if (!query) {
			return res.status(400).json({msg: 'No query to be excecuted.'});
		}
		//console.log(query);
		readPool (pool, query, (result) => {
			res.json(result);
		});
	} catch (err) {
		res.status(400).json(error);
	}
});

app.listen(PORT, () => {
	console.log("Server running on port 3000...");
});


