import crypto from "crypto";

/**
 * Application-level encryption at rest for the user's private data blob
 * (diary, feelings, mind dumps, learnings, goals). Even a full database
 * breach exposes only ciphertext — plaintext never touches disk.
 *
 * Algorithm: AES-256-GCM (authenticated encryption).
 * Key: derived from DATA_ENCRYPTION_KEY via SHA-256 so any sufficiently
 * long secret works. Generate one with:  openssl rand -base64 48
 */
const RAW = process.env.DATA_ENCRYPTION_KEY || "";

function key(): Buffer | null {
  if (!RAW || RAW.length < 16) return null;
  return crypto.createHash("sha256").update(RAW).digest(); // 32 bytes
}

export interface EncEnvelope {
  __enc: true;
  v: 1;
  iv: string;
  tag: string;
  ct: string;
}

/** Encrypt a JSON-serialisable value into a storage envelope. */
export function encryptJSON(obj: unknown): EncEnvelope | { __enc: false; data: unknown } {
  const k = key();
  if (!k) {
    // No key configured (local dev). Store as-is so the app still runs,
    // but production MUST set DATA_ENCRYPTION_KEY (see startup guard).
    return { __enc: false, data: obj };
  }
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", k, iv);
  const pt = Buffer.from(JSON.stringify(obj), "utf8");
  const ct = Buffer.concat([cipher.update(pt), cipher.final()]);
  const tag = cipher.getAuthTag();
  return { __enc: true, v: 1, iv: iv.toString("base64"), tag: tag.toString("base64"), ct: ct.toString("base64") };
}

/** Decrypt a storage envelope back into the original value. Back-compatible
 *  with unencrypted legacy blobs and the dev {__enc:false} shape. */
export function decryptJSON(stored: any): any {
  if (stored == null) return null;
  if (stored.__enc === true) {
    const k = key();
    if (!k) throw new Error("DATA_ENCRYPTION_KEY is missing but stored data is encrypted.");
    const iv = Buffer.from(stored.iv, "base64");
    const tag = Buffer.from(stored.tag, "base64");
    const ct = Buffer.from(stored.ct, "base64");
    const decipher = crypto.createDecipheriv("aes-256-gcm", k, iv);
    decipher.setAuthTag(tag);
    const pt = Buffer.concat([decipher.update(ct), decipher.final()]);
    return JSON.parse(pt.toString("utf8"));
  }
  if (stored.__enc === false) return stored.data;
  return stored; // legacy plaintext blob (pre-encryption migration)
}

/** Constant-time string comparison for signatures/tokens. */
export function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a || "", "utf8");
  const bb = Buffer.from(b || "", "utf8");
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}
