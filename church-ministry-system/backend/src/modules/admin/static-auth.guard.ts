import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StaticAuthGuard implements CanActivate {
  private readonly logger = new Logger(StaticAuthGuard.name);

  constructor(private config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader) {
      throw new UnauthorizedException('Authorization header is required');
    }

    const expectedUsername = this.config.get<string>('ADMIN_USERNAME') || 'admin';
    const expectedPassword = this.config.get<string>('ADMIN_PASSWORD') || 'admin123';

    // Support Basic Auth: base64(username:password)
    let credentials: string;
    try {
      const base64Credentials = authHeader.split(' ')[1] || authHeader;
      credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    } catch {
      throw new UnauthorizedException('Invalid authorization header format');
    }

    const [username, password] = credentials.split(':');

    if (username !== expectedUsername || password !== expectedPassword) {
      this.logger.warn(`Failed admin login attempt for username: ${username}`);
      throw new UnauthorizedException('Invalid admin credentials');
    }

    return true;
  }
}
