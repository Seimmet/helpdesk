import { ENV } from "./src/config/env.js";

const jsonBody = {
  required: false,
  content: {
    "application/json": {
      schema: { $ref: "#/components/schemas/JsonObject" },
    },
  },
};

const response = (description = "Successful response") => ({
  description,
  content: {
    "application/json": {
      schema: { $ref: "#/components/schemas/ApiResponse" },
    },
  },
});

const secured = (summary, method = "get", parameters = [], body = false) => ({
  summary,
  description: `${summary}. This endpoint requires an authenticated user in the current organization.`,
  security: [{ bearerAuth: [] }],
  parameters,
  ...(body ? { requestBody: jsonBody } : {}),
  responses: {
    200: response(),
    400: response("Validation error"),
    401: response("Authentication required"),
    404: response("Resource not found"),
  },
});

const id = (name = "id") => ({
  name,
  in: "path",
  required: true,
  schema: { type: "string" },
});

const paths = {
  "/api/health": {
    get: {
      summary: "Check API health",
      tags: ["System"],
      responses: { 200: response("API is running") },
    },
  },
  "/api/organizations": {
    post: secured("Create an organization", "post", [], true),
    get: secured("Get the current organization"),
    put: secured("Update the current organization", "put", [], true),
  },
  "/api/auth/register": {
    post: {
      summary: "Register an organization owner",
      description: "Public registration for a new organization and its initial owner account. Agents cannot self-register.",
      tags: ["Authentication"],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/RegisterRequest" },
          },
        },
      },
      responses: {
        201: response("Organization and owner created"),
        400: response("Validation error"),
        409: response("Email already exists"),
      },
    },
  },
  "/api/auth/login": {
    post: {
      summary: "Login with email and password",
      description: "Authenticate an active owner, admin, or agent and receive a JWT token and HTTP-only cookie.",
      tags: ["Authentication"],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/LoginRequest" },
          },
        },
      },
      responses: {
        200: response("Login successful"),
        401: response("Invalid email or password"),
        403: response("Account deactivated"),
      },
    },
  },
  "/api/auth/me": {
    get: secured("Get the authenticated user"),
  },
  "/api/auth/logout": {
    post: secured("Logout the authenticated user", "post"),
  },
  "/api/auth/change-password": {
    put: secured("Change the authenticated user's password", "put", [], true),
  },
  "/api/dashboard/overview": {
    get: secured("Get dashboard overview metrics"),
  },
  "/api/organizations/settings": {
    patch: secured("Update organization settings", "patch", [], true),
  },
  "/api/users": {
    post: {
      ...secured("Register an agent", "post", [], true),
      description: "Owner/admin-only endpoint for registering an agent in the current organization. Users cannot self-register, and this endpoint always creates the agent role.",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/AgentRegistrationRequest" },
          },
        },
      },
    },
    get: secured("List users"),
  },
  "/api/users/{id}": {
    get: secured("Get a user", "get", [id()]),
    put: secured("Update a user", "put", [id()], true),
    delete: secured("Deactivate a user", "delete", [id()]),
  },
  "/api/customers": {
    post: secured("Create a customer", "post", [], true),
    get: secured("List customers"),
  },
  "/api/customers/{id}": {
    get: secured("Get a customer", "get", [id()]),
    put: secured("Update a customer", "put", [id()], true),
    delete: secured("Delete a customer", "delete", [id()]),
  },
  "/api/tickets": {
    post: secured("Create a ticket", "post", [], true),
    get: secured("List tickets"),
  },
  "/api/tickets/{id}": {
    get: secured("Get a ticket", "get", [id()]),
    put: secured("Update a ticket", "put", [id()], true),
    delete: secured("Delete a ticket", "delete", [id()]),
  },
  "/api/tickets/{id}/assign": {
    patch: secured("Assign a ticket", "patch", [id()], true),
  },
  "/api/tickets/{id}/status": {
    patch: secured("Change ticket status", "patch", [id()], true),
  },
  "/api/tickets/{id}/priority": {
    patch: secured("Change ticket priority", "patch", [id()], true),
  },
  "/api/messages/ticket/{ticketId}": {
    get: secured("List ticket messages", "get", [id("ticketId")]),
    post: secured("Create a ticket message", "post", [id("ticketId")], true),
  },
  "/api/attachments": {
    post: secured("Upload an attachment", "post", [], true),
  },
  "/api/attachments/ticket/{ticketId}": {
    get: secured("List ticket attachments", "get", [id("ticketId")]),
  },
  "/api/attachments/{id}": {
    delete: secured("Delete an attachment", "delete", [id()]),
  },
  "/api/ticket-categories": {
    post: secured("Create a ticket category", "post", [], true),
    get: secured("List ticket categories"),
  },
  "/api/ticket-categories/{id}": {
    get: secured("Get a ticket category", "get", [id()]),
    put: secured("Update a ticket category", "put", [id()], true),
    delete: secured("Delete a ticket category", "delete", [id()]),
  },
  "/api/tags": {
    post: secured("Create a tag", "post", [], true),
    get: secured("List tags"),
  },
  "/api/tags/{id}": {
    put: secured("Update a tag", "put", [id()], true),
    delete: secured("Delete a tag", "delete", [id()]),
  },
  "/api/knowledge-base": {
    post: secured("Create a knowledge base article", "post", [], true),
    get: secured("List knowledge base articles"),
  },
  "/api/knowledge-base/{id}": {
    get: secured("Get a knowledge base article", "get", [id()]),
    put: secured("Update a knowledge base article", "put", [id()], true),
    delete: secured("Delete a knowledge base article", "delete", [id()]),
  },
  "/api/knowledge-base/{id}/publish": {
    patch: secured("Publish a knowledge base article", "patch", [id()]),
  },
  "/api/email-integrations": {
    post: secured("Create an email integration", "post", [], true),
    get: secured("List email integrations"),
  },
  "/api/email-integrations/{id}": {
    get: secured("Get an email integration", "get", [id()]),
    put: secured("Update an email integration", "put", [id()], true),
    delete: secured("Delete an email integration", "delete", [id()]),
  },
  "/api/automation-rules": {
    post: secured("Create an automation rule", "post", [], true),
    get: secured("List automation rules"),
  },
  "/api/automation-rules/{id}": {
    get: secured("Get an automation rule", "get", [id()]),
    put: secured("Update an automation rule", "put", [id()], true),
    delete: secured("Delete an automation rule", "delete", [id()]),
  },
  "/api/automation-rules/{id}/toggle": {
    patch: secured("Toggle an automation rule", "patch", [id()]),
  },
};

