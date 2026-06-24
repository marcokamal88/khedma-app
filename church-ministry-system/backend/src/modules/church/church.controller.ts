import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ChurchService } from './church.service';
import { JwtAuthGuard } from '../../core/auth/jwt-auth.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import { CurrentTenant } from '../../core/tenant/tenant.decorator';

@Controller()
@UseGuards(JwtAuthGuard)
export class ChurchController {
  constructor(private churchService: ChurchService) {}

  @Get('sectors')
  async getSectors(@CurrentTenant() churchId: string) {
    return this.churchService.getSectors(churchId);
  }

  @Get('sectors/:id')
  async getSector(@Param('id') id: string, @CurrentTenant() churchId: string) {
    return this.churchService.getSector(churchId, id);
  }

  @Get('sectors/:id/services')
  async getSectorServices(@Param('id') sectorId: string, @CurrentTenant() churchId: string) {
    return this.churchService.getServices(churchId, sectorId);
  }

  @Get('services')
  async getServices(@CurrentTenant() churchId: string) {
    return this.churchService.getServices(churchId);
  }

  @Get('services/:id')
  async getService(@Param('id') id: string, @CurrentTenant() churchId: string) {
    return this.churchService.getService(churchId, id);
  }

  @Get('services/:id/stage-groups')
  async getStageGroups(@Param('id') serviceId: string, @CurrentTenant() churchId: string) {
    return this.churchService.getStageGroups(churchId, serviceId);
  }

  @Get('services/:id/classes')
  async getClasses(@Param('id') serviceId: string, @CurrentTenant() churchId: string) {
    return this.churchService.getClasses(churchId, serviceId);
  }

  @Roles('priest', 'sector_leader')
  @Post('sectors')
  async createSector(@Body() body: any, @CurrentTenant() churchId: string) {
    return this.churchService.createSector(churchId, body);
  }

  @Roles('priest', 'sector_leader')
  @Post('services')
  async createService(@Body() body: any, @CurrentTenant() churchId: string) {
    return this.churchService.createService(churchId, body);
  }

  @Roles('priest', 'sector_leader')
  @Post('stage-groups')
  async createStageGroup(@Body() body: any, @CurrentTenant() churchId: string) {
    return this.churchService.createStageGroup(churchId, body);
  }

  @Roles('priest', 'sector_leader')
  @Post('classes')
  async createClass(@Body() body: any, @CurrentTenant() churchId: string) {
    return this.churchService.createClass(churchId, body);
  }
}
