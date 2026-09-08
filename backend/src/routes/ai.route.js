import { Router } from "express";

import {
  analyzeTicket,
  generateResponse,
  improveResponse,
  suggestReply,
  summarizeTicket,
  findKnowledgeBaseAnswer,
  resolveTicketWithAI,
  escalateTicket,
} from "../controllers/ai.controller.js";

import {
  protectRoute,
} from "../middleware/auth.middleware.js";

const router = Router();

router.use(protectRoute);

/*
|--------------------------------------------------------------------------
| Ticket Analysis
|--------------------------------------------------------------------------
*/

// Analyze ticket using AI
router.post(
  "/analyze-ticket/:ticketId",
  analyzeTicket
);


/*
|--------------------------------------------------------------------------
| AI Responses
|--------------------------------------------------------------------------
*/

// Generate a complete customer response
router.post(
  "/generate-response/:ticketId",
  generateResponse
);

// Improve an agent's draft response
router.post(
  "/improve-response/:ticketId",
  improveResponse
);

// Suggest a reply to an agent
router.post(
  "/suggest-reply/:ticketId",
  suggestReply
);


/*
|--------------------------------------------------------------------------
| Ticket Intelligence
|--------------------------------------------------------------------------
*/

// Summarize ticket
router.post(
  "/summarize-ticket/:ticketId",
  summarizeTicket
);

// Search knowledge base for an answer
router.post(
  "/knowledge-base-answer/:ticketId",
  findKnowledgeBaseAnswer
);


/*
|--------------------------------------------------------------------------
| AI Ticket Resolution
|--------------------------------------------------------------------------
*/

// Attempt to resolve ticket automatically
router.post(
  "/resolve-ticket/:ticketId",
  resolveTicketWithAI
);

// Escalate ticket to human agent
router.post(
  "/escalate-ticket/:ticketId",
  escalateTicket
);

export default router;

