# Local Development with Docker and Dev Containers

This project uses Docker Compose for local development, including a PostgreSQL database, the main application, and pgAdmin for database management. A VS Code devcontainer is provided for a seamless development experience.

## Purpose of Containers

- **app**: Runs the Node.js/TypeScript application in development mode (hot reload, local code mounting)
- **postgres**: Provides a local PostgreSQL database for development
- **flyway**: Runs database migrations automatically on startup
- **pgadmin**: Web UI for managing and inspecting the PostgreSQL database

These containers are for local development and testing only. They are not intended for production use.

## Using the Devcontainer (Recommended)

The repository includes a [devcontainer](https://containers.dev/) configuration for VS Code:

1. **Open the project in VS Code** (locally or in Codespaces)
2. When prompted, **reopen in container** (or use the Command Palette: "Dev Containers: Reopen in Container")
3. The devcontainer will automatically use Docker Compose to start all required services
4. The application source will be mounted at `/workspaces/SnoozePlus-Intercom-Integration`

### Benefits

- All dependencies and tools are pre-installed
- Consistent environment for all developers
- Easy access to all services (app, db, pgadmin)

## Running All Containers Locally (without devcontainer)

1. Ensure Docker and Docker Compose are installed
2. Copy `.env.local.example` to `.env.local` and fill in required values
3. Run:

   ```sh
   docker-compose up --build
   ```

   This will start the app, postgres, flyway (for migrations), and pgadmin containers.

## Accessing the Application and Database

- **App**: [`http://localhost:8706`](http://localhost:8706)
- **PostgreSQL**: localhost:5432 (user/password from `.env.local`, default: `postgres`/`password`)
- **pgAdmin**: [`http://localhost:5050`](http://localhost:5050) (login: `admin@admin.com` / `admin`)
  - Add a new server in pgAdmin:
    - Host: `postgres` (if inside devcontainer) or `localhost` (from host)
    - Port: `5432`
    - Username/Password: as above

### In Codespaces

- Use the **Ports** tab to access forwarded ports (8706 for app, 5050 for pgAdmin)
- Use the built-in browser or copy the forwarded URL
- For database tools, connect to `localhost` and the forwarded port

## Ensuring All Containers Are Running

- Run `docker-compose ps` to see status
- All services should be `Up` and healthy
- The app will wait for the database to be ready before starting
- Flyway runs migrations automatically on startup

## Troubleshooting

- If the app cannot connect to the database, check that the `postgres` container is healthy
- If migrations fail, check the `flyway` logs
- If you cannot access pgAdmin, ensure port 5050 is forwarded (in Codespaces) or not blocked by a firewall
- For persistent database issues, try `docker-compose down -v` to reset volumes

## Credentials and Ports (Defaults)

- **Postgres**: user=`postgres`, password=`password`, db=`snoozeplus_dev`, port=`5432`
- **pgAdmin**: email=`admin@admin.com`, password=`admin`, port=`5050`
- **App**: port=`8706`

## See Also

- [README: Local Development & Docker Usage](./README.md#local-development)

---

This document is up to date as of June 2025. For any issues, see the troubleshooting section or contact the project maintainers.
