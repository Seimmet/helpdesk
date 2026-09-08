import { Router } from "express";

import {
  createTicket,
  getTickets,
  getTicket,
  updateTicket,
  assignTicket,
  changeTicketStatus,
  changeTicketPriority,
  deleteTicket,
} from "../controllers/ticket.controller.js";

import {
  protectRoute,
} from "../middleware/auth.middleware.js";

const router = Router();

router.use(protectRoute);

router.post("/", createTicket);

router.get("/", getTickets);

router.get("/:id", getTicket);

router.put("/:id", updateTicket);

router.patch("/:id/assign", assignTicket);

router.patch("/:id/status", changeTicketStatus);

router.patch("/:id/priority", changeTicketPriority);

router.delete("/:id", deleteTicket);

export default router;
