import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { FamilyService } from './family.service';
import { JwtAuthGuard } from '../../core/auth/jwt-auth.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import { CurrentTenant } from '../../core/tenant/tenant.decorator';
import { Request } from 'express';

@Controller()
@UseGuards(JwtAuthGuard)
export class FamilyController {
  constructor(private familyService: FamilyService) {}

  @Get('families/my')
  async getMyFamily(@CurrentTenant() churchId: string, @Req() req: Request) {
    const user = req.user as any;
    return this.familyService.getMyFamily(churchId, user.memberId);
  }

  @Roles('priest')
  @Post('families')
  async createFamily(@Body('name') name: string, @CurrentTenant() churchId: string) {
    return this.familyService.createFamily(churchId, name);
  }

  @Post('families/:id/members')
  async addMember(
    @Param('id') id: string, @Body() body: { churchMemberId: string; relation: string },
    @CurrentTenant() churchId: string,
  ) {
    return this.familyService.addMember(churchId, id, body);
  }

  @Get('families/:id/members')
  async getMembers(@Param('id') id: string, @CurrentTenant() churchId: string) {
    return this.familyService.getFamilyMembers(churchId, id);
  }

  @Get('my-children')
  async getChildren(@CurrentTenant() churchId: string, @Req() req: Request) {
    const user = req.user as any;
    return this.familyService.getChildren(churchId, user.memberId);
  }
}
