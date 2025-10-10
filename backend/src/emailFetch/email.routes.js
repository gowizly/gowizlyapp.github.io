import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import { fetchUserEmails } from "./email.controller.js";

const router = express.Router();

router.use(authenticateToken); // ✅ Protect all email routes

// GET /api/emails/fetch
router.get("/fetch", fetchUserEmails);

export default router;