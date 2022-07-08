const mysql = require('mysql');
const {readPool} = require('../../helpers/query')
const log = require('../../helpers/logger');
const rabbitmq = require('../../helpers/rabbit');

const ERROR_PROPERTY = 'Error missing property';

module.exports.process = async function processTrigger(msg, cfg, snapshot = {}) {
	try {		 
		
		log.info("Inside mysqlConnector()");
        log.info("Msg=" + JSON.stringify(msg));
        log.info("Config=" + JSON.stringify(cfg));
        log.info("Snapshot=" + JSON.stringify(snapshot));
		
		let {data} = msg;
		
		let properties = {
            database: null,
            host: null,
            port: null,
            user: null,
            password: null,
            query: null
        };
		
		if (!data) {
            this.emit('error', `${ERROR_PROPERTY} data`);
            throw new Error(`${ERROR_PROPERTY} data`);
        }

        Object.keys(properties).forEach((value) => {
            if (data.hasOwnProperty(value)) {
                properties[value] = data[value];
            } else if (cfg.hasOwnProperty(value)) {
                properties[value] = cfg[value];
            } else {
                log.error(`${ERROR_PROPERTY} ${value}`);
                throw new Error(`${ERROR_PROPERTY} ${value}`);
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
            this.emit('data', {_data});
        } else {
			log.info("data", "Query successfully executed");
			this.emit('data', {_data: "Query successfully executed"});
        }
        
        snapshot.lastUpdated = new Date();
        log.info(`New snapshot: ${snapshot.lastUpdated}`);
        this.emit('snapshot', snapshot);

        log.info('Finished execution');
        this.emit('end');
		
	} catch (e) {
        log.error(`ERROR: ${e}`);
        this.emit('error', e);
        await rabbitmq.producerMessage(e);
    }
};



