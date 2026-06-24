import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { FollowUpsService } from './follow-ups.service';
import { CreateFollowUpDto } from './dto/create-follow-up.dto';
import { AddActivityDto } from './dto/add-activity.dto';
import { JwtAuthGuard } from '../../core/auth/jwt-auth.guard';
import { CurrentTenant } from '../../core/tenant/tenant.decorator';
import { Request } from 'express';

@Controller('follow-ups')
@UseGuards(JwtAuthGuard)
export class FollowUpsController {
  constructor(private followUpsService: FollowUpsService) {}

  @Post()
  async create(@Body() dto: CreateFollowUpDto, @CurrentTenant() churchId: string, @Req() req: Request) {
    const user = req.user as any;
    return this.followUpsService.create(churchId, dto, user.sub);
  }

  @Get()
  async findAll(@CurrentTenant() churchId: string, @Query('servantId') servantId?: string) {
    return this.followUpsService.findAll(churchId, servantId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentTenant() churchId: string) {
    return this.followUpsService.findOne(churchId, id);
  }

  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body('status') status: string, @CurrentTenant() churchId: string) {
    return this.followUpsService.updateStatus(churchId, id, status);
  }

  @Post(':id/activities')
  async addActivity(
    @Param('id') id: string,
    @Body() dto: AddActivityDto,
    @CurrentTenant() churchId: string,
    @Req() req: Request,
  ) {
    const user = req.user as any;
    return this.followUpsService.addActivity(churchId, id, dto, user.sub);
  }

  @Get(':id/activities')
  async getActivities(@Param('id') id: string) {
    const activities = await this.followUpsService['logModel'].findAll({
      where: { followupFamilyId: id },
      order: [['createdAt', 'DESC']],
    });
    return activities;
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentTenant() churchId: string) {
    return this.followUpsService.remove(churchId, id);
  }
}
