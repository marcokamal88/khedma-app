import { Controller, Get, Post, Delete, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { LessonLibraryService } from './lesson-library.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { JwtAuthGuard } from '../../core/auth/jwt-auth.guard';
import { CurrentTenant } from '../../core/tenant/tenant.decorator';
import { Request } from 'express';

@Controller('lesson-library')
@UseGuards(JwtAuthGuard)
export class LessonLibraryController {
  constructor(private lessonService: LessonLibraryService) {}

  @Post()
  async create(@Body() dto: CreateLessonDto, @CurrentTenant() churchId: string, @Req() req: Request) {
    const user = req.user as any;
    return this.lessonService.create(churchId, dto, user.sub);
  }

  @Get()
  async findAll(
    @CurrentTenant() churchId: string,
    @Query('serviceId') serviceId?: string,
    @Query('classId') classId?: string,
    @Query('stageGroupId') stageGroupId?: string,
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.lessonService.findAll(churchId, { serviceId, classId, stageGroupId, category, search, page, limit });
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentTenant() churchId: string) {
    return this.lessonService.findOne(churchId, id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentTenant() churchId: string) {
    return this.lessonService.remove(churchId, id);
  }
}