const aiPaths = [
  ["/api/ai/analyze-ticket/{ticketId}", "Analyze a ticket"],
  ["/api/ai/generate-response/{ticketId}", "Generate a customer response"],
  ["/api/ai/improve-response/{ticketId}", "Improve an agent response"],
  ["/api/ai/suggest-reply/{ticketId}", "Suggest a reply"],
  ["/api/ai/summarize-ticket/{ticketId}", "Summarize a ticket"],
  ["/api/ai/knowledge-base-answer/{ticketId}", "Find a knowledge base answer"],
  ["/api/ai/resolve-ticket/{ticketId}", "Resolve a ticket with AI"],
  ["/api/ai/escalate-ticket/{ticketId}", "Escalate a ticket"],
];

for (const [path, summary] of aiPaths) {
  paths[path] = { post: secured(summary, "post", [id("ticketId")], true) };
}

paths["/api/ai-analysis"] = {
  get: secured("List AI analyses"),
};
paths["/api/ai-analysis/ticket/{ticketId}"] = {
  get: secured("Get AI analysis for a ticket", "get", [id("ticketId")]),
};
paths["/api/ai-analysis/{id}/approve"] = {
  patch: secured("Approve an AI response", "patch", [id()], true),
};

const categoryTags = [
  ["/api/auth", "Authentication"],
  ["/api/dashboard", "Dashboard"],
  ["/api/organizations", "Organizations"],
  ["/api/users", "Users"],
  ["/api/customers", "Customers"],
  ["/api/tickets", "Tickets"],
  ["/api/messages", "Messages"],
  ["/api/attachments", "Attachments"],
  ["/api/ticket-categories", "Ticket Categories"],
  ["/api/tags", "Tags"],
  ["/api/knowledge-base", "Knowledge Base"],
  ["/api/email-integrations", "Email Integrations"],
  ["/api/automation-rules", "Automation Rules"],
  ["/api/ai-analysis", "AI Analysis"],
  ["/api/ai", "AI Assistant"],
];

