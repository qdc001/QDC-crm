import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(err);

  if (err.isOperational) {
    return res.status(err.statusCode).json({ message: err.message });
  }

  if (err.code === 'P2002') {
    return res.status(409).json({ message: 'Registo duplicado' });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({ message: 'Registo não encontrado' });
  }

  return res.status(500).json({ message: 'Erro interno do servidor' });
};
