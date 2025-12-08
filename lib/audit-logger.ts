/**
 * Audit Log System
 * Records user operations, permission changes, security events, etc.
 */

import { PrismaClient } from '@prisma/client'

// Lazy init to allow importing types in Edge Runtime
let prisma: PrismaClient | null = null
function getPrisma() {
  if (!prisma) {
    prisma = new PrismaClient()
  }
  return prisma
}

/**
 * Audit Event Types
 */
export enum AuditEventType {
  // Authentication Events
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  LOGIN_FAILED = 'LOGIN_FAILED',
  TOKEN_GENERATED = 'TOKEN_GENERATED',
  TOKEN_REFRESHED = 'TOKEN_REFRESHED',
  TOKEN_REVOKED = 'TOKEN_REVOKED',

  // Authorization Events
  PERMISSION_CHECKED = 'PERMISSION_CHECKED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  ROLE_ASSIGNED = 'ROLE_ASSIGNED',
  ROLE_REVOKED = 'ROLE_REVOKED',

  // Permission Management Events
  PERMISSION_CREATED = 'PERMISSION_CREATED',
  PERMISSION_UPDATED = 'PERMISSION_UPDATED',
  PERMISSION_DELETED = 'PERMISSION_DELETED',

  // Data Operation Events
  DATA_CREATED = 'DATA_CREATED',
  DATA_UPDATED = 'DATA_UPDATED',
  DATA_DELETED = 'DATA_DELETED',
  DATA_ACCESSED = 'DATA_ACCESSED',

  // Security Events
  SECURITY_ALERT = 'SECURITY_ALERT',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  EXPIRED_TOKEN = 'EXPIRED_TOKEN'
}

/**
 * Audit Event Severity
 */
export enum AuditSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

/**
 * Audit Event Data
 */
export interface AuditEventData {
  userId?: string
  email?: string
  role?: string
  ipAddress?: string
  userAgent?: string
  method?: string
  path?: string
  resourceId?: string
  permissions?: string[]
  requestedPermissions?: string[]
  grantedPermissions?: string[]
  deniedPermissions?: string[]
  tokenId?: string
  clientId?: string
  organizationId?: string
  errorCode?: string
  errorMessage?: string
  responseStatus?: number
  duration?: number
  metadata?: Record<string, any>
}

/**
 * Audit Event
 */
export interface AuditEvent {
  eventType: AuditEventType
  severity: AuditSeverity
  message: string
  data: AuditEventData
  timestamp: Date
  tags?: string[]
}

/**
 * Audit Log Configuration
 */
export interface AuditLoggerConfig {
  enabled: boolean
  logLevel: AuditSeverity
  includeRequestDetails: boolean
  includeResponseDetails: boolean
  maxRetries: number
  batchSize: number
  flushInterval: number
}

/**
 * Audit Log Recorder
 */
export class AuditLogger {
  private static instance: AuditLogger
  private config: AuditLoggerConfig
  private eventBuffer: AuditEvent[] = []
  private flushTimer: NodeJS.Timeout | null = null

  private constructor(config?: Partial<AuditLoggerConfig>) {
    this.config = {
      enabled: true,
      logLevel: AuditSeverity.LOW,
      includeRequestDetails: true,
      includeResponseDetails: false,
      maxRetries: 3,
      batchSize: 100,
      flushInterval: 30000, // 30 seconds
      ...config
    }

    // Start scheduled flush
    this.startFlushTimer()
  }

