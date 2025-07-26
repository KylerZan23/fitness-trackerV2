/**
 * Structured Logging Service
 *
 * Provides centralized, structured logging with context and metadata.
 * Supports multiple backends (console, Logtail, Axiom) and environment-specific configuration.
 */

import { getEnvironmentConfig, isDevelopment, isTest } from '@/lib/env'

// Log levels in order of severity
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

// Log context interface
export interface LogContext {
  userId?: string
  sessionId?: string
  requestId?: string
  operation?: string
  component?: string
  duration?: number
  success?: boolean
  event?: string
  properties?: Record<string, any>
  metadata?: Record<string, any>
  tags?: Record<string, string>
  error?:
    | string
    | {
        name: string
        message: string
        stack?: string
      }
  // Additional fields for error boundaries and debugging
  stack?: string
  componentStack?: string
  retryCount?: number
  [key: string]: any // Allow additional context fields
}

// Log entry interface
export interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context?: LogContext
  error?: {
    name: string
    message: string
    stack?: string
  }
}

// Environment-specific log level configuration
function getMinLogLevel(): LogLevel {
  const env = getEnvironmentConfig()

  if (isTest()) return LogLevel.ERROR // Only errors in tests
  if (env.isProduction) return LogLevel.WARN // Warn and above in production
  if (env.isDevelopment) return LogLevel.DEBUG // All logs in development

  return LogLevel.INFO // Default to info
}

// Data sanitization for security
function sanitizeData(data: any): any {
  if (!data || typeof data !== 'object') {
    return data
  }

  const sanitized = Array.isArray(data) ? [...data] : { ...data }

  // Remove sensitive fields
  const sensitiveKeys = [
    'password',
    'secret',
    'token',
    'key',
    'auth',
    'authorization',
    'api_key',
    'apikey',
    'access_token',
    'refresh_token',
    'session_token',
    'private_key',
    'client_secret',
    'webhook_secret',
  ]

  Object.keys(sanitized).forEach(key => {
    const lowerKey = key.toLowerCase()
    if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
      sanitized[key] = '[REDACTED]'
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeData(sanitized[key])
    }
  })

  return sanitized
}

// Create structured log entry
function createLogEntry(
  level: LogLevel,
  message: string,
  context?: LogContext,
  error?: Error
): LogEntry {
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
  }

  if (context) {
    entry.context = sanitizeData(context)
  }

  if (error) {
    entry.error = {
      name: error.name,
      message: error.message,
      stack: error.stack,
    }
  }

  return entry
}

// Console logger for development and fallback
class ConsoleLogger {
  private getConsoleMethod(level: LogLevel) {
    switch (level) {
      case LogLevel.DEBUG:
        return console.debug
      case LogLevel.INFO:
        return console.info
      case LogLevel.WARN:
        return console.warn
      case LogLevel.ERROR:
        return console.error
      default:
        return console.log
    }
  }

  private formatForConsole(entry: LogEntry): string {
    const timestamp = new Date(entry.timestamp).toLocaleTimeString()
    const levelName = LogLevel[entry.level]
    const contextStr = entry.context ? ` | ${JSON.stringify(entry.context, null, 2)}` : ''
    const errorStr = entry.error ? ` | ERROR: ${entry.error.message}` : ''

    return `[${timestamp}] ${levelName}: ${entry.message}${contextStr}${errorStr}`
  }

  log(entry: LogEntry): void {
    const method = this.getConsoleMethod(entry.level)
    const formatted = this.formatForConsole(entry)

    if (entry.error?.stack && isDevelopment()) {
      method(formatted)
      console.error('Stack trace:', entry.error.stack)
    } else {
      method(formatted)
    }
  }
}

// Logtail logger for structured logging service
class LogtailLogger {
  private logtail: any
  private isInitialized = false

  constructor() {
    this.initializeLogtail()
  }

  private async initializeLogtail() {
    try {
      // Only load Logtail in appropriate environments
      if (!process.env.LOGTAIL_TOKEN || isTest()) {
        return
      }

      if (typeof window !== 'undefined') {
        // Browser environment
        const { Logtail } = await import('@logtail/browser')
        this.logtail = new Logtail(process.env.LOGTAIL_TOKEN)
      } else {
        // Server environment
        const { Logtail } = await import('@logtail/node')
        this.logtail = new Logtail(process.env.LOGTAIL_TOKEN)
      }

      this.isInitialized = true
    } catch (error) {
      console.warn('Failed to initialize Logtail:', error)
    }
  }

