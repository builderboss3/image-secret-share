import { Router } from "express";

const router = Router();

// POST /auth/register — client handles storage; server just validates input
router.post("/auth/register", (req: any, res: any) => {
  const { username } = req.body ?? {};
  if (!username || typeof username !== "string" || username.trim().length < 3) {
    return res.status(400).json({ error: "Username must be at least 3 characters" });
  }
  res.json({ success: true });
});

// POST /auth/verify — kept for backwards compat, always returns success
router.post("/auth/verify", (req: any, res: any) => {
  res.json({ success: true });
});

export default router;
