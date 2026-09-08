import { Router } from "express";

import {
  createAttachment,
  getTicketAttachments,
  deleteAttachment,
} from "../controllers/attachment.controller.js";

import {
  protectRoute,
} from "../middleware/auth.middleware.js";

const router = Router();

router.use(protectRoute);

router.post("/", createAttachment);

router.get("/ticket/:ticketId", getTicketAttachments);

router.delete("/:id", deleteAttachment);

export default router;

