import { Router } from "express";

import {
  createAutomationRule,
  getAutomationRules,
  getAutomationRule,
  updateAutomationRule,
  deleteAutomationRule,
  toggleAutomationRule,
} from "../controllers/automation-rule.controller.js";

import {
  protectRoute,
  requireAdmin,
} from "../middleware/auth.middleware.js";

const router = Router();

router.use(protectRoute);

router.post("/", requireAdmin, createAutomationRule);

router.get("/", getAutomationRules);

router.get("/:id", getAutomationRule);

router.put("/:id", requireAdmin, updateAutomationRule);

router.patch("/:id/toggle", requireAdmin, toggleAutomationRule);

router.delete("/:id", requireAdmin, deleteAutomationRule);

export default router;
