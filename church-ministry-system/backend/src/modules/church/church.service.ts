import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Sector } from './entities/sector.entity';
import { Service } from './entities/service.entity';
import { StageGroup } from './entities/stage-group.entity';
import { Class } from './entities/class.entity';
import { Enrollment } from '../users/entities/enrollment.entity';
import { User } from '../users/entities/user.entity';
import { ChurchMember } from '../users/entities/church-member.entity';

@Injectable()
export class ChurchService {
  constructor(
    @InjectModel(Sector) private sectorModel: typeof Sector,
    @InjectModel(Service) private serviceModel: typeof Service,
    @InjectModel(StageGroup) private stageGroupModel: typeof StageGroup,
    @InjectModel(Class) private classModel: typeof Class,
    @InjectModel(Enrollment) private enrollmentModel: typeof Enrollment,
  ) {}

  async getSectors(churchId: string) {
    return this.sectorModel.findAll({ where: { churchId, isActive: true } });
  }

  async getSector(churchId: string, id: string) {
    const sector = await this.sectorModel.findOne({ where: { id, churchId } });
    if (!sector) throw new NotFoundException('Sector not found');
    return sector;
  }

  async getServices(churchId: string, sectorId?: string) {
    const where: any = { churchId, isActive: true };
    if (sectorId) where.sectorId = sectorId;
    return this.serviceModel.findAll({ where });
  }

  async getService(churchId: string, id: string) {
    const service = await this.serviceModel.findOne({
      where: { id, churchId },
      include: [StageGroup, Class],
    });
    if (!service) throw new NotFoundException('Service not found');
    return service;
  }

  async getServiceStructure(churchId: string, id: string) {
    const service = await this.serviceModel.findOne({
      where: { id, churchId },
      include: [
        {
          model: StageGroup,
          where: { isActive: true },
          required: false,
          order: [['stageOrder', 'ASC']],
          include: [
            {
              model: Class,
              where: { isActive: true },
              required: false,
            },
          ],
        },
      ],
    });
    if (!service) throw new NotFoundException('Service not found');
    return service;
  }

  async getStageGroups(churchId: string, serviceId: string) {
    return this.stageGroupModel.findAll({
      where: { churchId, serviceId, isActive: true },
      order: [['stageOrder', 'ASC']],
    });
  }

  async getStageGroupClasses(churchId: string, stageGroupId: string) {
    return this.classModel.findAll({
      where: { churchId, stageGroupId, isActive: true },
    });
  }

  async getClasses(churchId: string, serviceId: string) {
    return this.classModel.findAll({
      where: { churchId, serviceId, isActive: true },
    });
  }

  async getClassStudents(churchId: string, classId: string) {
    const enrollments = await this.enrollmentModel.findAll({
      where: { churchId, classId, isActive: true },
      order: [['id', 'DESC']],
      include: [
        {
          model: ChurchMember,
          required: true,
          include: [{ model: User, attributes: ['id', 'fullName', 'email', 'phone', 'avatarUrl'] }],
        },
      ],
    });
    return enrollments.map((e) => ({
      enrollmentId: e.id,
      id: e.churchMemberId,
      userId: (e as any).churchMember?.userId,
      fullName: (e as any).churchMember?.user?.fullName,
      email: (e as any).churchMember?.user?.email,
      phone: (e as any).churchMember?.user?.phone,
      avatarUrl: (e as any).churchMember?.user?.avatarUrl,
    }));
  }

  async createSector(churchId: string, data: Partial<Sector>) {
    return this.sectorModel.create({ ...data, churchId } as any);
  }

  async createService(churchId: string, data: Partial<Service>) {
    return this.serviceModel.create({ ...data, churchId } as any);
  }

  async createStageGroup(churchId: string, data: Partial<StageGroup>) {
    return this.stageGroupModel.create({ ...data, churchId } as any);
  }

  async createClass(churchId: string, data: Partial<Class>) {
    return this.classModel.create({ ...data, churchId } as any);
  }

  async enrollMember(churchId: string, data: { churchMemberId: string; serviceId: string; classId: string; serviceYearId: string; stageGroupId?: string }) {
    const [enrollment] = await this.enrollmentModel.upsert({
      churchId,
      churchMemberId: data.churchMemberId,
      serviceId: data.serviceId,
      classId: data.classId,
      serviceYearId: data.serviceYearId,
      stageGroupId: data.stageGroupId || null,
      isActive: true,
    } as any);
    return enrollment;
  }
}