  static getInstance(config?: Partial<AuditLoggerConfig>): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger(config)
    }
    return AuditLogger.instance
  }

  /**
   * Record audit event
   */
  async log(event: Omit<AuditEvent, 'timestamp'>): Promise<void> {
    if (!this.config.enabled) return

    // Check log level
    if (!this.shouldLog(event.severity)) return

    const fullEvent: AuditEvent = {
      ...event,
      timestamp: new Date()
    }

    // Add to buffer
    this.eventBuffer.push(fullEvent)

    // If buffer is full, flush immediately
    if (this.eventBuffer.length >= this.config.batchSize) {
      await this.flush()
    }
  }

  /**
   * Record login event
   */
  async logLogin(data: AuditEventData): Promise<void> {
    await this.log({
      eventType: AuditEventType.LOGIN,
      severity: AuditSeverity.MEDIUM,
      message: `User ${data.email} logged in successfully`,
      data
    })
  }

  /**
   * Record login failure event
   */
  async logLoginFailed(data: AuditEventData, reason: string): Promise<void> {
    await this.log({
      eventType: AuditEventType.LOGIN_FAILED,
      severity: AuditSeverity.HIGH,
      message: `Login failed for ${data.email}: ${reason}`,
      data: {
        ...data,
        errorMessage: reason
      }
    })
  }

  /**
   * Record permission check event
   */
  async logPermissionCheck(
    data: AuditEventData,
    allowed: boolean,
    details?: string
  ): Promise<void> {
    const eventType = allowed ? AuditEventType.PERMISSION_CHECKED : AuditEventType.PERMISSION_DENIED
    const severity = allowed ? AuditSeverity.LOW : AuditSeverity.MEDIUM
    const message = allowed
      ? `Permission granted for ${data.userId} to ${data.method} ${data.path}`
      : `Permission denied for ${data.userId} to ${data.method} ${data.path}`

    await this.log({
      eventType,
      severity,
      message: details ? `${message}: ${details}` : message,
      data
    })
  }

  /**
   * Record token generation event
   */
  async logTokenGenerated(data: AuditEventData): Promise<void> {
    await this.log({
      eventType: AuditEventType.TOKEN_GENERATED,
      severity: AuditSeverity.LOW,
      message: `Token generated for user ${data.userId}`,
      data
    })
  }

  /**
   * Record permission change event
   */
  async logPermissionChange(
    eventType: AuditEventType.PERMISSION_CREATED | AuditEventType.PERMISSION_UPDATED | AuditEventType.PERMISSION_DELETED,
    data: AuditEventData,
    changes?: Record<string, any>
  ): Promise<void> {
    await this.log({
      eventType,
      severity: AuditSeverity.MEDIUM,
      message: `Permission ${eventType.toLowerCase()} for role ${data.role}`,
      data: {
        ...data,
        metadata: {
          ...data.metadata,
          changes
        }
      }
    })
  }

  /**
   * Record data operation event
   */
  async logDataOperation(
    eventType: AuditEventType.DATA_CREATED | AuditEventType.DATA_UPDATED | AuditEventType.DATA_DELETED | AuditEventType.DATA_ACCESSED,
    data: AuditEventData
  ): Promise<void> {
    await this.log({
      eventType,
      severity: this.getDataOperationSeverity(eventType),
      message: `${eventType.replace('_', ' ')} operation by ${data.userId}`,
      data
    })
  }

  /**
   * Record security event
   */
  async logSecurityEvent(
    eventType: AuditEventType.SECURITY_ALERT | AuditEventType.SUSPICIOUS_ACTIVITY | AuditEventType.RATE_LIMIT_EXCEEDED,
    data: AuditEventData,
    details?: string
  ): Promise<void> {
    await this.log({
      eventType,
      severity: AuditSeverity.CRITICAL,
      message: `Security alert: ${eventType.replace('_', ' ')}${details ? ` - ${details}` : ''}`,
      data,
      tags: ['security', 'alert']
    })
  }

  /**
   * Record token-related security event
   */
  async logTokenSecurityEvent(
    eventType: AuditEventType.INVALID_TOKEN | AuditEventType.EXPIRED_TOKEN,
    data: AuditEventData,
    details?: string
  ): Promise<void> {
    await this.log({
      eventType,
      severity: AuditSeverity.HIGH,
      message: `Token security event: ${eventType.replace('_', ' ')}${details ? ` - ${details}` : ''}`,
      data,
      tags: ['security', 'token']
    })
  }

  /**
   * Batch record audit events
   */
  async logBatch(events: Omit<AuditEvent, 'timestamp'>[]): Promise<void> {
    if (!this.config.enabled) return

    const fullEvents = events.map(event => ({
      ...event,
      timestamp: new Date()
    }))

    this.eventBuffer.push(...fullEvents)

    // If buffer is full, flush immediately
    if (this.eventBuffer.length >= this.config.batchSize) {
      await this.flush()
    }
  }

  /**
   * Flush buffer events to database
   */
  private async flush(): Promise<void> {
    if (this.eventBuffer.length === 0) return

    const eventsToFlush = [...this.eventBuffer]
    this.eventBuffer = []

    try {
      // Batch write to database
      await getPrisma().auditLog.createMany({
        data: eventsToFlush.map(event => ({
          userId: event.data.userId || 'system',
          action: event.eventType,
          resource: event.data.path || event.data.resourceId || 'unknown',
          result: this.isErrorEvent(event.eventType) ? 'error' : 'success',
          details: JSON.stringify({
            message: event.message,
            severity: event.severity,
            tags: event.tags,
            data: event.data
          }),
          timestamp: event.timestamp
        }))
      })

      console.log(`✅ Audit log batch write completed: ${eventsToFlush.length} records`)
    } catch (error) {
      console.error('Audit log write failed:', error)

      // Retry logic
      if (eventsToFlush.length > 0) {
        console.log(`🔄 Retry audit log write: ${eventsToFlush.length} records`)
        this.eventBuffer.unshift(...eventsToFlush)
      }
    }
  }

  /**
   * Query audit logs
   */
  async queryLogs(options: {
    eventType?: AuditEventType
    severity?: AuditSeverity
    userId?: string
    role?: string
    startDate?: Date
    endDate?: Date
    limit?: number
    offset?: number
  } = {}) {
    const {
      eventType,
      severity,
      userId,
      role,
      startDate,
      endDate,
      limit = 100,
      offset = 0
    } = options

    const where: any = {}

    if (eventType) where.action = eventType
    if (userId) where.userId = userId
    if (role) where.resource = role
    if (startDate || endDate) {
      where.timestamp = {}
      if (startDate) where.timestamp.gte = startDate
      if (endDate) where.timestamp.lte = endDate
    }

    const [logs, total] = await Promise.all([
      getPrisma().auditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: limit,
        skip: offset
      }),
      getPrisma().auditLog.count({ where })
    ])

    return { logs, total, limit, offset }
  }

  private isErrorEvent(eventType: AuditEventType): boolean {
    switch (eventType) {
      case AuditEventType.LOGIN_FAILED:
      case AuditEventType.PERMISSION_DENIED:
      case AuditEventType.INVALID_TOKEN:
      case AuditEventType.EXPIRED_TOKEN:
      case AuditEventType.SECURITY_ALERT:
      case AuditEventType.SUSPICIOUS_ACTIVITY:
      case AuditEventType.RATE_LIMIT_EXCEEDED:
        return true
      default:
        return false
    }
  }

  /**
   * Get security event statistics
   */
  async getSecurityStats(timeRange: { startDate: Date; endDate: Date }) {
    const securityEvents = [
      AuditEventType.LOGIN_FAILED,
      AuditEventType.PERMISSION_DENIED,
      AuditEventType.INVALID_TOKEN,
      AuditEventType.EXPIRED_TOKEN,
      AuditEventType.SECURITY_ALERT,
      AuditEventType.SUSPICIOUS_ACTIVITY,
      AuditEventType.RATE_LIMIT_EXCEEDED
    ]

    const stats = await Promise.all(
      securityEvents.map(async (eventType) => {
        const count = await getPrisma().auditLog.count({
          where: {
            action: eventType,
            timestamp: {
              gte: timeRange.startDate,
              lte: timeRange.endDate
            }
          }
        })
        return { eventType, count }
      })
    )

    return stats
  }

  /**
   * Private method: Check if events of this level should be logged
   */
  private shouldLog(eventSeverity: AuditSeverity): boolean {
    const severityLevels = {
      [AuditSeverity.LOW]: 1,
      [AuditSeverity.MEDIUM]: 2,
      [AuditSeverity.HIGH]: 3,
      [AuditSeverity.CRITICAL]: 4
    }

    const configLevel = severityLevels[this.config.logLevel]
    const eventLevel = severityLevels[eventSeverity]

    return eventLevel >= configLevel
  }

  /**
   * Private method: Get severity of data operation events
   */
  private getDataOperationSeverity(eventType: AuditEventType): AuditSeverity {
    switch (eventType) {
      case AuditEventType.DATA_DELETED:
        return AuditSeverity.HIGH
      case AuditEventType.DATA_UPDATED:
        return AuditSeverity.MEDIUM
      case AuditEventType.DATA_CREATED:
      case AuditEventType.DATA_ACCESSED:
        return AuditSeverity.LOW
      default:
        return AuditSeverity.LOW
    }
  }

  /**
   * Start scheduled flush timer
   */
  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
    }

    this.flushTimer = setInterval(async () => {
      if (this.eventBuffer.length > 0) {
        await this.flush()
      }
    }, this.config.flushInterval)
  }

  /**
   * Stop flush timer
   */
  stopFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
      this.flushTimer = null
    }
  }

  /**
   * Immediately flush all buffered events
   */
  async flushNow(): Promise<void> {
    await this.flush()
  }

  /**
   * Get buffer status
   */
  getBufferStatus(): { size: number; config: AuditLoggerConfig } {
    return {
      size: this.eventBuffer.length,
      config: { ...this.config }
    }
  }
}

// Create singleton instance
export const auditLogger = AuditLogger.getInstance()

// Export convenient helper functions
export async function logAuditEvent(event: Omit<AuditEvent, 'timestamp'>): Promise<void> {
  return auditLogger.log(event)
}

export async function logLogin(data: AuditEventData): Promise<void> {
  return auditLogger.logLogin(data)
}

export async function logPermissionCheck(data: AuditEventData, allowed: boolean, details?: string): Promise<void> {
  return auditLogger.logPermissionCheck(data, allowed, details)
}

export async function logSecurityEvent(
  eventType: AuditEventType.SECURITY_ALERT | AuditEventType.SUSPICIOUS_ACTIVITY | AuditEventType.RATE_LIMIT_EXCEEDED,
  data: AuditEventData,
  details?: string
): Promise<void> {
  return auditLogger.logSecurityEvent(eventType, data, details)
}
