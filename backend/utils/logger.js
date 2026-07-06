const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    process.env.NODE_ENV === 'production'
      ? winston.format.json()
      : winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
            let log = `${timestamp} [${level}]: ${message}`;
            if (Object.keys(meta).length) {
              log += ` ${JSON.stringify(meta)}`;
            }
            if (stack) {
              log += `\n${stack}`;
            }
            return log;
          })
        )
  ),
  transports: [
    new winston.transports.Console()
  ]
});

module.exports = logger;
