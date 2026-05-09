import { Request, Response, NextFunction } from 'express';

const requests = new Map<string, { count: number; resetAt: number }>();

export const rateLimiter = (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minuto
  const maxRequests = 200;

  const record = requests.get(ip);

  if (!record || now > record.resetAt) {
    requests.set(ip, { count: 1, resetAt: now + windowMs });
    return next();
  }

  if (record.count >= maxRequests) {
    return res.status(429).json({ message: 'Muitas requisições. Tente novamente em breve.' });
  }

  record.count++;
  next();
};
