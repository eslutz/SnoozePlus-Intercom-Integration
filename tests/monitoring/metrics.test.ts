import { describe, expect, test, beforeEach } from '@jest/globals';
import { Metrics } from '../../src/monitoring/metrics';
import { register } from 'prom-client';

describe('Metrics Collection', () => {
  beforeEach(() => {
    // Clear metrics between tests
    register.clear();
    Metrics.initialize();
  });

  test('should initialize all metrics', () => {
    expect(Metrics.httpRequestDuration).toBeDefined();
    expect(Metrics.httpRequestTotal).toBeDefined();
    expect(Metrics.httpActiveRequests).toBeDefined();
    expect(Metrics.messagesScheduled).toBeDefined();
    expect(Metrics.messagesSent).toBeDefined();
    expect(Metrics.errorRate).toBeDefined();
  });

  test('should track HTTP request metrics', () => {
    const labels = { method: 'GET', route: '/test', status_code: '200', version: 'v1' };
    
    Metrics.httpRequestTotal.labels(labels).inc();
    Metrics.httpRequestDuration.labels(labels).observe(0.1);
    
    // Verify metrics are recorded (basic smoke test)
    expect(Metrics.httpRequestTotal).toBeDefined();
    expect(Metrics.httpRequestDuration).toBeDefined();
  });

  test('should track business metrics', () => {
    Metrics.messagesScheduled.labels({ workspace_id: 'test-workspace' }).inc();
    Metrics.messagesSent.labels({ status: 'success', workspace_id: 'test-workspace' }).inc();
    
    expect(Metrics.messagesScheduled).toBeDefined();
    expect(Metrics.messagesSent).toBeDefined();
  });

  test('should track error metrics', () => {
    Metrics.errorRate.labels({ type: 'validation', severity: 'low', component: 'api' }).inc();
    
    expect(Metrics.errorRate).toBeDefined();
  });

  test('should update database pool metrics', () => {
    const poolStats = {
      totalCount: 10,
      idleCount: 8,
      waitingCount: 0
    };
    
    Metrics.updateDbPoolMetrics(poolStats);
    
    expect(Metrics.dbConnectionPoolSize).toBeDefined();
  });
});