  log(entry: LogEntry): void {
    if (!this.isInitialized || !this.logtail) {
      return
    }

    try {
      const logData = {
        message: entry.message,
        timestamp: entry.timestamp,
        level: LogLevel[entry.level].toLowerCase(),
        ...entry.context,
      }

      if (entry.error) {
        logData.error = entry.error
      }

      // Use appropriate Logtail method based on level
      switch (entry.level) {
        case LogLevel.DEBUG:
          this.logtail.debug(entry.message, logData)
          break
        case LogLevel.INFO:
          this.logtail.info(entry.message, logData)
          break
        case LogLevel.WARN:
          this.logtail.warn(entry.message, logData)
          break
        case LogLevel.ERROR:
          this.logtail.error(entry.message, logData)
          break
      }
    } catch (error) {
      console.warn('Failed to send log to Logtail:', error)
    }
  }
}

// Main logger class
class Logger {
  private consoleLogger = new ConsoleLogger()
  private logtailLogger = new LogtailLogger()
  private minLevel = getMinLogLevel()
  private globalContext: LogContext = {}

  // Set global context that will be included in all logs
  setGlobalContext(context: LogContext): void {
    this.globalContext = { ...this.globalContext, ...context }
  }

  // Clear global context
  clearGlobalContext(): void {
    this.globalContext = {}
  }

  // Update specific context values
  updateContext(updates: Partial<LogContext>): void {
    this.globalContext = { ...this.globalContext, ...updates }
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.minLevel
  }

  private log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    if (!this.shouldLog(level)) {
      return
    }

    const mergedContext = { ...this.globalContext, ...context }
    const entry = createLogEntry(level, message, mergedContext, error)

    // Always log to console in development or as fallback
    if (isDevelopment() || !process.env.LOGTAIL_TOKEN) {
      this.consoleLogger.log(entry)
    }

    // Log to structured logging service if available
    if (process.env.LOGTAIL_TOKEN && !isTest()) {
      this.logtailLogger.log(entry)
    }
  }

  // Public logging methods
  debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context)
  }

  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context)
  }

  warn(message: string, context?: LogContext, error?: Error): void {
    this.log(LogLevel.WARN, message, context, error)
  }

  error(message: string, context?: LogContext, error?: Error): void {
    this.log(LogLevel.ERROR, message, context, error)
  }

  // Convenience method for timing operations
  time<T>(operation: string, fn: () => Promise<T>, context?: LogContext): Promise<T> {
    const startTime = Date.now()
    const operationContext = { ...context, operation }

    this.debug(`Starting operation: ${operation}`, operationContext)

    return fn()
      .then(result => {
        const duration = Date.now() - startTime
        this.info(`Operation completed: ${operation}`, {
          ...operationContext,
          duration,
          success: true,
        })
        return result
      })
      .catch(error => {
        const duration = Date.now() - startTime
        this.error(
          `Operation failed: ${operation}`,
          {
            ...operationContext,
            duration,
            success: false,
          },
          error
        )
        throw error
      })
  }

  // Method for capturing business events
  event(eventName: string, properties?: Record<string, any>, context?: LogContext): void {
    this.info(`Event: ${eventName}`, {
      ...context,
      event: eventName,
      properties: sanitizeData(properties),
    })
  }
}

// Export singleton logger instance
export const logger = new Logger()

// Types are already exported above, no need to re-export

// Export helper functions for common patterns
export function withLogging<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  operationName: string,
  contextFactory?: (...args: T) => LogContext
) {
  return async (...args: T): Promise<R> => {
    const context = contextFactory ? contextFactory(...args) : { operation: operationName }
    return logger.time(operationName, () => fn(...args), context)
  }
}

// Helper for setting user context
export function setUserContext(userId: string, sessionId?: string): void {
  logger.setGlobalContext({ userId, sessionId })
}

// Helper for clearing user context
export function clearUserContext(): void {
  logger.clearGlobalContext()
}
