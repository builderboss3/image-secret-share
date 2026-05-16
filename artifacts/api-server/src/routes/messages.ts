import { Router } from "express";
import jwt from "jsonwebtoken";
import { db } from "@workspace/db";
import { messagesTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { randomUUID } from "crypto";
import {
  CreateMessageBody,
  MarkMessageReadBody,
} from "@workspace/api-zod";

const router = Router();
const JWT_SECRET = process.env.SESSION_SECRET ?? "phantom_jwt_secret_fallback_2024";

function requireAuth(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { sub: string; email?: string };
    req.userId = payload.sub;
    req.userEmail = payload.email;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

function toApiMessage(row: typeof messagesTable.$inferSelect) {
  return {
    id: row.id,
    senderId: row.senderId,
    senderEmail: row.senderEmail ?? null,
    recipientHint: row.recipientHint ?? null,
    imageData: row.imageData,
    isLocked: row.isLocked,
    accessGranted: row.accessGranted,
    isRead: row.isRead,
    readAt: row.readAt?.toISOString() ?? null,
    readDurationSeconds: row.readDurationSeconds ?? null,
    createdAt: row.createdAt.toISOString(),
    deletedMessageAt: row.deletedMessageAt?.toISOString() ?? null,
  };
}

// GET /messages — list sender's messages
router.get("/messages", requireAuth, async (req: any, res: any) => {
  try {
    const rows = await db
      .select()
      .from(messagesTable)
      .where(eq(messagesTable.senderId, req.userId))
      .orderBy(desc(messagesTable.createdAt));
    res.json(rows.map(toApiMessage));
  } catch (err) {
    req.log.error({ err }, "Failed to list messages");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /messages — create a new secret message
router.post("/messages", requireAuth, async (req: any, res: any) => {
  const parsed = CreateMessageBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request body" });
  }

  const { messageText, imageData, recipientHint, isLocked } = parsed.data;

  try {
    const id = randomUUID();
    const encodedImage = embedMessage(imageData, messageText, id);

    const [row] = await db
      .insert(messagesTable)
      .values({
        id,
        senderId: req.userId,
        senderEmail: req.userEmail ?? null,
        recipientHint: recipientHint ?? null,
        messageText,
        imageData: encodedImage,
        isLocked: isLocked ?? false,
        accessGranted: isLocked ? false : true,
        isRead: false,
      })
      .returning();

    res.status(201).json(toApiMessage(row));
  } catch (err) {
    req.log.error({ err }, "Failed to create message");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /messages/stats — dashboard stats
router.get("/messages/stats", requireAuth, async (req: any, res: any) => {
  try {
    const all = await db
      .select()
      .from(messagesTable)
      .where(eq(messagesTable.senderId, req.userId))
      .orderBy(desc(messagesTable.createdAt));

    const totalSent = all.length;
    const totalRead = all.filter((m) => m.isRead).length;
    const totalPending = all.filter((m) => !m.isRead).length;
    const totalLocked = all.filter((m) => m.isLocked && !m.accessGranted).length;
    const recentMessages = all.slice(0, 5).map(toApiMessage);

    res.json({ totalSent, totalRead, totalPending, totalLocked, recentMessages });
  } catch (err) {
    req.log.error({ err }, "Failed to get stats");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /messages/decode-image — receiver uploads image, we extract ID + message
router.post("/messages/decode-image", async (req: any, res: any) => {
  const { imageData } = req.body;
  if (!imageData || typeof imageData !== "string") {
    return res.status(400).json({ error: "imageData is required" });
  }

  try {
    const messageId = extractMessageId(imageData);
    if (!messageId) {
      return res.status(400).json({ error: "This image does not contain a Phantom message" });
    }

    const [row] = await db
      .select()
      .from(messagesTable)
      .where(eq(messagesTable.id, messageId));

    if (!row) {
      return res.status(404).json({ error: "Message not found or has been destroyed" });
    }

    if (row.isRead) {
      return res.json({
        id: row.id, isRead: true, isLocked: row.isLocked, accessGranted: row.accessGranted,
        messageText: null, senderEmail: row.senderEmail ?? null, createdAt: row.createdAt.toISOString(),
      });
    }

    if (row.isLocked && !row.accessGranted) {
      return res.json({
        id: row.id, isRead: false, isLocked: true, accessGranted: false,
        messageText: null, senderEmail: row.senderEmail ?? null, createdAt: row.createdAt.toISOString(),
      });
    }

    const messageText = extractMessage(imageData, messageId);
    if (!messageText) {
      return res.status(400).json({ error: "Could not decode message content" });
    }

    res.json({
      id: row.id, isRead: false, isLocked: row.isLocked, accessGranted: row.accessGranted,
      messageText, senderEmail: row.senderEmail ?? null, createdAt: row.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to decode image");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /messages/:id
router.get("/messages/:id", requireAuth, async (req: any, res: any) => {
  const { id } = req.params;
  try {
    const [row] = await db.select().from(messagesTable)
      .where(and(eq(messagesTable.id, id), eq(messagesTable.senderId, req.userId)));
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(toApiMessage(row));
  } catch (err) {
    req.log.error({ err }, "Failed to get message");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /messages/:id
router.delete("/messages/:id", requireAuth, async (req: any, res: any) => {
  const { id } = req.params;
  try {
    await db.delete(messagesTable)
      .where(and(eq(messagesTable.id, id), eq(messagesTable.senderId, req.userId)));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete message");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /messages/:id/status
router.get("/messages/:id/status", async (req: any, res: any) => {
  const { id } = req.params;
  try {
    const [row] = await db.select().from(messagesTable).where(eq(messagesTable.id, id));
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json({
      id: row.id, isLocked: row.isLocked, accessGranted: row.accessGranted, isRead: row.isRead,
      senderEmail: row.senderEmail ?? null, createdAt: row.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get status");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /messages/:id/decode
router.post("/messages/:id/decode", async (req: any, res: any) => {
  const { id } = req.params;
  try {
    const [row] = await db.select().from(messagesTable).where(eq(messagesTable.id, id));
    if (!row) return res.status(404).json({ error: "Not found" });
    if (row.isRead) return res.status(403).json({ error: "Message already read" });
    if (row.isLocked && !row.accessGranted) {
      return res.status(403).json({ error: "Message is locked" });
    }
    const messageText = extractMessage(row.imageData, id);
    if (!messageText) return res.status(400).json({ error: "Could not decode message" });
    res.json({ id: row.id, messageText, decodedAt: new Date().toISOString() });
  } catch (err) {
    req.log.error({ err }, "Failed to decode message");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /messages/:id/read
router.post("/messages/:id/read", async (req: any, res: any) => {
  const { id } = req.params;
  const parsed = MarkMessageReadBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid request body" });
  const { readDurationSeconds } = parsed.data;

  try {
    const [row] = await db.select().from(messagesTable).where(eq(messagesTable.id, id));
    if (!row) return res.status(404).json({ error: "Not found" });

    const [updated] = await db.update(messagesTable)
      .set({ isRead: true, readAt: new Date(), readDurationSeconds, messageText: null, deletedMessageAt: new Date() })
      .where(eq(messagesTable.id, id))
      .returning();

    res.json(toApiMessage(updated));
  } catch (err) {
    req.log.error({ err }, "Failed to mark read");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /messages/:id/grant-access
router.post("/messages/:id/grant-access", requireAuth, async (req: any, res: any) => {
  const { id } = req.params;
  try {
    const [row] = await db.select().from(messagesTable)
      .where(and(eq(messagesTable.id, id), eq(messagesTable.senderId, req.userId)));
    if (!row) return res.status(404).json({ error: "Not found" });
    const [updated] = await db.update(messagesTable).set({ accessGranted: true })
      .where(eq(messagesTable.id, id)).returning();
    res.json(toApiMessage(updated));
  } catch (err) {
    req.log.error({ err }, "Failed to grant access");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /messages/:id/revoke-access
router.post("/messages/:id/revoke-access", requireAuth, async (req: any, res: any) => {
  const { id } = req.params;
  try {
    const [row] = await db.select().from(messagesTable)
      .where(and(eq(messagesTable.id, id), eq(messagesTable.senderId, req.userId)));
    if (!row) return res.status(404).json({ error: "Not found" });
    const [updated] = await db.update(messagesTable).set({ accessGranted: false })
      .where(eq(messagesTable.id, id)).returning();
    res.json(toApiMessage(updated));
  } catch (err) {
    req.log.error({ err }, "Failed to revoke access");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Steganography Engine ───────────────────────────────────────────────────
const PLATFORM_KEY = process.env.SESSION_SECRET ?? "phantom_platform_key_2024";
const MAGIC = 0x5048544d;
const ID_SEED = "PHANTOM_ID_HEADER_V1_" + PLATFORM_KEY;
const UUID_BYTE_LEN = 36;

function xorKeyStream(data: Buffer, seed: string): Buffer {
  const key = Buffer.from(seed + PLATFORM_KEY);
  const out = Buffer.alloc(data.length);
  for (let i = 0; i < data.length; i++) out[i] = data[i] ^ key[i % key.length];
  return out;
}

function scatterIndices(count: number, rangeSize: number, seed: string): number[] {
  const result: number[] = [];
  let state = 0;
  for (let i = 0; i < seed.length; i++) state = (state * 31 + seed.charCodeAt(i)) >>> 0;
  const indices = new Set<number>();
  let cur = state % rangeSize;
  while (result.length < count) {
    cur = (cur * 1664525 + 1013904223) >>> 0;
    const idx = cur % rangeSize;
    if (!indices.has(idx)) { indices.add(idx); result.push(idx); }
  }
  return result;
}

function getImageBuffer(b64: string): Buffer {
  return Buffer.from(b64.replace(/^data:image\/\w+;base64,/, ""), "base64");
}

function readBitsFromBuffer(buf: Buffer, bitPositions: number[], byteCount: number, offset: number): Buffer {
  const out = Buffer.alloc(byteCount);
  for (let i = 0; i < byteCount; i++) {
    let byte = 0;
    for (let b = 0; b < 8; b++) byte = (byte << 1) | (buf[offset + bitPositions[i * 8 + b]] & 1);
    out[i] = byte;
  }
  return out;
}

function writeBitsToBuffer(buf: Buffer, data: Buffer, bitPositions: number[], offset: number): void {
  for (let i = 0; i < data.length; i++)
    for (let b = 0; b < 8; b++) {
      const bit = (data[i] >> (7 - b)) & 1;
      buf[offset + bitPositions[i * 8 + b]] = (buf[offset + bitPositions[i * 8 + b]] & 0xfe) | bit;
    }
}

const PNG_HEADER_SIZE = 41;

function embedMessage(imageDataBase64: string, message: string, messageId: string): string {
  const imgBuffer = getImageBuffer(imageDataBase64);
  const usableBytes = imgBuffer.length - PNG_HEADER_SIZE;
  const half = Math.floor(usableBytes / 2);
  const idBitsNeeded = UUID_BYTE_LEN * 8;
  if (half < idBitsNeeded) return imageDataBase64;

  const msgBuf = Buffer.from(message, "utf8");
  const encrypted = xorKeyStream(msgBuf, messageId);
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(encrypted.length, 0);
  const magic = [(MAGIC >>> 24) & 0xff, (MAGIC >>> 16) & 0xff, (MAGIC >>> 8) & 0xff, MAGIC & 0xff];
  const payload = Buffer.concat([Buffer.from(magic), lenBuf, encrypted]);

  if (half < payload.length * 8) return imageDataBase64;

  const work = Buffer.from(imgBuffer);
  writeBitsToBuffer(work, Buffer.from(messageId, "ascii"), scatterIndices(idBitsNeeded, half, ID_SEED), PNG_HEADER_SIZE);
  writeBitsToBuffer(work, payload, scatterIndices(payload.length * 8, half, messageId), PNG_HEADER_SIZE + half);
  return "data:image/png;base64," + work.toString("base64");
}

function extractMessageId(b64: string): string | null {
  const imgBuffer = getImageBuffer(b64);
  const usableBytes = imgBuffer.length - PNG_HEADER_SIZE;
  const half = Math.floor(usableBytes / 2);
  const idBitsNeeded = UUID_BYTE_LEN * 8;
  if (half < idBitsNeeded) return null;
  const idBytes = readBitsFromBuffer(imgBuffer, scatterIndices(idBitsNeeded, half, ID_SEED), UUID_BYTE_LEN, PNG_HEADER_SIZE);
  const candidate = idBytes.toString("ascii");
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(candidate)) return null;
  return candidate;
}

function extractMessage(b64: string, messageId: string): string | null {
  const imgBuffer = getImageBuffer(b64);
  const usableBytes = imgBuffer.length - PNG_HEADER_SIZE;
  const half = Math.floor(usableBytes / 2);
  const headerBitsNeeded = 12 * 8;
  if (half < headerBitsNeeded) return null;

  const headerPositions = scatterIndices(headerBitsNeeded, half, messageId);
  const headerBytes = readBitsFromBuffer(imgBuffer, headerPositions, 12, PNG_HEADER_SIZE + half);
  if (headerBytes.readUInt32BE(0) !== MAGIC) return null;

  const msgLen = headerBytes.readUInt32BE(4);
  if (msgLen === 0 || msgLen > 100000) return null;

  const totalPayloadLen = 8 + msgLen;
  if (half < totalPayloadLen * 8) return null;

  const allPositions = scatterIndices(totalPayloadLen * 8, half, messageId);
  const payloadBytes = readBitsFromBuffer(imgBuffer, allPositions, totalPayloadLen, PNG_HEADER_SIZE + half);
  return xorKeyStream(payloadBytes.slice(8), messageId).toString("utf8");
}

export default router;
