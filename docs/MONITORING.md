# 📊 Monitoring & Observability Guide

This document describes the comprehensive monitoring, metrics collection, API versioning, and request tracing features implemented for the SnoozePlus Intercom Integration.

## 🚀 Quick Start

### Prometheus Metrics
Access Prometheus metrics at:
```
GET /healthcheck/metrics
```

### Enhanced Health Checks
```bash
# Comprehensive health check
GET /healthcheck/health

# Kubernetes readiness probe
GET /healthcheck/ready

# Traditional basic health check (existing)
GET /healthcheck
```

### API Versioning
```bash
# Version 1 API (deprecated - shows deprecation warnings)
GET /api/v1/healthcheck
POST /api/v1/submit

# Version 2 API (recommended)
GET /api/v2/health
POST /api/v2/messages

# Version via header
curl -H "api-version: v2" /healthcheck
```

## 📊 Available Metrics

### HTTP Metrics
- `snoozeplus_http_request_duration_seconds` - Request duration histogram
- `snoozeplus_http_requests_total` - Total HTTP requests counter
- `snoozeplus_http_active_requests` - Active requests gauge

### Database Metrics
- `snoozeplus_db_connection_pool_size` - Connection pool size by state
- `snoozeplus_db_query_duration_seconds` - Database query duration

### Business Metrics
- `snoozeplus_messages_scheduled_total` - Messages scheduled counter
- `snoozeplus_messages_sent_total` - Messages sent counter (success/failure)
- `snoozeplus_active_scheduled_jobs` - Active scheduled jobs gauge
- `snoozeplus_message_processing_duration_seconds` - Message processing time

### External Service Metrics
- `snoozeplus_external_service_requests_total` - External API requests
- `snoozeplus_external_service_duration_seconds` - External API duration
- `snoozeplus_circuit_breaker_state` - Circuit breaker state

### Error Metrics
- `snoozeplus_errors_total` - Errors by type, severity, and component

### System Metrics
- `snoozeplus_process_*` - Standard Node.js process metrics (CPU, memory, etc.)

## 🏷️ Request Correlation

All requests automatically receive correlation IDs:

### Response Headers
```
X-Correlation-ID: uuid-generated-id
X-Request-ID: uuid-generated-id
```

### Logging
All error logs include correlation IDs for request tracing across services.

## 🔄 API Versioning

### Version Detection
The system detects API versions from:
1. URL path: `/api/v1/`, `/api/v2/`
2. Header: `api-version: v2`
3. Query parameter: `?version=v2`
4. Default: `v1` (with deprecation warnings)

### Deprecation Warnings
V1 API responses include:
```
X-API-Deprecation-Warning: API v1 is deprecated. Please migrate to v2 by 2025-12-31.
X-API-Deprecation-Date: 2025-12-31
X-API-Migration-Guide: https://docs.snoozeplus.app/migration/v1-to-v2
```

### Version Mapping
| V1 Endpoint | V2 Endpoint | Change |
|-------------|-------------|---------|
| `/healthcheck` | `/health` | Renamed |
| `/submit` | `/messages` | Renamed for clarity |
| `/webhook` | `/webhooks` | Pluralized |

## 🚨 Error Handling

### Error Categories
- `validation` - Input validation errors
- `authentication` - Auth failures
- `authorization` - Permission denied
- `external_service` - Third-party API issues
- `database` - Database connectivity
- `business_logic` - Application logic errors
- `system` - Internal system errors

### Error Severities
- `low` - Minor issues, non-blocking
- `medium` - Standard errors
- `high` - Significant problems
- `critical` - System-breaking issues

### Error Response Format
```json
{
  "error": {
    "message": "User-safe error message",
    "correlationId": "uuid-for-tracking",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

## 🎯 Monitoring Integration

### Prometheus Configuration
```yaml
- job_name: 'snoozeplus'
  static_configs:
    - targets: ['app:3000']
  metrics_path: '/healthcheck/metrics'
  scrape_interval: 30s
```

### Kubernetes Health Checks
```yaml
livenessProbe:
  httpGet:
    path: /healthcheck/health
    port: 3000
  initialDelaySeconds: 30
  
readinessProbe:
  httpGet:
    path: /healthcheck/ready
    port: 3000
  initialDelaySeconds: 10
```

### Alerting Rules
```yaml
- alert: HighErrorRate
  expr: rate(snoozeplus_errors_total[5m]) > 0.1
  
- alert: DatabaseDown
  expr: snoozeplus_db_connection_pool_size{state="total"} == 0
  
- alert: HighMemoryUsage
  expr: snoozeplus_process_resident_memory_bytes / 1024 / 1024 > 1000
```

## 🔧 Performance Impact

The monitoring infrastructure is designed for minimal performance impact:
- Metrics collection: ~1-2ms per request
- Memory overhead: ~5-10MB
- CPU overhead: <1%
- No blocking operations in request path

## 🐛 Debugging

### Request Tracing
1. Extract correlation ID from response headers
2. Search logs using correlation ID
3. Track request across all services

### Error Investigation
1. Check error metrics for patterns
2. Use correlation ID for detailed logs
3. Review error categorization and severity

### Performance Analysis
1. Monitor request duration histograms
2. Track database query performance
3. Watch external service latency

## 🚀 Future Enhancements

The monitoring foundation supports future additions:
- Custom business metrics
- Advanced tracing with OpenTelemetry
- Real-time alerting
- Performance analytics
- A/B testing metrics

## 📚 Additional Resources

- [Prometheus Metrics Types](https://prometheus.io/docs/concepts/metric_types/)
- [Express.js Monitoring Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)
- [Node.js Performance Monitoring](https://nodejs.org/en/docs/guides/simple-profiling/)