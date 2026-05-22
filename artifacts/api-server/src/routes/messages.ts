import { Router } from "express";
import { randomUUID } from "crypto";
import { CreateMessageBody } from "@workspace/api-zod";

const router = Router();

// POST /messages — embed message into image, return encoded image (no DB)
router.post("/messages", async (req: any, res: any) => {
  const parsed = CreateMessageBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request body" });
  }
  const { messageText, imageData, recipientHint, isLocked } = parsed.data;
  try {
    const id = randomUUID();
    const encodedImage = embedMessage(imageData, messageText, id);
    res.status(201).json({
      id,
      senderId: "local",
      senderEmail: null,
      recipientHint: recipientHint ?? null,
      imageData: encodedImage,
      isLocked: isLocked ?? false,
      accessGranted: !(isLocked ?? false),
      isRead: false,
      readAt: null,
      readDurationSeconds: null,
      createdAt: new Date().toISOString(),
      deletedMessageAt: null,
    });
  } catch {
    res.status(500).json({ error: "Failed to encode message" });
  }
});

// GET /messages — frontend manages storage in localStorage
router.get("/messages", (_req: any, res: any) => res.json([]));

// GET /messages/stats — frontend computes from localStorage
router.get("/messages/stats", (_req: any, res: any) => {
  res.json({ totalSent: 0, totalRead: 0, totalPending: 0, totalLocked: 0, recentMessages: [] });
});

// POST /messages/decode-image — extract message directly from image pixels (no DB)
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
    const messageText = extractMessage(imageData, messageId);
    if (!messageText) {
      return res.status(400).json({ error: "Could not decode message from this image" });
    }
    res.json({
      id: messageId,
      isRead: false,
      isLocked: false,
      accessGranted: true,
      messageText,
      senderEmail: null,
      createdAt: new Date().toISOString(),
    });
  } catch {
    res.status(500).json({ error: "Failed to decode image" });
  }
});

router.delete("/messages/:id", (_req: any, res: any) => res.status(204).send());
router.post("/messages/:id/read", (_req: any, res: any) => res.json({ success: true }));
router.post("/messages/:id/grant-access", (_req: any, res: any) => res.json({ success: true }));
router.post("/messages/:id/revoke-access", (_req: any, res: any) => res.json({ success: true }));
router.get("/messages/:id", (_req: any, res: any) => res.status(404).json({ error: "Not found" }));
router.get("/messages/:id/status", (_req: any, res: any) => res.status(404).json({ error: "Not found" }));
router.post("/messages/:id/decode", (_req: any, res: any) => res.status(404).json({ error: "Not found" }));

// ─── Steganography Engine ────────────────────────────────────────────────────
const PLATFORM_KEY = process.env["SESSION_SECRET"] ?? "phantom_platform_key_2024";
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
