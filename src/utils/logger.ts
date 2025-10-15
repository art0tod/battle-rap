type LogMetadata = Record<string, unknown>;

interface Logger {
  info: (message: string, metadata?: LogMetadata) => void;
  warn: (message: string, metadata?: LogMetadata) => void;
  error: (message: string, metadata?: LogMetadata) => void;
}

export const logger: Logger = {
  info: (message, metadata = {}) => {
    console.log(`[INFO] ${message}`, metadata);
  },
  warn: (message, metadata = {}) => {
    console.warn(`[WARN] ${message}`, metadata);
  },
  error: (message, metadata = {}) => {
    console.error(`[ERROR] ${message}`, metadata);
  }
};
