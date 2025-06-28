# Using the SnoozePlus Intercom Integration Postman Collection

This guide explains how to import and use the provided Postman collection to test all API endpoints of the SnoozePlus Intercom Integration.

---

## 1. Importing the Collection

1. Open [Postman](https://www.postman.com/downloads/).
2. Click **Import** in the top left.
3. Select **File** and choose `SnoozePlus-Intercom-Integration.postman_collection.json` from the `docs/` directory.
4. The collection will appear in your Postman sidebar.

## 2. Setting the Base URL

- The collection uses a `baseUrl` variable. By default, it is set to `http://localhost:3000`.
- To change it:
  1. Click the collection name in Postman.
  2. Go to the **Variables** tab.
  3. Edit the `baseUrl` value as needed (e.g., for production or staging).

---

## Using the Collection with Local Containers

If you are running the application locally using Docker Compose or the devcontainer:

- The default `baseUrl` in the collection is set to `http://localhost:3000`.
- If your app container exposes a different port (e.g., `8706`), update the `baseUrl` variable in Postman to `http://localhost:8706`.
- Ensure the application container is running and accessible from your host machine.
- Import the collection as described above and use the endpoints as documented.

## Using the Collection in GitHub Codespaces

If you are running the application in a Codespace:

- The app will be running inside the Codespace, and ports are forwarded to your browser.
- In Postman, set the `baseUrl` variable to the forwarded URL for the app (e.g., `https://<your-codespace-id>-8706.app.github.dev`).
  - You can find the forwarded URL in the Codespaces **Ports** tab.
- Make sure the application is running in the Codespace before sending requests.
- Import the collection and update the `baseUrl` as above.

---

## 3. Authentication

- Most endpoints do not require manual authentication in Postman, but some routes (such as OAuth flows) are included for completeness.
- For endpoints that require Intercom OAuth, follow the login flow in your browser as prompted by the `/auth/login` endpoint.
- If you need to test authenticated requests, ensure you have a valid session or token as required by your deployment.

---

## 4. Endpoints and Example Request Bodies

### Health Check

#### GET `/healthcheck`

- No request body required.

#### GET `/healthcheck/db-healthcheck`

- No request body required.

#### POST `/healthcheck/installation-healthcheck`

**Request Body:**

```json
{
  "workspace_id": "your_workspace_id"
}
```

---

### Authentication

#### GET `/auth/intercom`

- Initiates Intercom OAuth login. No request body required.

#### GET `/auth/intercom/callback`

- OAuth callback. No request body required.

#### GET `/auth/failure`

- No request body required.

#### GET `/auth/logout`

- No request body required.

---

### Canvas Integration

#### POST `/initialize`

**Request Body:**

```json
{
  "canvas_id": "string",
  "workspace_id": "string",
  "admin_id": "string",
  "conversation_id": "string",
  "current_url": "string"
}
```

#### POST `/submit`

**Request Body:**

```json
{
  "canvas_id": "string",
  "workspace_id": "string",
  "admin_id": "string",
  "conversation_id": "string",
  "current_url": "string",
  "input_values": {
    "message1": "First scheduled message",
    "date1": "2024-01-01T12:00:00Z",
    "message2": "Second scheduled message",
    "date2": "2024-01-02T12:00:00Z"
  }
}
```

---

### Webhooks

#### HEAD `/webhook`

- No request body required.

#### POST `/webhook`

**Headers:**

- `Content-Type: application/json`
- `X-Hub-Signature: your_signature_here` (replace with a valid signature if signature verification is enabled)

**Request Body:**

```json
{
  "type": "conversation.admin.replied",
  "data": {
    "item": {
      "type": "conversation",
      "id": "conversation_id"
    }
  },
  "created_at": 1640995200,
  "id": "webhook_id"
}
```

---

## 5. Notes

- For endpoints requiring authentication, ensure you are logged in via the OAuth flow or have a valid session.
- For webhook testing, you may need to generate a valid `X-Hub-Signature` if your server enforces signature verification.
- You can duplicate and modify requests in Postman to test different scenarios.

---

For more details on each endpoint, see the API documentation in `docs/API.md`.
