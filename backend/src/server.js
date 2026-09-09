import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import { ENV } from "./config/env.js";
import { connectDB } from "./config/db.js";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "../swagger.js";

// Routes
import organizationRoutes from "./routes/organization.route.js";
import userRoutes from "./routes/user.route.js";
import customerRoutes from "./routes/customer.route.js";
import ticketRoutes from "./routes/ticket.route.js";
import messageRoutes from "./routes/message.route.js";
import attachmentRoutes from "./routes/attachment.route.js";
import ticketCategoryRoutes from "./routes/ticket-category.route.js";
import tagRoutes from "./routes/tag.route.js";
import knowledgeBaseArticleRoutes from "./routes/knowledge-base-article.route.js";
import aiAnalysisRoutes from "./routes/ai-analysis.route.js";
import aiRoutes from "./routes/ai.route.js";
import emailIntegrationRoutes from "./routes/email-integration.route.js";
import automationRuleRoutes from "./routes/automation-rule.route.js";
import dashboardRoutes from "./routes/dashboard.route.js";
import authRoutes from "./routes/auth.route.js";

import { errorMiddleware } from "./middleware/error.middleware.js";

const app = express();
app.use(cookieParser());


/*
|--------------------------------------------------------------------------
| Global Middleware
|--------------------------------------------------------------------------
*/

// Parse incoming JSON requests
app.use(express.json());

// Enable CORS
app.use(
  cors({
    origin: ENV.CLIENT_URL,
    credentials: true,
  })
);


app.get("/api-docs/swagger.json", (req, res) => {
  res.json(swaggerSpec);
});

// Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));


/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Organizations
app.use(
  "/api/auth",
  authRoutes
);

// Dashboard
app.use(
  "/api/dashboard",
  dashboardRoutes
);

// Organizations
app.use(
  "/api/organizations",
  organizationRoutes
);

// Users / Agents
app.use(
  "/api/users",
  userRoutes
);

// Customers
app.use(
  "/api/customers",
  customerRoutes
);

// Tickets
app.use(
  "/api/tickets",
  ticketRoutes
);

// Ticket messages
app.use(
  "/api/messages",
  messageRoutes
);

// Attachments
app.use(
  "/api/attachments",
  attachmentRoutes
);

// Ticket categories
app.use(
  "/api/ticket-categories",
  ticketCategoryRoutes
);

// Tags
app.use(
  "/api/tags",
  tagRoutes
);

// Knowledge base
app.use(
  "/api/knowledge-base",
  knowledgeBaseArticleRoutes
);

// AI actions
app.use(
  "/api/ai",
  aiRoutes
);

// AI analysis records
app.use(
  "/api/ai-analysis",
  aiAnalysisRoutes
);

// Email integrations
app.use(
  "/api/email-integrations",
  emailIntegrationRoutes
);

// Automation rules
app.use(
  "/api/automation-rules",
  automationRuleRoutes
);


/*
|--------------------------------------------------------------------------
| Health Check
|--------------------------------------------------------------------------
*/

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Helpdesk API is running",
  });
});


/*
|--------------------------------------------------------------------------
| 404 + Global Error Handler
|--------------------------------------------------------------------------
*/

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.use(errorMiddleware);


/*
|--------------------------------------------------------------------------
| Start Server
|--------------------------------------------------------------------------
*/

export { app };

const startServer = async () => {
  try {
    await connectDB();

    app.listen(ENV.PORT || 3000, () => {
      console.log(
        `Helpdesk API is running on port ${ENV.PORT || 3000}`
      );
    });
  } catch (error) {
    console.error(
      "Failed to start server:",
      error
    );

    process.exit(1);
  }
};

startServer();

