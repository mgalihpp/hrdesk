import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";

// App-layer encryption for PII (SSN, bank). Mongo has no column-level encryption,
// so we encrypt at write and decrypt at read, server-side only.
const ALGO = "aes-256-gcm";

function getKey(): Buffer {
  const raw = process.env.APP_ENCRYPTION_KEY ?? "";
  if (/^[0-9a-f]{64}$/i.test(raw)) return Buffer.from(raw, "hex");
  if (raw.length === 0) return Buffer.alloc(32, 0);
  return createHash("sha256").update(raw).digest();
}

const KEY = getKey();

export function encrypt(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, KEY, iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString("hex"), tag.toString("hex"), enc.toString("hex")].join(
    ":",
  );
}

export function decrypt(payload: string): string {
  const [ivH, tagH, encH] = payload.split(":");
  const decipher = createDecipheriv(ALGO, KEY, Buffer.from(ivH, "hex"));
  decipher.setAuthTag(Buffer.from(tagH, "hex"));
  const dec = Buffer.concat([
    decipher.update(Buffer.from(encH, "hex")),
    decipher.final(),
  ]);
  return dec.toString("utf8");
}
