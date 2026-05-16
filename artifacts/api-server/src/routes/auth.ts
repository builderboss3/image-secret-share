import { Router } from "express";
import jwt from "jsonwebtoken";

const router = Router();
const JWT_SECRET = process.env.SESSION_SECRET ?? "phantom_dev_secret_change_me";

// POST /auth/verify — check passcode, return JWT
router.post("/auth/verify", (req: any, res: any) => {
  const { passcode } = req.body ?? {};

  const expected = process.env.DASHBOARD_PASSCODE;
  if (!expected) {
    return res.status(503).json({ error: "DASHBOARD_PASSCODE is not configured on the server" });
  }

  if (!passcode || passcode !== expected) {
    return res.status(401).json({ error: "Wrong passcode" });
  }

  const token = jwt.sign({ sub: "owner", authorized: true }, JWT_SECRET, { expiresIn: "30d" });
  res.json({ token });
});

export default router;
