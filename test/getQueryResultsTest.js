
require('dotenv').config();
const mysql = require('mysql');
const express = require('express');
const app = express();
const {readPool} = require('./../helpers/query')
const log = require('../helpers/logger');
const rabbitmq = require('../helpers/rabbit');

const PORT = process.env.PORT || 5000;

app.use(express.json());

app.post("/", async (req, res) => {
	try {		 
		
		const {data} = req.body;
        const {cfg} = req.body;
        let snapshot = {};
		
		let properties = {
            database: null,
            host: null,
            port: null,
            user: null,
            password: null,
            query: null
        };
		
		if (!data) {
            res.status(401).json('Error missing data property');
            return;
        }
        if (!cfg) {
            res.status(401).json('Error missing cfg property');
            return;
        }
        
        Object.keys(properties).forEach((value) => {
            if (data.hasOwnProperty(value)) {
                properties[value] = data[value];
            } else if (cfg.hasOwnProperty(value)) {
                properties[value] = cfg[value];
            } else {
                log.error('ERROR missing property', value);
                throw new Error(`ERROR missing property, ${value}`);
            }
        });
        
		const pool = mysql.createPool({
			host : properties.host,
			user : properties.user,
			password : properties.password,
			database : properties.database,
			port : properties.port
		});
		log.info('Connection pool started...');
		
		snapshot.lastUpdated = snapshot.lastUpdated || new Date();
		
		const _data = await readPool(pool, properties.query);
		log.info("data", _data);
		
		if (_data.length > 0) {
			log.info("data", _data);
            res.json(_data);
        } else {
			log.info("data", "Query successfully executed");
			res.json("Query successfully executed");
        }
        
        snapshot.lastUpdated = new Date();
        log.info(`New snapshot: ${snapshot.lastUpdated}`);
		
		log.info('Finished execution');
        log.info('end');
	} catch (e) {
		log.error(`ERROR: ${e}`);
        await rabbitmq.producerMessage(e);
        res.status(500).json(e);
	}
});

app.listen(PORT, () => log.info('Service up in port', PORT));

