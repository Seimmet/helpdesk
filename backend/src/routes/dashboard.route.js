import { Router } from "express";

import { getDashboardOverview } from "../controllers/dashboard.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/overview", protectRoute, getDashboardOverview);

export default router;
