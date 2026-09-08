import { Router } from "express";

import {
  getTicketMessages,
  createMessage,
} from "../controllers/message.controller.js";

import {
  protectRoute,
} from "../middleware/auth.middleware.js";

const router = Router();

router.use(protectRoute);

router.get("/ticket/:ticketId", getTicketMessages);

router.post("/ticket/:ticketId", createMessage);

export default router;
