import { Router } from "express";

import {
  createCustomer,
  getCustomers,
  getCustomer,
  updateCustomer,
  deleteCustomer,
} from "../controllers/customer.controller.js";

import {
  protectRoute,
} from "../middleware/auth.middleware.js";

const router = Router();

router.use(protectRoute);

router.post("/", createCustomer);

router.get("/", getCustomers);

router.get("/:id", getCustomer);

router.put("/:id", updateCustomer);

router.delete("/:id", deleteCustomer);

export default router;
