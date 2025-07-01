/**
 * Prometheus metrics collection and monitoring infrastructure.
 *
 * @module monitoring/metrics
 * @exports Metrics - Main metrics collection class
 */
import {
  register,
  Counter,
  Histogram,
  Gauge,
  collectDefaultMetrics,
} from 'prom-client';

// Enable default metrics collection (CPU, memory, etc.)
collectDefaultMetrics({ prefix: 'snoozeplus_' });

export class Metrics {
  // HTTP metrics
  static httpRequestDuration = new Histogram({
    name: 'snoozeplus_http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code', 'version'],
    buckets: [0.001, 0.01, 0.1, 0.5, 1, 2, 5, 10],
  });

  static httpRequestTotal = new Counter({
    name: 'snoozeplus_http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code', 'version'],
  });

  static httpActiveRequests = new Gauge({
    name: 'snoozeplus_http_active_requests',
    help: 'Number of active HTTP requests',
    labelNames: ['method', 'route'],
  });

  // Database metrics
  static dbQueryDuration = new Histogram({
    name: 'snoozeplus_db_query_duration_seconds',
    help: 'Duration of database queries',
    labelNames: ['query_type', 'table'],
    buckets: [0.001, 0.01, 0.1, 0.5, 1, 2, 5],
  });

  static dbConnectionPoolSize = new Gauge({
    name: 'snoozeplus_db_connection_pool_size',
    help: 'Current size of database connection pool',
    labelNames: ['state'], // total, idle, waiting
  });

  static dbConnectionPoolErrors = new Counter({
    name: 'snoozeplus_db_connection_pool_errors_total',
    help: 'Total number of database connection pool errors',
  });

  // Business metrics
  static messagesScheduled = new Counter({
    name: 'snoozeplus_messages_scheduled_total',
    help: 'Total number of messages scheduled',
    labelNames: ['workspace_id'],
  });

  static messagesSent = new Counter({
    name: 'snoozeplus_messages_sent_total',
    help: 'Total number of messages sent',
    labelNames: ['status', 'workspace_id'], // success, failure
  });

  static messagesProcessingTime = new Histogram({
    name: 'snoozeplus_message_processing_duration_seconds',
    help: 'Time taken to process scheduled messages',
    labelNames: ['workspace_id'],
    buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
  });

  static activeScheduledJobs = new Gauge({
    name: 'snoozeplus_active_scheduled_jobs',
    help: 'Number of active scheduled jobs',
  });

  // External service metrics
  static externalServiceRequests = new Counter({
    name: 'snoozeplus_external_service_requests_total',
    help: 'Total requests to external services',
    labelNames: ['service', 'endpoint', 'status'],
  });

  static externalServiceDuration = new Histogram({
    name: 'snoozeplus_external_service_duration_seconds',
    help: 'Duration of external service requests',
    labelNames: ['service', 'endpoint'],
    buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
  });

  static circuitBreakerState = new Gauge({
    name: 'snoozeplus_circuit_breaker_state',
    help: 'Circuit breaker state (0=closed, 1=open, 2=half-open)',
    labelNames: ['service'],
  });

  // Error metrics
  static errorRate = new Counter({
    name: 'snoozeplus_errors_total',
    help: 'Total number of errors',
    labelNames: ['type', 'severity', 'component'],
  });

  // Initialize all metrics
  static initialize() {
    register.registerMetric(this.httpRequestDuration);
    register.registerMetric(this.httpRequestTotal);
    register.registerMetric(this.httpActiveRequests);
    register.registerMetric(this.dbQueryDuration);
    register.registerMetric(this.dbConnectionPoolSize);
    register.registerMetric(this.dbConnectionPoolErrors);
    register.registerMetric(this.messagesScheduled);
    register.registerMetric(this.messagesSent);
    register.registerMetric(this.messagesProcessingTime);
    register.registerMetric(this.activeScheduledJobs);
    register.registerMetric(this.externalServiceRequests);
    register.registerMetric(this.externalServiceDuration);
    register.registerMetric(this.circuitBreakerState);
    register.registerMetric(this.errorRate);
  }

  // Helper method to update database pool metrics
  static updateDbPoolMetrics(pool: { totalCount: number; idleCount: number; waitingCount: number }) {
    this.dbConnectionPoolSize.set({ state: 'total' }, pool.totalCount);
    this.dbConnectionPoolSize.set({ state: 'idle' }, pool.idleCount);
    this.dbConnectionPoolSize.set({ state: 'waiting' }, pool.waitingCount);
  }
}

// Initialize metrics
Metrics.initialize();
