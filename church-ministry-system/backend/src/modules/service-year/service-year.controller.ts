import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ServiceYearService } from './service-year.service';
import { JwtAuthGuard } from '../../core/auth/jwt-auth.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import { CurrentTenant } from '../../core/tenant/tenant.decorator';

@Controller('service-years')
@UseGuards(JwtAuthGuard)
export class ServiceYearController {
  constructor(private service: ServiceYearService) {}

  @Get()
  async findAll(@CurrentTenant() churchId: string) {
    return this.service.findAll(churchId);
  }

  @Get('current')
  async getCurrent(@CurrentTenant() churchId: string) {
    return this.service.getCurrent(churchId);
  }

  @Roles('priest')
  @Post()
  async create(@Body() body: any, @CurrentTenant() churchId: string) {
    return this.service.create(churchId, body);
  }

  @Roles('priest')
  @Post(':id/promote')
  async promote(@Param('id') id: string, @CurrentTenant() churchId: string) {
    return this.service.promote(churchId, id);
  }
}
