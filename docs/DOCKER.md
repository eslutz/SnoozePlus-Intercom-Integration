# Docker Usage

This repository includes Docker support for containerized deployment.

## Docker Scripts

The following npm scripts are available for Docker operations:

- `npm run docker:build` - Builds the Docker image tagged as `snoozeplus-intercom`
- `npm run docker:run` - Runs the container with production environment variables

## Building the Docker Image

```bash
npm run docker:build
```

Or directly with Docker:

```bash
docker build -t snoozeplus-intercom .
```

## Running the Container

1. First, create your production environment file:
   ```bash
   cp .env.production.example .env.production
   # Edit .env.production with your actual values
   ```

2. Run the container:
   ```bash
   npm run docker:run
   ```

   Or directly with Docker:
   ```bash
   docker run -p 3000:3000 --env-file .env.production snoozeplus-intercom
   ```

## Docker Features

- **Multi-stage build** for optimized image size
- **Non-root user** for enhanced security
- **Health check** endpoint at `/api/health`
- **Proper signal handling** for graceful shutdowns
- **Alpine Linux** base for minimal attack surface
- **Production optimized** with only runtime dependencies

## Environment Variables

The container expects a `.env.production` file with the following variables:

- `NODE_ENV=production`
- `PORT=3000`
- Database configuration (`PGHOST`, `PGUSER`, `PGPASSWORD`, etc.)
- Intercom API credentials
- Security keys and secrets

See `.env.production.example` for a complete list of required environment variables.

## Health Check

The container includes a health check that monitors the application's `/api/health` endpoint. The health check runs every 30 seconds and considers the container unhealthy if 3 consecutive checks fail.

## Security Considerations

- The application runs as a non-root user (`nodejs:nodejs`)
- Only production dependencies are included in the final image
- Environment variables should be properly secured
- The container exposes only port 3000