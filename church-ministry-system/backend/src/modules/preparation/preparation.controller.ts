import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Req,
} from '@nestjs/common';
import { PreparationService } from './preparation.service';
import { JwtAuthGuard } from '../../core/auth/jwt-auth.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import { CurrentTenant } from '../../core/tenant/tenant.decorator';
import { Request } from 'express';

@Controller('preparations')
@UseGuards(JwtAuthGuard)
export class PreparationController {
  constructor(private prepService: PreparationService) {}

  @Roles('servant', 'class_leader', 'sector_leader', 'priest')
  @Post()
  async create(@Body() body: any, @CurrentTenant() churchId: number, @Req() req: Request) {
    const user = req.user as any;
    return this.prepService.create(churchId, body, user.memberId);
  }

  @Roles('servant', 'class_leader', 'sector_leader', 'priest')
  @Get()
  async findAll(@Query() filters: any, @CurrentTenant() churchId: number) {
    if (filters.servantId) filters.servantId = +filters.servantId;
    if (filters.serviceId) filters.serviceId = +filters.serviceId;
    return this.prepService.findAll(churchId, filters);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentTenant() churchId: number) {
    return this.prepService.findOne(churchId, +id);
  }

  @Roles('servant', 'class_leader', 'sector_leader', 'priest')
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() body: any,
    @CurrentTenant() churchId: number,
    @Req() req: Request,
  ) {
    const user = req.user as any;
    return this.prepService.update(churchId, +id, body, user.memberId);
  }

  @Roles('servant', 'class_leader', 'sector_leader', 'priest')
  @Post(':id/submit')
  async submit(@Param('id') id: string, @CurrentTenant() churchId: number, @Req() req: Request) {
    const user = req.user as any;
    return this.prepService.submit(churchId, +id, user.memberId);
  }

  @Roles('service_leader', 'assistant_service_leader', 'sector_leader', 'priest')
  @Patch(':id/review')
  async review(
    @Param('id') id: string,
    @Body() body: { status: string; reviewNotes?: string },
    @CurrentTenant() churchId: number,
    @Req() req: Request,
  ) {
    const user = req.user as any;
    return this.prepService.review(churchId, +id, user.memberId, body);
  }

  @Roles('servant', 'class_leader', 'sector_leader', 'priest')
  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentTenant() churchId: number) {
    return this.prepService.remove(churchId, +id);
  }
}
