import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { TaioService } from './taio.service';
import { JwtAuthGuard } from '../../core/auth/jwt-auth.guard';
import { CurrentTenant } from '../../core/tenant/tenant.decorator';
import { Request } from 'express';

@Controller()
@UseGuards(JwtAuthGuard)
export class TaioController {
  constructor(private taioService: TaioService) {}

  @Get('taio/balance')
  async getMyBalance(@CurrentTenant() churchId: string, @Query('serviceYearId') serviceYearId: string, @Req() req: Request) {
    const user = req.user as any;
    return this.taioService.getBalance(churchId, user.memberId, serviceYearId);
  }

  @Get('taio/balance/:memberId')
  async getMemberBalance(@Param('memberId') memberId: string, @CurrentTenant() churchId: string, @Query('serviceYearId') serviceYearId: string) {
    return this.taioService.getBalance(churchId, memberId, serviceYearId);
  }

  @Get('taio/transactions')
  async getMyTransactions(@CurrentTenant() churchId: string, @Query('serviceYearId') serviceYearId: string, @Req() req: Request) {
    const user = req.user as any;
    return this.taioService.getTransactions(churchId, user.memberId, serviceYearId);
  }

  @Post('taio/award')
  async awardPoints(@Body() body: any, @CurrentTenant() churchId: string, @Req() req: Request) {
    const user = req.user as any;
    return this.taioService.awardPoints(churchId, body, user.memberId);
  }

  @Get('taio/leaderboard')
  async leaderboard(@Query('serviceId') serviceId: string, @Query('serviceYearId') serviceYearId: string, @CurrentTenant() churchId: string) {
    return this.taioService.getLeaderboard(churchId, serviceId, serviceYearId);
  }

  @Get('store/items')
  async storeItems(@CurrentTenant() churchId: string) {
    return this.taioService.getStoreItems(churchId);
  }

  @Post('store/redeem')
  async redeem(@Body() body: any, @CurrentTenant() churchId: string, @Req() req: Request) {
    const user = req.user as any;
    return this.taioService.redeemItem(churchId, body, user.memberId);
  }

  @Get('store/redemptions')
  async myRedemptions(@CurrentTenant() churchId: string, @Req() req: Request) {
    const user = req.user as any;
    return this.taioService.getMyRedemptions(churchId, user.memberId);
  }

  @Patch('store/redemptions/:id/fulfill')
  async fulfill(@Param('id') id: string, @CurrentTenant() churchId: string) {
    return this.taioService.fulfillRedemption(churchId, id);
  }
}
