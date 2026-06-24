import { Controller, Post, Get, Body, UseGuards, Req, Logger } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { SwitchContextDto } from './dto/switch-context.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Public } from '../../shared/decorators/public.decorator';
import { CurrentTenant } from '../tenant/tenant.decorator';
import { Request } from 'express';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private authService: AuthService) {}

  @Public()
  @Post('login')
  async login(@Body() dto: LoginDto, @CurrentTenant() churchId: number) {
    this.logger.log(`➡️  LOGIN attempt | identifier: ${dto.email || dto.phone} | churchId: ${churchId}`);
    try {
      const result = await this.authService.login(dto, churchId);
      this.logger.log(`✅ LOGIN success | userId: ${result.user.id} | roles: ${result.roles}`);
      return result;
    } catch (err) {
      this.logger.warn(`❌ LOGIN failed | error: ${err.message}`);
      throw err;
    }
  }

  @Public()
  @Post('signup')
  async signup(@Body() dto: SignupDto, @CurrentTenant() churchId: number) {
    return this.authService.signup(dto, churchId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('contexts')
  async getContexts(@Req() req: Request, @CurrentTenant() churchId: number) {
    const user = req.user as any;
    return this.authService.getContexts(user.sub, churchId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('switch-context')
  async switchContext(
    @Req() req: Request,
    @CurrentTenant() churchId: number,
    @Body() dto: SwitchContextDto,
  ) {
    const user = req.user as any;
    return this.authService.switchContext(user.sub, churchId, user.memberId, dto);
  }
}
