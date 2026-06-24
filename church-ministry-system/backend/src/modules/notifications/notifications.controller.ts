import { Controller, Get, Post, Delete, Patch, Param, Body, UseGuards, Req } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../../core/auth/jwt-auth.guard';
import { CurrentTenant } from '../../core/tenant/tenant.decorator';
import { Request } from 'express';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private notifService: NotificationsService) {}

  @Post('register-device')
  async registerDevice(
    @CurrentTenant() churchId: string,
    @Req() req: Request,
    @Body() body: { token: string; deviceType: string },
  ) {
    const user = req.user as any;
    return this.notifService.registerDevice(churchId, user.memberId, body.token, body.deviceType);
  }

  @Delete('unregister-device')
  async unregisterDevice(@Req() req: Request, @Body() body: { token: string }) {
    const user = req.user as any;
    return this.notifService.unregisterDevice(user.memberId, body.token);
  }

  @Get()
  async getNotifications(@CurrentTenant() churchId: string, @Req() req: Request) {
    const user = req.user as any;
    return this.notifService.getNotifications(churchId, user.memberId);
  }

  @Get('unread-count')
  async getUnreadCount(@CurrentTenant() churchId: string, @Req() req: Request) {
    const user = req.user as any;
    return this.notifService.getUnreadCount(churchId, user.memberId);
  }

  @Patch(':id/read')
  async markAsRead(@Param('id') id: string, @CurrentTenant() churchId: string, @Req() req: Request) {
    const user = req.user as any;
    return this.notifService.markAsRead(churchId, id, user.memberId);
  }

  @Patch('read-all')
  async markAllAsRead(@CurrentTenant() churchId: string, @Req() req: Request) {
    const user = req.user as any;
    return this.notifService.markAllAsRead(churchId, user.memberId);
  }
}
