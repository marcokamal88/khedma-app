import { Controller, Get, Post, Delete, Param, Body, UseGuards, Req } from '@nestjs/common';
import { AchievementsService } from './achievements.service';
import { JwtAuthGuard } from '../../core/auth/jwt-auth.guard';
import { CurrentTenant } from '../../core/tenant/tenant.decorator';
import { Request } from 'express';

@Controller('achievements')
@UseGuards(JwtAuthGuard)
export class AchievementsController {
  constructor(private achievementsService: AchievementsService) {}

  @Post()
  async create(@Body() dto: any, @CurrentTenant() churchId: string) {
    return this.achievementsService.create(churchId, dto);
  }

  @Get()
  async findAll(@CurrentTenant() churchId: string) {
    return this.achievementsService.findAll(churchId);
  }

  @Get('mine')
  async myAchievements(@CurrentTenant() churchId: string, @Req() req: Request) {
    const user = req.user as any;
    return this.achievementsService.getMemberAchievements(churchId, user.memberId);
  }

  @Post('check')
  async checkAchievements(@CurrentTenant() churchId: string, @Req() req: Request) {
    const user = req.user as any;
    return this.achievementsService.checkAndAward(churchId, user.memberId);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentTenant() churchId: string) {
    return this.achievementsService.remove(churchId, id);
  }
}
