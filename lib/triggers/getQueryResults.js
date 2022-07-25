const mysql = require('mysql');
const rabbitmq = require('rabbitmqcg-nxg-oih');
const {readPool} = require('../../helpers/query');
const log = require('../../helpers/logger');

const ERROR_PROPERTY = 'Error missing property';

/**
 * Method for execute query from mysql database
 * @param msg
 * @param cfg
 * @param snapshot
 * @returns {Promise<void>}
 */
module.exports.process = async function processTrigger(msg, cfg, snapshot = {}) {
    try {

        log.info('Inside processTrigger()');
        log.info('Msg=', JSON.stringify(msg));
        log.info('Config=', JSON.stringify(cfg));
        log.info('Snapshot=', JSON.stringify(snapshot));

        let {data} = msg;

        let properties = {
            database: null,
            host: null,
            password: null,
            port: null,
            query: null,
            user: null
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
            host: properties.host,
            user: properties.user,
            password: properties.password,
            database: properties.database,
            port: properties.port
        });
        log.info('Connection pool started...');

        snapshot.lastUpdated = snapshot.lastUpdated || new Date();

        const _data = await readPool(pool, properties.query);

        if (_data.length > 0) {
            log.info('data', _data);
            this.emit('data', {data: _data});
        } else {
            log.info('data', 'Query successfully executed');
            this.emit('data', {data: 'Query successfully executed'});
        }

        snapshot.lastUpdated = new Date();
        log.info(`New snapshot: ${snapshot.lastUpdated}`);
        this.emit('snapshot', snapshot);

        log.info('Finished execution');
        this.emit('end');

    } catch (e) {
        log.error(`ERROR: ${e}`);
        this.emit('error', e);
        await rabbitmq.producerErrorMessage(msg.toString(), e.toString());
    }
};
