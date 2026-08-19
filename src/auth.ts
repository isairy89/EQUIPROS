import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const DEV_FALLBACK_SECRET = 'equiproci-dev-secret-solo-para-desarrollo-local';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password.trim()).digest('hex');
}

function getJwtSecret(): string {
  return process.env.AUTH_JWT_SECRET || DEV_FALLBACK_SECRET;
}

// Check if credentials are configured in environment
export function authIsConfigured(): boolean {
  const username = process.env.AUTH_USERNAME;
  const hash = process.env.AUTH_PASSWORD_HASH;
  return Boolean(username && username.trim() !== '' && hash && hash.trim() !== '');
}

export function login(req: Request, res: Response): void {
  const { username, password } = req.body || {};

  if (!username || !password) {
    res.status(400).json({ error: 'Usuario y contraseña requeridos' });
    return;
  }

  let isMatch: boolean;
  if (authIsConfigured()) {
    const envUsername = process.env.AUTH_USERNAME as string;
    const envHash = (process.env.AUTH_PASSWORD_HASH as string).trim().toLowerCase();
    isMatch = username === envUsername && hashPassword(password) === envHash;
  } else {
    // Sin credenciales configuradas: acceso de desarrollo con admin/admin123.
    isMatch = username === 'admin' && password === 'admin123';
  }

  if (!isMatch) {
    res.status(401).json({ error: 'Credenciales inválidas' });
    return;
  }

  const token = jwt.sign({ sub: username, role: 'admin' }, getJwtSecret(), { expiresIn: '12h' });
  res.json({
    token,
    user: { username, role: 'admin', name: 'Administrador EQUIPROCI' },
  });
}

export function logout(req: Request, res: Response): void {
  // Los JWT son sin estado; el cliente descarta el token. Nada que invalidar en el servidor.
  res.json({ success: true, message: 'Sesión cerrada correctamente' });
}

// Verifica un token de sesión (usado tanto por el middleware Bearer como por SSE, que no puede enviar headers).
export function verifySessionToken(token: string | undefined | null): { sub: string; role: string } | null {
  if (!authIsConfigured()) {
    return { sub: 'admin', role: 'admin' };
  }
  if (!token) return null;
  try {
    return jwt.verify(token, getJwtSecret()) as { sub: string; role: string };
  } catch {
    return null;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!authIsConfigured()) {
    (req as any).session = { sub: 'admin', role: 'admin' };
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Autenticación requerida' });
    return;
  }

  const session = verifySessionToken(authHeader.substring(7));
  if (!session) {
    res.status(401).json({ error: 'Token de sesión expirado o no válido' });
    return;
  }
  (req as any).session = session;
  next();
}
