import { Router } from "express";

import {
  createTag,
  getTags,
  updateTag,
  deleteTag,
} from "../controllers/tag.controller.js";

import {
  protectRoute,
  requireAdmin,
} from "../middleware/auth.middleware.js";

const router = Router();

router.use(protectRoute);

router.post("/", requireAdmin, createTag);

router.get("/", getTags);

router.put("/:id", requireAdmin, updateTag);

router.delete("/:id", requireAdmin, deleteTag);

export default router;
