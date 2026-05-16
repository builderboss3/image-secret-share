import { Router } from "express";
import jwt from "jsonwebtoken";
import { GenerateCarrierImageBody } from "@workspace/api-zod";

const router = Router();
const JWT_SECRET = process.env.SESSION_SECRET ?? "phantom_jwt_secret_fallback_2024";

function requireAuth(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { sub: string };
    req.userId = payload.sub;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

// POST /images/generate
router.post("/images/generate", requireAuth, async (req: any, res: any) => {
  const parsed = GenerateCarrierImageBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request body" });
  }

  const {
    type,
    color1 = "#1a1a2e",
    color2 = "#16213e",
    width = 800,
    height = 600,
  } = parsed.data;

  const w = Math.min(width, 1200);
  const h = Math.min(height, 900);

  // Generate a PNG image using raw pixel data
  const imageData = generateImage(type, color1 ?? "#1a1a2e", color2 ?? "#16213e", w, h);
  const base64 = "data:image/png;base64," + toPNG(imageData, w, h).toString("base64");

  res.json({ imageData: base64, width: w, height: h, type });
});

type ImageType = "solid" | "gradient" | "noise" | "grid" | "dots";

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16) || 0;
  const g = parseInt(h.substring(2, 4), 16) || 0;
  const b = parseInt(h.substring(4, 6), 16) || 0;
  return [r, g, b];
}

function lerp(a: number, b: number, t: number): number {
  return Math.round(a + (b - a) * t);
}

function generateImage(
  type: string,
  color1: string,
  color2: string,
  w: number,
  h: number,
): Uint8Array {
  const [r1, g1, b1] = hexToRgb(color1);
  const [r2, g2, b2] = hexToRgb(color2);
  const pixels = new Uint8Array(w * h * 4);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      let r = r1, g = g1, b = b1, a = 255;

      switch (type as ImageType) {
        case "solid":
          r = r1; g = g1; b = b1;
          break;
        case "gradient": {
          const t = x / (w - 1);
          r = lerp(r1, r2, t);
          g = lerp(g1, g2, t);
          b = lerp(b1, b2, t);
          break;
        }
        case "noise": {
          // Simplex-like noise using integer math
          const nx = x * 7 + y * 3;
          const ny = y * 7 + x * 11;
          const n = ((nx * 1664525 + ny * 1013904223) >>> 0) / 0xffffffff;
          const t = n;
          r = lerp(r1, r2, t);
          g = lerp(g1, g2, t);
          b = lerp(b1, b2, t);
          break;
        }
        case "grid": {
          const gx = x % 40 < 2 || y % 40 < 2;
          r = gx ? lerp(r1, r2, 0.5) : r1;
          g = gx ? lerp(g1, g2, 0.5) : g1;
          b = gx ? lerp(b1, b2, 0.5) : b1;
          break;
        }
        case "dots": {
          const dx = (x % 40) - 20;
          const dy = (y % 40) - 20;
          const inDot = dx * dx + dy * dy < 64;
          r = inDot ? r2 : r1;
          g = inDot ? g2 : g1;
          b = inDot ? b2 : b1;
          break;
        }
      }

      pixels[idx] = r;
      pixels[idx + 1] = g;
      pixels[idx + 2] = b;
      pixels[idx + 3] = a;
    }
  }
  return pixels;
}

// Minimal PNG encoder
function toPNG(pixels: Uint8Array, w: number, h: number): Buffer {
  const rawRows: Buffer[] = [];
  for (let y = 0; y < h; y++) {
    const row = Buffer.alloc(w * 4 + 1);
    row[0] = 0; // filter type none
    for (let x = 0; x < w; x++) {
      const si = (y * w + x) * 4;
      row[1 + x * 4] = pixels[si];
      row[1 + x * 4 + 1] = pixels[si + 1];
      row[1 + x * 4 + 2] = pixels[si + 2];
      row[1 + x * 4 + 3] = pixels[si + 3];
    }
    rawRows.push(row);
  }
  const rawData = Buffer.concat(rawRows);

  // Zlib compress
  const { deflateSync } = require("zlib");
  const compressed = deflateSync(rawData);

  function crc32(buf: Buffer): number {
    let crc = 0xffffffff;
    const table = crc32Table();
    for (const b of buf) crc = (crc >>> 8) ^ table[(crc ^ b) & 0xff];
    return (crc ^ 0xffffffff) >>> 0;
  }

  function crc32Table(): number[] {
    const t = new Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[i] = c >>> 0;
    }
    return t;
  }

  function chunk(type: string, data: Buffer): Buffer {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, "ascii");
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", compressed),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

export default router;