const tagForPath = (path) => {
  const match = categoryTags.find(([prefix]) => path.startsWith(prefix));
  return match?.[1] || "System";
};

for (const [path, pathItem] of Object.entries(paths)) {
  for (const operation of Object.values(pathItem)) {
    operation.tags = [tagForPath(path)];
    operation.operationId = `${operation.tags[0].toLowerCase().replaceAll(" ", "-")}-${operation.summary.toLowerCase().replaceAll(" ", "-")}`;
  }
}

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Helpdesk API",
      version: "1.0.0",
      description: "API documentation for the Helpdesk platform",
      contact: {
        name: "Developer",
        email: "support@helpdesk.com",
      },
    },
    tags: [
      { name: "System", description: "Service availability and runtime information." },
      { name: "Authentication", description: "Owner registration, login, logout, and password management." },
      { name: "Dashboard", description: "Operational ticket, AI resolution, escalation, and response-time metrics." },
      { name: "Organizations", description: "Organization profile and settings operations." },
      { name: "Users", description: "Agent and user administration operations." },
      { name: "Customers", description: "Customer record operations." },
      { name: "Tickets", description: "Ticket lifecycle, assignment, status, and priority operations." },
      { name: "Messages", description: "Messages associated with support tickets." },
      { name: "Attachments", description: "File attachments associated with support tickets." },
      { name: "Ticket Categories", description: "Ticket category administration operations." },
      { name: "Tags", description: "Ticket tag administration operations." },
      { name: "Knowledge Base", description: "Knowledge base article operations." },
      { name: "Email Integrations", description: "Inbound and outbound email integration operations." },
      { name: "Automation Rules", description: "Automation rule administration and activation operations." },
      { name: "AI Assistant", description: "AI-powered ticket analysis and response operations." },
      { name: "AI Analysis", description: "Stored AI analysis and approval operations." },
    ],
    servers: [
      {
        url: `http://localhost:${ENV.PORT || 3000}`,
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        RegisterRequest: {
          type: "object",
          required: ["organizationName", "name", "email", "password"],
          properties: {
            organizationName: { type: "string", example: "Acme Support" },
            name: { type: "string", example: "Jane Owner" },
            email: { type: "string", format: "email", example: "owner@acme.com" },
            password: { type: "string", format: "password", minLength: 8, example: "strong-password" },
            websiteUrl: { type: "string", format: "uri", example: "https://acme.com" },
            supportEmail: { type: "string", format: "email", example: "support@acme.com" },
            timezone: { type: "string", example: "Africa/Lagos" },
          },
        },
        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email", example: "owner@acme.com" },
            password: { type: "string", format: "password", example: "strong-password" },
          },
        },
        ChangePasswordRequest: {
          type: "object",
          required: ["currentPassword", "newPassword"],
          properties: {
            currentPassword: { type: "string", format: "password" },
            newPassword: { type: "string", format: "password", minLength: 8 },
          },
        },
        AgentRegistrationRequest: {
          type: "object",
          required: ["name", "email", "password"],
          properties: {
            name: { type: "string", example: "Support Agent" },
            email: { type: "string", format: "email", example: "agent@acme.com" },
            password: { type: "string", format: "password", minLength: 8 },
            imageUrl: { type: "string", format: "uri" },
          },
        },
        JsonObject: {
          type: "object",
          additionalProperties: true,
          description: "Request fields vary by endpoint.",
        },
        ApiResponse: {
          type: "object",
          additionalProperties: true,
          properties: {
            success: { type: "boolean" },
            message: { type: "string" },
            data: { type: "object", additionalProperties: true },
          },
        },
      },
    },
    paths,
  },
};

export const swaggerSpec = options.definition;
