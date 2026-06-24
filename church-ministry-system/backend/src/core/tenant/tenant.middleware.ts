import { Injectable, NestMiddleware, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    const raw = req.headers['x-church-id'] as string;

    if (!raw) {
      throw new UnauthorizedException('X-Church-ID header is required');
    }

    const churchId = parseInt(raw, 10);
    if (isNaN(churchId)) {
      throw new BadRequestException(`Invalid X-Church-ID: must be an integer, got "${raw}"`);
    }

    (req as any).churchId = churchId;
    next();
  }
}
