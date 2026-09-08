import { Router } from "express";

import {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
} from "../controllers/user.controller.js";

import {
  protectRoute,
  requireAdmin,
} from "../middleware/auth.middleware.js";

const router = Router();

router.use(protectRoute);

router.post("/", requireAdmin, createUser);

router.get("/", getUsers);

router.get("/:id", getUser);

router.put("/:id", requireAdmin, updateUser);

router.delete("/:id", requireAdmin, deleteUser);

export default router;
