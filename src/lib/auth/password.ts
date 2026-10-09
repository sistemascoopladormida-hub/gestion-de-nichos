import bcrypt from "bcryptjs";

const ROUNDS = 12;

export async function hashPassword(plain: string): Promise<Buffer> {
  const hash = await bcrypt.hash(plain, ROUNDS);
  return Buffer.from(hash, "utf8");
}

export async function verifyPassword(
  plain: string,
  hash: Buffer | null,
): Promise<boolean> {
  if (!hash || hash.length === 0) return false;
  const hashStr = hash.toString("utf8");
  return bcrypt.compare(plain, hashStr);
}
