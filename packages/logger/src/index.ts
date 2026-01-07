import fs from 'node:fs';
import path from 'node:path';
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

export type LoggerEnv = 'production' | 'development' | 'test' | (string & {});

export type Logger = winston.Logger;

export interface CreateLoggerOptions {
  service?: string;
  env?: LoggerEnv;
  level?: string;
  logDir?: string;
  enableFile?: boolean;
  maxFiles?: string;
  maxSize?: string;
}

const defaultTimestampFormat = 'YYYY-MM-DD HH:mm:ss';

function ensureDirExists(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

function normalizeLogDir(logDir: string) {
  if (path.isAbsolute(logDir)) return logDir;
  return path.resolve(process.cwd(), logDir);
}

function createConsoleFormat(env: LoggerEnv) {
  const { combine, timestamp, colorize, errors, printf } = winston.format;

  const human = printf(({ level, message, timestamp, stack, service, ...meta }) => {
    const base = `${timestamp} [${level}]${service ? ` [${service}]` : ''}: ${stack || message}`;
    const metaKeys = Object.keys(meta);
    if (metaKeys.length === 0) return base;
    try {
      return `${base} ${JSON.stringify(meta)}`;
    } catch {
      return base;
    }
  });

  if (env === 'production') {
    return combine(timestamp({ format: defaultTimestampFormat }), errors({ stack: true }), winston.format.json());
  }

  return combine(colorize(), timestamp({ format: defaultTimestampFormat }), errors({ stack: true }), human);
}

function createFileFormat() {
  const { combine, timestamp, errors } = winston.format;
  return combine(timestamp({ format: defaultTimestampFormat }), errors({ stack: true }), winston.format.json());
}

export function createLogger(options: CreateLoggerOptions = {}) {
  const env = (options.env ?? process.env.NODE_ENV ?? 'development') as LoggerEnv;
  const level = options.level ?? process.env.LOG_LEVEL ?? (env === 'production' ? 'info' : 'debug');
  const service = options.service ?? process.env.SERVICE_NAME;
  const logDir = normalizeLogDir(options.logDir ?? process.env.LOG_DIR ?? 'logs');
  const enableFile = options.enableFile ?? env === 'production';
  const maxFiles = options.maxFiles ?? process.env.LOG_MAX_FILES ?? '14d';
  const maxSize = options.maxSize ?? process.env.LOG_MAX_SIZE ?? '50m';

  const transports: winston.transport[] = [
    new winston.transports.Console({
      format: createConsoleFormat(env),
    }),
  ];

  if (enableFile) {
    ensureDirExists(logDir);

    transports.push(
      new DailyRotateFile({
        dirname: logDir,
        filename: '%DATE%.combined.log',
        datePattern: 'YYYY-MM-DD',
        zippedArchive: false,
        maxSize,
        maxFiles,
        level,
        format: createFileFormat(),
      })
    );

    transports.push(
      new DailyRotateFile({
        dirname: logDir,
        filename: '%DATE%.error.log',
        datePattern: 'YYYY-MM-DD',
        zippedArchive: false,
        maxSize,
        maxFiles,
        level: 'error',
        format: createFileFormat(),
      })
    );
  }

  return winston.createLogger({
    level,
    defaultMeta: service ? { service } : undefined,
    transports,
  });
}

export const logger = createLogger();
