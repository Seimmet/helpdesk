import { Router } from "express";

import {
  getTicketAIAnalysis,
  getAIAnalyses,
  approveAIResponse,
} from "../controllers/ai-analysis.controller.js";

import {
  protectRoute,
} from "../middleware/auth.middleware.js";

const router = Router();

router.use(protectRoute);

router.get("/ticket/:ticketId", getTicketAIAnalysis);

router.get("/", getAIAnalyses);

router.patch("/:id/approve", approveAIResponse);

export default router;
