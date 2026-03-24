import { customAlphabet } from "nanoid";

const nanoid = customAlphabet("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz", 32);

export function generateApiKey(): { key: string; hash: string; prefix: string } {
  const key = `mtr_${nanoid()}`;
  const prefix = key.slice(0, 12);
  return { key, hash: key, prefix };
}

export function hashApiKey(key: string): string {
  const crypto = require("crypto");
  return crypto.createHash("sha256").update(key).digest("hex");
}
