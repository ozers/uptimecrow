// OpenAPI 3.1 spec for the public, key-authenticated API surface.
// Hand-maintained — keep in sync with routes/*.ts when adding endpoints.

export function buildOpenApiDocument(): unknown {
  const url = process.env.APP_URL || "http://localhost:3000";
  return {
    openapi: "3.1.0",
    info: {
      title: "UptimeCrow API",
      version: "1.0.0",
      description:
        "REST API for UptimeCrow uptime monitoring platform.\n\n" +
        "## Authentication\n\n" +
        "All endpoints require an API key passed as a Bearer token:\n\n" +
        "```\nAuthorization: Bearer uc_live_...\n```\n\n" +
        "Create API keys in **Settings → API Keys** (Indie plan or higher). " +
        "Each key is shown once at creation — copy it immediately.\n\n" +
        "## Rate Limits\n\n" +
        "100 requests/minute per API key. Rate-limited responses return `429 Too Many Requests`.\n\n" +
        "## Base URL\n\n" +
        "All paths are relative to `" + url + "`.",
      contact: { email: "support@uptimecrow.com", url: "https://uptimecrow.com" },
      license: { name: "MIT", url: "https://github.com/ozers/uptimecrow/blob/main/LICENSE" },
    },
    servers: [
      { url, description: "Primary API" },
      { url: "https://uptimecrow.com", description: "Production" },
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "UC-API-KEY",
          description: "API key created from Settings → API Keys. Prefix: `uc_live_`.",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            error: { type: "string", example: "Resource not found" },
            details: { type: "object" },
          },
          required: ["error"],
        },
        Monitor: {
          type: "object",
          description: "An HTTP, TCP, or keyword uptime monitor.",
          properties: {
            id: { type: "string", format: "uuid" },
            orgId: { type: "string", format: "uuid" },
            name: { type: "string", example: "Production API" },
            url: { type: "string", format: "uri", example: "https://api.example.com/health" },
            type: { type: "string", enum: ["http", "tcp", "keyword"], default: "http" },
            intervalSeconds: { type: "integer", minimum: 30, example: 60 },
            timeoutMs: { type: "integer", example: 10000 },
            expectedStatus: { type: "integer", example: 200, description: "Use 200 for smart-mode (5xx = down, others = up)." },
            confirmationCount: { type: "integer", minimum: 1, maximum: 5, example: 2, description: "Consecutive failures before marking DOWN." },
            keyword: { type: "string", nullable: true, example: "OK" },
            status: { type: "string", enum: ["up", "down", "degraded", "unknown"] },
            lastCheckedAt: { type: "string", format: "date-time", nullable: true },
            lastResponseMs: { type: "integer", nullable: true },
            isActive: { type: "boolean" },
            sslExpiresAt: { type: "string", format: "date-time", nullable: true },
            sslCheckedAt: { type: "string", format: "date-time", nullable: true },
            sslDaysWarning: { type: "integer", default: 30, description: "Alert when SSL cert expires within this many days." },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        MonitorInput: {
          type: "object",
          required: ["name", "url"],
          properties: {
            name: { type: "string", minLength: 1, maxLength: 255, example: "Production API" },
            url: { type: "string", maxLength: 2048, example: "https://api.example.com/health" },
            type: { type: "string", enum: ["http", "tcp", "keyword"], default: "http" },
            intervalSeconds: { type: "integer", minimum: 30, maximum: 300, default: 60 },
            timeoutMs: { type: "integer", minimum: 1000, maximum: 30000, default: 10000 },
            expectedStatus: { type: "integer", minimum: 100, maximum: 599, default: 200 },
            confirmationCount: { type: "integer", minimum: 1, maximum: 5, default: 2 },
            keyword: { type: "string", maxLength: 500, nullable: true },
            sslDaysWarning: { type: "integer", minimum: 1, maximum: 365, default: 30 },
          },
        },
        CheckResult: {
          type: "object",
          properties: {
            id: { type: "integer" },
            monitorId: { type: "string", format: "uuid" },
            status: { type: "string", enum: ["up", "down", "degraded"] },
            responseMs: { type: "integer", nullable: true },
            statusCode: { type: "integer", nullable: true },
            errorMessage: { type: "string", nullable: true },
            checkedAt: { type: "string", format: "date-time" },
            region: { type: "string", example: "eu-west" },
          },
        },
        Incident: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            orgId: { type: "string", format: "uuid" },
            statusPageId: { type: "string", format: "uuid" },
            monitorId: { type: "string", format: "uuid", nullable: true },
            title: { type: "string" },
            status: { type: "string", enum: ["investigating", "identified", "monitoring", "resolved"] },
            severity: { type: "string", enum: ["minor", "major", "critical"] },
            startedAt: { type: "string", format: "date-time" },
            resolvedAt: { type: "string", format: "date-time", nullable: true },
          },
        },
        IncidentInput: {
          type: "object",
          required: ["statusPageId", "title", "body"],
          properties: {
            statusPageId: { type: "string", format: "uuid" },
            monitorId: { type: "string", format: "uuid" },
            title: { type: "string", minLength: 1, maxLength: 500 },
            status: { type: "string", enum: ["investigating", "identified", "monitoring", "resolved"], default: "investigating" },
            severity: { type: "string", enum: ["minor", "major", "critical"], default: "minor" },
            body: { type: "string", minLength: 1, maxLength: 5000, description: "Markdown supported." },
          },
        },
        StatusPage: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            orgId: { type: "string", format: "uuid" },
            name: { type: "string", example: "Acme Status" },
            slug: { type: "string", example: "acme", description: "URL slug: /status/{slug}" },
            customDomain: { type: "string", nullable: true },
            logoUrl: { type: "string", nullable: true },
            brandColor: { type: "string", example: "#00e676" },
            isPublic: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Heartbeat: {
          type: "object",
          description: "Heartbeat monitor for cron jobs and scheduled tasks.",
          properties: {
            id: { type: "string", format: "uuid" },
            orgId: { type: "string", format: "uuid" },
            name: { type: "string", example: "Nightly backup" },
            slug: { type: "string", description: "Ping URL slug: /heartbeat/{slug}" },
            period: { type: "integer", description: "Expected ping interval in seconds.", example: 86400 },
            grace: { type: "integer", description: "Grace period in seconds before alerting.", example: 300 },
            status: { type: "string", enum: ["healthy", "late", "paused", "unknown"] },
            lastPingAt: { type: "string", format: "date-time", nullable: true },
            isActive: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
            pingUrl: { type: "string", format: "uri", description: "URL to GET/POST from your cron job to signal health." },
          },
        },
        HeartbeatInput: {
          type: "object",
          required: ["name"],
          properties: {
            name: { type: "string", minLength: 1, maxLength: 255, example: "Nightly backup" },
            period: { type: "integer", minimum: 60, maximum: 2592000, default: 86400, description: "Seconds between expected pings." },
            grace: { type: "integer", minimum: 60, maximum: 3600, default: 300, description: "Grace seconds before alerting." },
          },
        },
        MaintenanceWindow: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            statusPageId: { type: "string", format: "uuid" },
            title: { type: "string" },
            body: { type: "string", nullable: true },
            status: { type: "string", enum: ["scheduled", "in_progress", "completed", "cancelled"] },
            scheduledStart: { type: "string", format: "date-time" },
            scheduledEnd: { type: "string", format: "date-time" },
            monitorIds: { type: "array", items: { type: "string", format: "uuid" } },
          },
        },
        MaintenanceWindowInput: {
          type: "object",
          required: ["statusPageId", "title", "scheduledStart", "scheduledEnd"],
          properties: {
            statusPageId: { type: "string", format: "uuid" },
            title: { type: "string", minLength: 1, maxLength: 500 },
            body: { type: "string", maxLength: 5000 },
            scheduledStart: { type: "string", format: "date-time" },
            scheduledEnd: { type: "string", format: "date-time" },
            monitorIds: { type: "array", items: { type: "string", format: "uuid" } },
          },
        },
        ApiKey: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string" },
            prefix: { type: "string", example: "uc_live_xXxX" },
            lastUsedAt: { type: "string", format: "date-time", nullable: true },
            createdAt: { type: "string", format: "date-time" },
          },
        },
      },
      responses: {
        Unauthorized: {
          description: "Missing or invalid API key",
          content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
        },
        NotFound: {
          description: "Resource not found",
          content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
        },
        BadRequest: {
          description: "Invalid input",
          content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
        },
        TooManyRequests: {
          description: "Rate limit exceeded",
          content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
        },
      },
    },
    security: [{ ApiKeyAuth: [] }],
    paths: {
      // ── Monitors ──
      "/api/monitors": {
        get: {
          summary: "List all monitors",
          operationId: "listMonitors",
          tags: ["Monitors"],
          responses: {
            200: {
              description: "All monitors in your organization",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      monitors: { type: "array", items: { $ref: "#/components/schemas/Monitor" } },
                    },
                  },
                  example: { monitors: [{ id: "uuid", name: "Production API", status: "up", url: "https://api.example.com/health", type: "http", intervalSeconds: 60, isActive: true }] },
                },
              },
            },
            401: { $ref: "#/components/responses/Unauthorized" },
          },
        },
        post: {
          summary: "Create a monitor",
          operationId: "createMonitor",
          tags: ["Monitors"],
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/MonitorInput" } } },
          },
          responses: {
            201: {
              description: "Monitor created and first check queued",
              content: { "application/json": { schema: { type: "object", properties: { monitor: { $ref: "#/components/schemas/Monitor" } } } } },
            },
            400: { $ref: "#/components/responses/BadRequest" },
            401: { $ref: "#/components/responses/Unauthorized" },
          },
        },
      },
      "/api/monitors/{id}": {
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" }, description: "Monitor ID" }],
        get: {
          summary: "Get a monitor",
          operationId: "getMonitor",
          tags: ["Monitors"],
          responses: {
            200: { description: "OK", content: { "application/json": { schema: { type: "object", properties: { monitor: { $ref: "#/components/schemas/Monitor" } } } } } },
            401: { $ref: "#/components/responses/Unauthorized" },
            404: { $ref: "#/components/responses/NotFound" },
          },
        },
        patch: {
          summary: "Update a monitor",
          operationId: "updateMonitor",
          tags: ["Monitors"],
          description: "All fields optional — only supplied fields are updated.",
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/MonitorInput" } } },
          },
          responses: {
            200: { description: "Updated", content: { "application/json": { schema: { type: "object", properties: { monitor: { $ref: "#/components/schemas/Monitor" } } } } } },
            400: { $ref: "#/components/responses/BadRequest" },
            401: { $ref: "#/components/responses/Unauthorized" },
            404: { $ref: "#/components/responses/NotFound" },
          },
        },
        delete: {
          summary: "Delete a monitor",
          operationId: "deleteMonitor",
          tags: ["Monitors"],
          description: "Permanently deletes the monitor and all its check history.",
          responses: {
            200: { description: "Deleted" },
            401: { $ref: "#/components/responses/Unauthorized" },
            404: { $ref: "#/components/responses/NotFound" },
          },
        },
      },
      "/api/monitors/{id}/checks": {
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        get: {
          summary: "Get check history",
          operationId: "getMonitorChecks",
          tags: ["Monitors"],
          description: "Returns the most recent check results for a monitor.",
          parameters: [
            { name: "limit", in: "query", schema: { type: "integer", default: 100, maximum: 1000 } },
          ],
          responses: {
            200: {
              description: "Check results newest-first",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: { checks: { type: "array", items: { $ref: "#/components/schemas/CheckResult" } } },
                  },
                },
              },
            },
            401: { $ref: "#/components/responses/Unauthorized" },
            404: { $ref: "#/components/responses/NotFound" },
          },
        },
      },

      // ── Heartbeats ──
      "/api/heartbeats": {
        get: {
          summary: "List heartbeat monitors",
          operationId: "listHeartbeats",
          tags: ["Heartbeats"],
          description: "Heartbeats let you monitor cron jobs and scheduled tasks by having them ping UptimeCrow.",
          responses: {
            200: {
              description: "All heartbeats in your organization",
              content: { "application/json": { schema: { type: "object", properties: { heartbeats: { type: "array", items: { $ref: "#/components/schemas/Heartbeat" } } } } } },
            },
            401: { $ref: "#/components/responses/Unauthorized" },
          },
        },
        post: {
          summary: "Create a heartbeat monitor",
          operationId: "createHeartbeat",
          tags: ["Heartbeats"],
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/HeartbeatInput" } } },
          },
          responses: {
            201: { description: "Created", content: { "application/json": { schema: { type: "object", properties: { heartbeat: { $ref: "#/components/schemas/Heartbeat" } } } } } },
            400: { $ref: "#/components/responses/BadRequest" },
            401: { $ref: "#/components/responses/Unauthorized" },
          },
        },
      },
      "/api/heartbeats/{id}": {
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        patch: {
          summary: "Update a heartbeat",
          operationId: "updateHeartbeat",
          tags: ["Heartbeats"],
          requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/HeartbeatInput" } } } },
          responses: { 200: { description: "Updated" }, 401: { $ref: "#/components/responses/Unauthorized" }, 404: { $ref: "#/components/responses/NotFound" } },
        },
        delete: {
          summary: "Delete a heartbeat",
          operationId: "deleteHeartbeat",
          tags: ["Heartbeats"],
          responses: { 200: { description: "Deleted" }, 401: { $ref: "#/components/responses/Unauthorized" }, 404: { $ref: "#/components/responses/NotFound" } },
        },
      },

      // ── Incidents ──
      "/api/incidents": {
        get: {
          summary: "List incidents",
          operationId: "listIncidents",
          tags: ["Incidents"],
          parameters: [
            { name: "limit", in: "query", schema: { type: "integer", default: 20, maximum: 100 } },
            { name: "offset", in: "query", schema: { type: "integer", default: 0 } },
          ],
          responses: {
            200: {
              description: "Incidents newest-first",
              content: { "application/json": { schema: { type: "object", properties: { incidents: { type: "array", items: { $ref: "#/components/schemas/Incident" } }, total: { type: "integer" } } } } },
            },
            401: { $ref: "#/components/responses/Unauthorized" },
          },
        },
        post: {
          summary: "Create an incident",
          operationId: "createIncident",
          tags: ["Incidents"],
          description: "Manually declare an incident. Auto-incidents are created by the monitoring engine.",
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/IncidentInput" } } },
          },
          responses: {
            201: { description: "Created", content: { "application/json": { schema: { type: "object", properties: { incident: { $ref: "#/components/schemas/Incident" } } } } } },
            400: { $ref: "#/components/responses/BadRequest" },
            401: { $ref: "#/components/responses/Unauthorized" },
          },
        },
      },
      "/api/incidents/{id}": {
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        get: {
          summary: "Get an incident with updates",
          operationId: "getIncident",
          tags: ["Incidents"],
          responses: { 200: { description: "OK" }, 401: { $ref: "#/components/responses/Unauthorized" }, 404: { $ref: "#/components/responses/NotFound" } },
        },
        patch: {
          summary: "Update incident status or severity",
          operationId: "updateIncident",
          tags: ["Incidents"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", enum: ["investigating", "identified", "monitoring", "resolved"] },
                    severity: { type: "string", enum: ["minor", "major", "critical"] },
                  },
                },
              },
            },
          },
          responses: { 200: { description: "Updated" }, 401: { $ref: "#/components/responses/Unauthorized" }, 404: { $ref: "#/components/responses/NotFound" } },
        },
      },
      "/api/incidents/{id}/updates": {
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        post: {
          summary: "Add a status update",
          operationId: "createIncidentUpdate",
          tags: ["Incidents"],
          description: "Post a new update to an incident. Subscribers are notified. Markdown is supported in `body`.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["status", "body"],
                  properties: {
                    status: { type: "string", enum: ["investigating", "identified", "monitoring", "resolved"] },
                    body: { type: "string", minLength: 1, maxLength: 5000, description: "Supports GitHub-flavored Markdown." },
                  },
                },
              },
            },
          },
          responses: { 201: { description: "Update posted and subscribers notified" }, 401: { $ref: "#/components/responses/Unauthorized" }, 404: { $ref: "#/components/responses/NotFound" } },
        },
      },

      // ── Status Pages ──
      "/api/status-pages": {
        get: {
          summary: "List status pages",
          operationId: "listStatusPages",
          tags: ["Status Pages"],
          responses: {
            200: {
              description: "All status pages",
              content: { "application/json": { schema: { type: "object", properties: { statusPages: { type: "array", items: { $ref: "#/components/schemas/StatusPage" } } } } } },
            },
            401: { $ref: "#/components/responses/Unauthorized" },
          },
        },
      },
      "/api/status-pages/{id}": {
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        get: {
          summary: "Get a status page",
          operationId: "getStatusPage",
          tags: ["Status Pages"],
          responses: {
            200: {
              description: "Status page with linked monitors",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      statusPage: { $ref: "#/components/schemas/StatusPage" },
                      monitors: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            monitorId: { type: "string", format: "uuid" },
                            groupName: { type: "string", nullable: true, description: "Optional group label, e.g. 'API', 'Database'." },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            401: { $ref: "#/components/responses/Unauthorized" },
            404: { $ref: "#/components/responses/NotFound" },
          },
        },
      },
      "/api/status-pages/{id}/monitors": {
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        put: {
          summary: "Set monitors on a status page",
          operationId: "setStatusPageMonitors",
          tags: ["Status Pages"],
          description: "Replaces the full monitor list. Pass an empty array to remove all monitors. Each entry can include an optional `groupName` to organize monitors into sections.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["monitors"],
                  properties: {
                    monitors: {
                      type: "array",
                      items: {
                        type: "object",
                        required: ["monitorId"],
                        properties: {
                          monitorId: { type: "string", format: "uuid" },
                          groupName: { type: "string", nullable: true, maxLength: 255, example: "API" },
                        },
                      },
                    },
                  },
                },
                example: {
                  monitors: [
                    { monitorId: "uuid-1", groupName: "API" },
                    { monitorId: "uuid-2", groupName: "API" },
                    { monitorId: "uuid-3", groupName: "Database" },
                  ],
                },
              },
            },
          },
          responses: {
            200: { description: "Monitor list updated" },
            401: { $ref: "#/components/responses/Unauthorized" },
            404: { $ref: "#/components/responses/NotFound" },
          },
        },
      },

      // ── Maintenance Windows ──
      "/api/maintenance-windows": {
        get: {
          summary: "List maintenance windows",
          operationId: "listMaintenanceWindows",
          tags: ["Maintenance"],
          responses: { 200: { description: "Scheduled and in-progress windows" }, 401: { $ref: "#/components/responses/Unauthorized" } },
        },
        post: {
          summary: "Schedule a maintenance window",
          operationId: "createMaintenanceWindow",
          tags: ["Maintenance"],
          description: "During a maintenance window, monitor downtime does not create incidents.",
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/MaintenanceWindowInput" } } },
          },
          responses: {
            201: { description: "Created", content: { "application/json": { schema: { type: "object", properties: { maintenanceWindow: { $ref: "#/components/schemas/MaintenanceWindow" } } } } } },
            400: { $ref: "#/components/responses/BadRequest" },
            401: { $ref: "#/components/responses/Unauthorized" },
          },
        },
      },
      "/api/maintenance-windows/{id}": {
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        patch: {
          summary: "Update or cancel a maintenance window",
          operationId: "updateMaintenanceWindow",
          tags: ["Maintenance"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    body: { type: "string" },
                    status: { type: "string", enum: ["scheduled", "in_progress", "completed", "cancelled"] },
                    scheduledStart: { type: "string", format: "date-time" },
                    scheduledEnd: { type: "string", format: "date-time" },
                    monitorIds: { type: "array", items: { type: "string", format: "uuid" } },
                  },
                },
              },
            },
          },
          responses: { 200: { description: "Updated" }, 401: { $ref: "#/components/responses/Unauthorized" }, 404: { $ref: "#/components/responses/NotFound" } },
        },
        delete: {
          summary: "Delete a maintenance window",
          operationId: "deleteMaintenanceWindow",
          tags: ["Maintenance"],
          responses: { 200: { description: "Deleted" }, 401: { $ref: "#/components/responses/Unauthorized" }, 404: { $ref: "#/components/responses/NotFound" } },
        },
      },

      // ── API Keys ──
      "/api/api-keys": {
        get: {
          summary: "List API keys",
          operationId: "listApiKeys",
          tags: ["API Keys"],
          description: "Returns active (non-revoked) API keys. Key hashes are never returned.",
          responses: {
            200: {
              description: "Active API keys",
              content: { "application/json": { schema: { type: "object", properties: { apiKeys: { type: "array", items: { $ref: "#/components/schemas/ApiKey" } } } } } },
            },
            401: { $ref: "#/components/responses/Unauthorized" },
          },
        },
        post: {
          summary: "Create an API key",
          operationId: "createApiKey",
          tags: ["API Keys"],
          description: "The full key (`uc_live_...`) is returned **once** in the response. Store it immediately — it cannot be retrieved again.",
          requestBody: {
            required: true,
            content: { "application/json": { schema: { type: "object", required: ["name"], properties: { name: { type: "string", minLength: 1, maxLength: 255, example: "CI pipeline" } } } } },
          },
          responses: {
            201: {
              description: "Key created",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      apiKey: { $ref: "#/components/schemas/ApiKey" },
                      key: { type: "string", description: "Full key — shown once. Copy it now.", example: "uc_live_xXxXxXxXxXxX" },
                    },
                  },
                },
              },
            },
            401: { $ref: "#/components/responses/Unauthorized" },
            403: { description: "Requires Indie plan or higher" },
          },
        },
      },
      "/api/api-keys/{id}": {
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        delete: {
          summary: "Revoke an API key",
          operationId: "revokeApiKey",
          tags: ["API Keys"],
          description: "Immediately revokes the key. In-flight requests using this key will fail.",
          responses: { 200: { description: "Revoked" }, 401: { $ref: "#/components/responses/Unauthorized" }, 404: { $ref: "#/components/responses/NotFound" } },
        },
      },

      // ── Public / Meta ──
      "/health": {
        get: {
          summary: "Health check",
          operationId: "health",
          tags: ["Meta"],
          security: [],
          description: "Liveness probe — no authentication required.",
          responses: { 200: { description: "Service is healthy" } },
        },
      },
      "/status/{slug}": {
        parameters: [{ name: "slug", in: "path", required: true, schema: { type: "string" } }],
        get: {
          summary: "Public status page JSON",
          operationId: "getPublicStatusPage",
          tags: ["Public"],
          security: [],
          description: "Returns the pre-rendered status page JSON. No authentication required.",
          responses: { 200: { description: "Status page data" }, 404: { $ref: "#/components/responses/NotFound" } },
        },
      },
      "/status/{slug}/rss": {
        parameters: [{ name: "slug", in: "path", required: true, schema: { type: "string" }, description: "Status page slug" }],
        get: {
          summary: "Atom 1.0 incident feed",
          operationId: "getStatusPageRssFeed",
          tags: ["Public"],
          security: [],
          description:
            "Returns an Atom 1.0 XML feed of the last 20 incidents (active and resolved) for the status page, " +
            "ordered newest-first. Subscribe to this URL in any RSS/Atom reader to receive incident notifications.\n\n" +
            "Private status pages require a `?token=<accessToken>` query parameter.",
          parameters: [
            {
              name: "token",
              in: "query",
              required: false,
              schema: { type: "string" },
              description: "Access token for private status pages.",
            },
          ],
          responses: {
            200: {
              description: "Atom 1.0 XML feed",
              content: {
                "application/atom+xml": {
                  schema: { type: "string", description: "Atom 1.0 XML document" },
                  example:
                    '<?xml version="1.0" encoding="UTF-8"?>\n' +
                    '<feed xmlns="http://www.w3.org/2005/Atom">\n' +
                    "  <id>https://uptimecrow.com/status/acme/rss</id>\n" +
                    "  <title>Acme Status — Incident History</title>\n" +
                    "  ...\n" +
                    "</feed>",
                },
              },
            },
            404: { description: "Status page not found or private (wrong/missing token)" },
          },
        },
      },
      "/badge/{slug}.svg": {
        parameters: [{ name: "slug", in: "path", required: true, schema: { type: "string" } }],
        get: {
          summary: "Status badge SVG",
          operationId: "getStatusBadge",
          tags: ["Public"],
          security: [],
          description: "Returns an SVG badge for embedding in READMEs. No authentication required.",
          responses: { 200: { description: "SVG badge", content: { "image/svg+xml": { schema: { type: "string" } } } } },
        },
      },
      "/heartbeat/{slug}": {
        parameters: [{ name: "slug", in: "path", required: true, schema: { type: "string" } }],
        get: {
          summary: "Receive a heartbeat ping",
          operationId: "receiveHeartbeat",
          tags: ["Public"],
          security: [],
          description: "Ping this URL from your cron job to signal it ran successfully. Also accepts POST.",
          responses: { 200: { description: "Ping recorded" }, 404: { $ref: "#/components/responses/NotFound" } },
        },
        post: {
          summary: "Receive a heartbeat ping (POST)",
          operationId: "receiveHeartbeatPost",
          tags: ["Public"],
          security: [],
          responses: { 200: { description: "Ping recorded" }, 404: { $ref: "#/components/responses/NotFound" } },
        },
      },
    },
    tags: [
      { name: "Monitors", description: "HTTP, TCP, and keyword uptime monitors" },
      { name: "Heartbeats", description: "Cron job and scheduled task monitors" },
      { name: "Incidents", description: "Incident management and status updates" },
      { name: "Status Pages", description: "Public status page management" },
      { name: "Maintenance", description: "Planned maintenance windows" },
      { name: "API Keys", description: "Manage programmatic access keys" },
      { name: "Public", description: "Unauthenticated public endpoints" },
      { name: "Meta", description: "System health and meta" },
    ],
  };
}
