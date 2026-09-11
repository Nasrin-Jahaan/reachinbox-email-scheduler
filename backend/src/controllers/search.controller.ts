import { Response, NextFunction } from 'express';
import { ElasticsearchService } from '../services/elasticsearch.service';
import { AuthenticatedRequest } from '../types/index';

export class SearchController {
  static async searchEmails(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const q = (req.query.q as string) || '';
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      if (!q.trim()) {
        return res.json({
          data: [],
          pagination: { page, limit, total: 0, totalPages: 0 },
        });
      }

      const result = await ElasticsearchService.searchEmails(userId, q, page, limit);
      return res.json(result);
    } catch (err) {
      next(err);
    }
  }
}
