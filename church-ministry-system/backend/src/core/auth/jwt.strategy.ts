import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

export interface ActiveContext {
  role: string;
  churchId: number;
  scope: {
    sectorId?: number;
    serviceId?: number;
    stageGroupId?: number;
    classId?: number;
  };
  displayLabel?: string;
}

export interface JwtPayload {
  sub: number;
  churchId: number;
  memberId: number;
  roles: string[];
  activeContext: ActiveContext;
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
    this.logger.log(`JWT strategy initialized`);
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    if (!payload.churchId || !payload.sub) {
      throw new UnauthorizedException('Invalid token payload');
    }
    return payload;
  }
}
