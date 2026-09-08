import { Router } from "express";

import {
  createEmailIntegration,
  getEmailIntegrations,
  getEmailIntegration,
  updateEmailIntegration,
  deleteEmailIntegration,
} from "../controllers/email-integration.controller.js";

import {
  protectRoute,
  requireAdmin,
} from "../middleware/auth.middleware.js";

const router = Router();

router.use(protectRoute);

router.post("/", requireAdmin, createEmailIntegration);

router.get("/", getEmailIntegrations);

router.get("/:id", getEmailIntegration);

router.put("/:id", requireAdmin, updateEmailIntegration);

router.delete("/:id", requireAdmin, deleteEmailIntegration);

export default router;
