import { hash, verify } from '@node-rs/argon2';

// argon2id (por defecto en @node-rs/argon2): resistente a GPU/ASIC.
export const hashPassword = (plain: string): Promise<string> => hash(plain);

export const verifyPassword = (hashed: string, plain: string): Promise<boolean> =>
  verify(hashed, plain).catch(() => false);
