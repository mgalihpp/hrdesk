import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

// App-layer encryption for PII (SSN, bank). Mongo has no column-level encryption,
// so we encrypt at write and decrypt at read, server-side only.
const ALGO = "aes-256-gcm";
const KEY = Buffer.from(process.env.APP_ENCRYPTION_KEY ?? "", "hex");

if (KEY.length !== 32 && process.env.NODE_ENV === "production") {
  throw new Error(
    "APP_ENCRYPTION_KEY must be 32 bytes (64 hex chars) in production",
  );
}

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
