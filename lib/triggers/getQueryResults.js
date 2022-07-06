const mysql = require('mysql');
const {readPool} = require('./../../helpers/query')
const log = require('./../../helpers/logger');
const rabbitmq = require('./../../helpers/rabbit');

module.exports.process = async function processTrigger(msg, cfg, snapshot = {}) {
	try {		 
		
		log.info("Inside mysqlConnector()");
        log.info("Msg=" + JSON.stringify(msg));
        log.info("Config=" + JSON.stringify(cfg));
        log.info("Snapshot=" + JSON.stringify(snapshot));
		
		let {
				query, 
				host,
				user,
				password,
				database,
				port
			} = cfg;
		
		if (!host) {
			this.emit('error', 'Database host parameter missing.');
			throw new Error('Database host parameter missing.');
		}
		if (!user) {
			this.emit('error', 'Database user name parameter missing.');
			throw new Error('Database user name parameter missing.');
		}
		if (!password) {
			this.emit('error', 'Database password parameter missing.');
			throw new Error('Database password parameter missing.');
		}
		if (!database) {
			this.emit('error', 'Database name parameter missing.');
			throw new Error('Database name parameter missing.');
		}
		if (!port) {
			this.emit('error', 'Database port parameter missing.');
			throw new Error('Database port parameter missing.');
		}
		
		const pool = mysql.createPool({
			host,
			user,
			password,
			database,
			port
		});
		console.log('Connection pool started...');
		
		if (!query) {
			this.emit('error', 'No query to be excecuted.');
			throw new Error('No query to be excecuted.');
		}
		
		snapshot.lastUpdated = snapshot.lastUpdated || new Date();
		
		async function get_data() {
			try {
				readPool (pool, query, (result) => {
					return result;
				});
			} catch (err) {
				log.error(`ERROR: ${e}`);
        		this.emit('error', e);
			}
		}
		
		const data = await get_data();

        if (data.length > 0) {
            data.forEach(r => {
                const emitData = {data: r};
                log.info(emitData);
                this.emit('data', emitData);
            });
            snapshot.lastUpdated = new Date();
            log.info(`New snapshot: ${snapshot.lastUpdated}`);
            this.emit('snapshot', snapshot);
        } else {
            this.emit('snapshot', snapshot);
        }

        log.info('Finished execution');
        this.emit('end');
		
	} catch (e) {
        log.error(`ERROR: ${e}`);
        this.emit('error', e);
        await rabbitmq.producerMessage(e);
    }
};



