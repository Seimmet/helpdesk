import { Router } from "express";

import {
  createArticle,
  getArticles,
  getArticle,
  updateArticle,
  deleteArticle,
  publishArticle,
} from "../controllers/knowledge-base-article.controller.js";

import {
  protectRoute,
  requireAdmin,
} from "../middleware/auth.middleware.js";

const router = Router();

router.use(protectRoute);

router.post("/", requireAdmin, createArticle);

router.get("/", getArticles);

router.get("/:id", getArticle);

router.put("/:id", requireAdmin, updateArticle);

router.patch("/:id/publish", requireAdmin, publishArticle);

router.delete("/:id", requireAdmin, deleteArticle);

export default router;
