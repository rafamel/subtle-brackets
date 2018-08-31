import * as logger from 'loglevel';
import * as prefix from 'loglevel-plugin-prefix';
import config from '../config';

// Set up logger
logger.setLevel(config.logger);

// Set up prefix
prefix.reg(logger);
prefix.apply(logger, {
  format(level, name, timestamp) {
    return `${level.toUpperCase()}/${timestamp}`;
  }
});

export default logger;
