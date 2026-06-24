import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

export interface JwtPayload {
  sub: number;
  churchId: number;
  memberId: number;
  roles: string[];
  activeContext: {
    role: string;
    serviceId?: number;
    classId?: number;
  };
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('jwt.secret'),
    });
    this.logger.log(`🔑 JWT strategy initialized | secret length: ${(config.get<string>('jwt.secret') || '').length}`);
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    this.logger.log(`🛡️  JWT validate | sub: ${payload.sub} | churchId: ${payload.churchId} | role: ${payload.activeContext?.role}`);
    if (!payload.churchId || !payload.sub) {
      this.logger.warn(`❌ JWT validate FAILED: missing churchId or sub`);
      throw new UnauthorizedException('Invalid token payload');
    }
    this.logger.log(`✅ JWT validate OK | memberId: ${payload.memberId}`);
    return payload;
  }
}
