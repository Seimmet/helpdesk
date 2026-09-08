import { Router } from "express";

import {
  createOrganization,
  getOrganization,
  updateOrganization,
  updateOrganizationSettings,
} from "../controllers/organization.controller.js";

import {
  protectRoute,
  requireAdmin,
  requireOwner,
} from "../middleware/auth.middleware.js";

const router = Router();

// All organization routes require authentication
router.use(protectRoute);

router.post("/", requireOwner, createOrganization);

router.get("/", getOrganization);

router.put("/", requireAdmin, updateOrganization);

router.patch("/settings", requireAdmin, updateOrganizationSettings);

export default router;
