import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

export function validateBody(schema: AnyZodObject) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: error.errors[0]?.message || 'Invalid input data',
            details: error.errors.map((e) => ({
              field: e.path.join('.'),
              message: e.message,
            })),
          },
        });
      }
      next(error);
    }
  };
}

export function validateQuery(schema: AnyZodObject) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = await schema.parseAsync(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: error.errors[0]?.message || 'Invalid query parameters',
            details: error.errors.map((e) => ({
              field: e.path.join('.'),
              message: e.message,
            })),
          },
        });
      }
      next(error);
    }
  };
}

export function validateParams(schema: AnyZodObject) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.params = await schema.parseAsync(req.params);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: error.errors[0]?.message || 'Invalid route parameters',
            details: error.errors.map((e) => ({
              field: e.path.join('.'),
              message: e.message,
            })),
          },
        });
      }
      next(error);
    }
  };
}
