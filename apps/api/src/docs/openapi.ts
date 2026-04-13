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
        "REST API for UptimeCrow. Authenticate with an API key created from Settings → API Keys (Team plan). " +
        "Pass it as `Authorization: Bearer uc_live_...`.",
    },
    servers: [{ url, description: "Primary API" }],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "UC-API-KEY",
          description: "Team-plan API key, prefixed with uc_live_.",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            error: { type: "string" },
            issues: { type: "array", items: { type: "object" } },
          },
          required: ["error"],
        },
        Monitor: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            orgId: { type: "string", format: "uuid" },
            name: { type: "string" },
            url: { type: "string", format: "uri" },
            type: { type: "string", enum: ["http", "tcp", "keyword"] },
            intervalSeconds: { type: "integer", minimum: 30 },
            timeoutMs: { type: "integer" },
            expectedStatus: { type: "integer" },
            confirmationCount: { type: "integer", minimum: 1, maximum: 5 },
            keyword: { type: "string", nullable: true },
            status: { type: "string", enum: ["up", "down", "degraded", "unknown"] },
            lastCheckedAt: { type: "string", format: "date-time", nullable: true },
            lastResponseMs: { type: "integer", nullable: true },
            isActive: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        MonitorInput: {
          type: "object",
          required: ["name", "url"],
          properties: {
            name: { type: "string", minLength: 1, maxLength: 255 },
            url: { type: "string", maxLength: 2048 },
            type: { type: "string", enum: ["http", "tcp", "keyword"], default: "http" },
            intervalSeconds: { type: "integer", minimum: 30, maximum: 300, default: 60 },
            timeoutMs: { type: "integer", minimum: 1000, maximum: 30000, default: 10000 },
            expectedStatus: { type: "integer", minimum: 100, maximum: 599, default: 200 },
            confirmationCount: { type: "integer", minimum: 1, maximum: 5, default: 2 },
            keyword: { type: "string", maxLength: 500, nullable: true },
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
            body: { type: "string", minLength: 1, maxLength: 5000 },
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
      },
    },
    security: [{ ApiKeyAuth: [] }],
    paths: {
      "/api/monitors": {
        get: {
          summary: "List monitors",
          tags: ["Monitors"],
          responses: {
            200: {
              description: "Monitors in the caller's organization",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      monitors: { type: "array", items: { $ref: "#/components/schemas/Monitor" } },
                    },
                  },
                },
              },
            },
            401: { $ref: "#/components/responses/Unauthorized" },
          },
        },
        post: {
          summary: "Create a monitor",
          tags: ["Monitors"],
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/MonitorInput" } } },
          },
          responses: {
            201: {
              description: "Created",
              content: { "application/json": { schema: { $ref: "#/components/schemas/Monitor" } } },
            },
            400: { $ref: "#/components/responses/BadRequest" },
            401: { $ref: "#/components/responses/Unauthorized" },
          },
        },
      },
      "/api/monitors/{id}": {
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        get: {
          summary: "Get a monitor",
          tags: ["Monitors"],
          responses: {
            200: { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/Monitor" } } } },
            404: { $ref: "#/components/responses/NotFound" },
          },
        },
        patch: {
          summary: "Update a monitor",
          tags: ["Monitors"],
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/MonitorInput" } } },
          },
          responses: {
            200: { description: "Updated" },
            400: { $ref: "#/components/responses/BadRequest" },
            404: { $ref: "#/components/responses/NotFound" },
          },
        },
        delete: {
          summary: "Delete a monitor",
          tags: ["Monitors"],
          responses: { 204: { description: "Deleted" }, 404: { $ref: "#/components/responses/NotFound" } },
        },
      },
      "/api/incidents": {
        get: {
          summary: "List incidents",
          tags: ["Incidents"],
          parameters: [
            { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
            { name: "offset", in: "query", schema: { type: "integer", default: 0 } },
          ],
          responses: {
            200: {
              description: "Incidents in the caller's organization",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: { incidents: { type: "array", items: { $ref: "#/components/schemas/Incident" } } },
                  },
                },
              },
            },
          },
        },
        post: {
          summary: "Create an incident",
          tags: ["Incidents"],
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/IncidentInput" } } },
          },
          responses: {
            201: { description: "Created", content: { "application/json": { schema: { $ref: "#/components/schemas/Incident" } } } },
            400: { $ref: "#/components/responses/BadRequest" },
          },
        },
      },
      "/api/incidents/{id}": {
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        get: {
          summary: "Get an incident with its updates",
          tags: ["Incidents"],
          responses: { 200: { description: "OK" }, 404: { $ref: "#/components/responses/NotFound" } },
        },
        patch: {
          summary: "Update incident status / severity",
          tags: ["Incidents"],
          requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/IncidentInput" } } } },
          responses: { 200: { description: "Updated" } },
        },
      },
      "/api/incidents/{id}/updates": {
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        post: {
          summary: "Add a status update to an incident",
          tags: ["Incidents"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["status", "body"],
                  properties: {
                    status: { type: "string", enum: ["investigating", "identified", "monitoring", "resolved"] },
                    body: { type: "string", minLength: 1, maxLength: 5000, description: "Markdown supported." },
                  },
                },
              },
            },
          },
          responses: { 201: { description: "Created" } },
        },
      },
      "/api/maintenance-windows": {
        get: {
          summary: "List scheduled maintenance windows",
          tags: ["Maintenance"],
          responses: { 200: { description: "OK" } },
        },
        post: {
          summary: "Schedule a maintenance window",
          tags: ["Maintenance"],
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/MaintenanceWindowInput" } } },
          },
          responses: {
            201: { description: "Created", content: { "application/json": { schema: { $ref: "#/components/schemas/MaintenanceWindow" } } } },
            400: { $ref: "#/components/responses/BadRequest" },
          },
        },
      },
      "/api/maintenance-windows/{id}": {
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        patch: {
          summary: "Update or cancel a maintenance window",
          tags: ["Maintenance"],
          responses: { 200: { description: "Updated" }, 404: { $ref: "#/components/responses/NotFound" } },
        },
        delete: {
          summary: "Delete a maintenance window",
          tags: ["Maintenance"],
          responses: { 200: { description: "Deleted" }, 404: { $ref: "#/components/responses/NotFound" } },
        },
      },
      "/api/status-pages": {
        get: { summary: "List status pages", tags: ["Status Pages"], responses: { 200: { description: "OK" } } },
      },
      "/health": {
        get: {
          summary: "Liveness probe",
          tags: ["Meta"],
          security: [],
          responses: { 200: { description: "OK" } },
        },
      },
    },
    tags: [
      { name: "Monitors" },
      { name: "Incidents" },
      { name: "Maintenance" },
      { name: "Status Pages" },
      { name: "Meta" },
    ],
  };
}
