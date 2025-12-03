import jwt from 'jsonwebtoken';

const JWT_SECRET: string = process.env.JWT_SECRET || 'your_default_secret_key_change_in_production';
const JWT_EXPIRE: string = process.env.JWT_EXPIRE || '7d';

export const generateToken = (id: string, email: string): string => {
  return jwt.sign(
    { id, email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRE } as any
  );
};

export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};
