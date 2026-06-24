import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Req,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { JwtAuthGuard } from '../../core/auth/jwt-auth.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import { CurrentTenant } from '../../core/tenant/tenant.decorator';
import { Request } from 'express';

@Controller('events')
@UseGuards(JwtAuthGuard)
export class EventsController {
  constructor(private eventsService: EventsService) {}

  @Get()
  async findAll(@Query('eventType') eventType: string, @CurrentTenant() churchId: string) {
    return this.eventsService.findAll(churchId, eventType);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentTenant() churchId: string) {
    return this.eventsService.findOne(churchId, id);
  }

  @Roles('sector_leader', 'priest')
  @Post()
  async create(@Body() body: any, @CurrentTenant() churchId: string, @Req() req: Request) {
    const user = req.user as any;
    return this.eventsService.create(churchId, body, user.memberId);
  }

  @Post(':id/register')
  async register(@Param('id') id: string, @CurrentTenant() churchId: string, @Req() req: Request) {
    const user = req.user as any;
    return this.eventsService.register(churchId, id, user.memberId);
  }

  @Delete(':id/register')
  async cancelRegistration(
    @Param('id') id: string, @CurrentTenant() churchId: string, @Req() req: Request,
  ) {
    const user = req.user as any;
    return this.eventsService.cancelRegistration(churchId, id, user.memberId);
  }

  @Roles('sector_leader', 'priest')
  @Get(':id/registrations')
  async getRegistrations(@Param('id') id: string, @CurrentTenant() churchId: string) {
    return this.eventsService.getRegistrations(churchId, id);
  }

  @Roles('servant', 'sector_leader', 'priest')
  @Post(':id/registrations/:registrationId/payments')
  async addPayment(
    @Param('registrationId') registrationId: string,
    @Body() body: any, @CurrentTenant() churchId: string, @Req() req: Request,
  ) {
    const user = req.user as any;
    return this.eventsService.addPayment(churchId, registrationId, body, user.memberId);
  }

  @Roles('sector_leader', 'priest')
  @Get(':id/payments/summary')
  async getPaymentSummary(@Param('id') id: string, @CurrentTenant() churchId: string) {
    return this.eventsService.getPaymentSummary(churchId, id);
  }
}
