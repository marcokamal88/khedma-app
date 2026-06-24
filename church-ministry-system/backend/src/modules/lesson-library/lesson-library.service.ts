import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Lesson } from './entities/lesson.entity';
import { CreateLessonDto } from './dto/create-lesson.dto';

@Injectable()
export class LessonLibraryService {
  private readonly logger = new Logger(LessonLibraryService.name);

  constructor(
    @InjectModel(Lesson) private lessonModel: typeof Lesson,
  ) {}

  async create(churchId: string, dto: CreateLessonDto, userId: string) {
    return this.lessonModel.create({ ...dto, churchId, createdBy: userId } as any);
  }

  async findAll(churchId: string, query: {
    serviceId?: string;
    classId?: string;
    stageGroupId?: string;
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const where: any = { churchId };
    if (query.serviceId) where.serviceId = query.serviceId;
    if (query.classId) where.classId = query.classId;
    if (query.stageGroupId) where.stageGroupId = query.stageGroupId;
    if (query.category) where.category = query.category;
    if (query.search) {
      where.title = { [Op.like]: `%${query.search}%` };
    }

    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    const { rows, count } = await this.lessonModel.findAndCountAll({
      where,
      include: [
        { association: 'service', attributes: ['id', 'name'] },
        { association: 'class', attributes: ['id', 'name'] },
        { association: 'stageGroup', attributes: ['id', 'name'] },
        { association: 'serviceYear', attributes: ['id', 'label'] },
      ],
      order: [['createdAt', 'DESC']],
      offset,
      limit,
    });

    return { lessons: rows, total: count, page, totalPages: Math.ceil(count / limit) };
  }

  async findOne(churchId: string, id: string) {
    return this.lessonModel.findOne({
      where: { id, churchId },
      include: [
        { association: 'service' },
        { association: 'class' },
        { association: 'stageGroup' },
        { association: 'serviceYear' },
      ],
    });
  }

  async remove(churchId: string, id: string) {
    await this.lessonModel.destroy({ where: { id, churchId } });
    return { success: true };
  }
}
