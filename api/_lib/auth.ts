import crypto from 'crypto';
import { prisma } from './prisma.js';

export const hashPassword = (password: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(salt + ":" + derivedKey.toString('hex'));
    });
  });
};

export const verifyPassword = (password: string, hash: string): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    const [salt, key] = hash.split(':');
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(key === derivedKey.toString('hex'));
    });
  });
};

export const getSession = async (token: string) => {
  const session = await prisma.session.findUnique({
    where: { sessionToken: token },
    include: { user: true }
  });

  if (!session) return null;
  if (session.expires < new Date()) {
    await prisma.session.delete({ where: { id: session.id } });
    return null;
  }
  
  // Format to match expected User type in frontend
  return {
    userId: session.user.id,
    email: session.user.email,
    name: session.user.name,
    avatar: session.user.image,
    createdAt: session.expires.getTime() // rough approximation or ignore
  };
};

export const createSession = async (user: any) => {
  const token = crypto.randomUUID();
  const expires = new Date();
  expires.setDate(expires.getDate() + 30); // 30 days

  await prisma.session.create({
    data: {
      sessionToken: token,
      userId: user.id,
      expires
    }
  });

  return token;
};
