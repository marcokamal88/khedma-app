import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Req, UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';
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

  @Roles('service_leader', 'assistant_service_leader', 'servant', 'class_leader', 'sector_leader', 'priest')
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

  @Roles('servant', 'class_leader', 'sector_leader', 'priest', 'service_leader', 'assistant_service_leader')
  @Post(':id/files')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: (req: any, file: any, cb: any) => {
        const id = req.params?.id || 'unknown';
        const dir = join(process.cwd(), 'uploads', 'preparations', String(id));
        if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
        cb(null, dir);
      },
      filename: (req: any, file: any, cb: any) => {
        const ext = extname(file.originalname) || '';
        cb(null, `${uuidv4()}${ext}`);
      },
    }),
    limits: { fileSize: 15 * 1024 * 1024 },
    fileFilter: (req: any, file: any, cb: any) => {
      const allowed = ['image/jpeg','image/png','image/jpg','image/webp','application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation','text/plain'];
      if (file.mimetype.startsWith('image/') || allowed.includes(file.mimetype)) cb(null, true);
      else cb(null, true);
    },
  }))
  async uploadFile(@Param('id') id: string, @UploadedFile() file: Express.Multer.File, @CurrentTenant() churchId: number, @Req() req: Request) {
    if (!file) throw new (await import('@nestjs/common')).BadRequestException('No file uploaded');
    const mime = file.mimetype || '';
    let fileType: string = 'other';
    if (mime.startsWith('image/')) fileType = 'image';
    else if (mime === 'application/pdf') fileType = 'document';
    else if (mime.includes('presentation')) fileType = 'presentation';
    else if (mime.includes('msword') || mime.includes('word')) fileType = 'document';
    const fileUrl = `/uploads/preparations/${id}/${file.filename}`;
    const user = (req as any).user;
    return this.prepService.addFile(churchId, +id, { fileName: file.originalname, fileUrl, fileType, fileSizeBytes: file.size } as any, user?.memberId);
  }

  @Get(':id/files')
  async getFiles(@Param('id') id: string, @CurrentTenant() churchId: number) {
    const prep = await this.prepService.findOne(churchId, +id);
    return (prep as any).files || [];
  }

  @Get(':id/comments')
  async getComments(@Param('id') id: string, @CurrentTenant() churchId: number) {
    return this.prepService.getComments(churchId, +id);
  }

  @Post(':id/comments')
  async addComment(
    @Param('id') id: string,
    @Body() body: { body: string },
    @CurrentTenant() churchId: number,
    @Req() req: Request,
  ) {
    const user = req.user as any;
    return this.prepService.addComment(churchId, +id, user.memberId, body.body);
  }
}
