const logger = {
  info: (message, metadata = {}) => {
    console.log(`[INFO] ${message}`, metadata); // eslint-disable-line no-console
  },
  warn: (message, metadata = {}) => {
    console.warn(`[WARN] ${message}`, metadata); // eslint-disable-line no-console
  },
  error: (message, metadata = {}) => {
    console.error(`[ERROR] ${message}`, metadata); // eslint-disable-line no-console
  }
};

module.exports = { logger };
