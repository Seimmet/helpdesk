import { Router } from "express";

import {
  createCategory,
  getCategories,
  getCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/ticket-category.controller.js";

import {
  protectRoute,
  requireAdmin,
} from "../middleware/auth.middleware.js";

const router = Router();

router.use(protectRoute);

router.post("/", requireAdmin, createCategory);

router.get("/", getCategories);

router.get("/:id", getCategory);

router.put("/:id", requireAdmin, updateCategory);

router.delete("/:id", requireAdmin, deleteCategory);

export default router;
