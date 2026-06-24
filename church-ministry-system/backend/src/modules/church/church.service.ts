import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sector } from './entities/sector.entity';
import { Service } from './entities/service.entity';
import { StageGroup } from './entities/stage-group.entity';
import { Class } from './entities/class.entity';

@Injectable()
export class ChurchService {
  constructor(
    @InjectModel(Sector) private sectorModel: typeof Sector,
    @InjectModel(Service) private serviceModel: typeof Service,
    @InjectModel(StageGroup) private stageGroupModel: typeof StageGroup,
    @InjectModel(Class) private classModel: typeof Class,
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

  async getStageGroups(churchId: string, serviceId: string) {
    return this.stageGroupModel.findAll({
      where: { churchId, serviceId, isActive: true },
      order: [['stageOrder', 'ASC']],
    });
  }

  async getClasses(churchId: string, serviceId: string) {
    return this.classModel.findAll({
      where: { churchId, serviceId, isActive: true },
    });
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
}
