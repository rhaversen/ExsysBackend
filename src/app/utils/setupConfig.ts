// Node.js built-in modules
import config from 'config'

// Third-party libraries
import { type Options as RateLimitOptions } from 'express-rate-limit'
import logger from './logger.js'
import { type ConnectOptions } from 'mongoose'

// Convert config object to a plain object and then stringify it
const configString = JSON.stringify(config.util.toObject(config), null, 4)

// Log the configs used
logger.info(`Using configs:\n${configString}`)

/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
const AppConfig = {
    veryLowSensitivityApiLimiterConfig: config.get('apiLimiter.sensitivity.veryLow') as RateLimitOptions,
    lowSensitivityApiLimiterConfig: config.get('apiLimiter.sensitivity.low') as RateLimitOptions,
    mediumSensitivityApiLimiterConfig: config.get('apiLimiter.sensitivity.medium') as RateLimitOptions,
    highSensitivityApiLimiterConfig: config.get('apiLimiter.sensitivity.high') as RateLimitOptions,
    criticalSensitivityApiLimiterConfig: config.get('apiLimiter.sensitivity.critical') as RateLimitOptions,
    expressPort: config.get('expressPort') as number,
    mongooseOpts: config.get('mongoose.options') as ConnectOptions,
    maxRetryAttempts: config.get('mongoose.retrySettings.maxAttempts') as number,
    retryInterval: config.get('mongoose.retrySettings.interval') as number, // in milliseconds
    retryWrites: config.get('mongoose.options.retryWrites') as string,
    w: config.get('mongoose.options.w') as string,
    appName: config.get('mongoose.options.appName') as string
}

export default AppConfig
