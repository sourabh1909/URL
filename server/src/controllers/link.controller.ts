import { Request, Response, NextFunction } from 'express';
import { LinkService } from '../services/link.service';
import { AppError } from '../middleware/error';

export class LinkController {
  static async createLink(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { originalUrl, customAlias } = req.body;

      const link = await LinkService.createLink({
        userId,
        originalUrl,
        customAlias: customAlias || undefined,
      });

      res.status(201).json({ link });
    } catch (error) {
      next(error);
    }
  }

  static async listLinks(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { search, page, limit, sortBy, sortOrder } = req.query as any;

      const result = await LinkService.listUserLinks({
        userId,
        search,
        page: Number(page) || 1,
        limit: Number(limit) || 10,
        sortBy: sortBy || 'createdAt',
        sortOrder: sortOrder || 'desc',
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getLink(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const link = await LinkService.getLinkById(userId, id);
      res.json({ link });
    } catch (error) {
      next(error);
    }
  }

  static async updateLink(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const { originalUrl, isActive } = req.body;

      if (originalUrl === undefined && isActive === undefined) {
        throw new AppError('At least one field (originalUrl or isActive) is required to update', 400, 'BAD_REQUEST');
      }

      const updated = await LinkService.updateLink({
        userId,
        linkId: id,
        originalUrl,
        isActive,
      });

      res.json({ link: updated });
    } catch (error) {
      next(error);
    }
  }

  static async deleteLink(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      await LinkService.deleteLink(userId, id);
      res.json({ success: true, message: 'Link deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async checkAlias(req: Request, res: Response, next: NextFunction) {
    try {
      const { alias } = req.params;
      const isTaken = await LinkService.isAliasTaken(alias);
      res.json({
        alias,
        isAvailable: !isTaken,
      });
    } catch (error) {
      next(error);
    }
  }
}
