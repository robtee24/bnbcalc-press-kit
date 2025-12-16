import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

const ADMIN_PASSWORD = 'BNBCalc123$';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export function verifyPassword(password: string): boolean {
  return password === ADMIN_PASSWORD;
}

export function generateToken(): string {
  return jwt.sign({ admin: true }, JWT_SECRET, { expiresIn: '24h' });
}

export function verifyToken(token: string): boolean {
  try {
    jwt.verify(token, JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}

export function getAuthToken(request: NextRequest): string | null {
  return request.cookies.get('admin_token')?.value || null;
}

