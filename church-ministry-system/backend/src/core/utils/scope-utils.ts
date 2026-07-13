import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Class } from '../../modules/church/entities/class.entity';
import { StageGroup } from '../../modules/church/entities/stage-group.entity';
import { Service } from '../../modules/church/entities/service.entity';

export interface ScopeFilters {
  churchId: number;
  sectorId?: number;
  serviceId?: number;
  stageGroupId?: number;
  classId?: number;
}

@Injectable()
export class ScopeUtils {
  constructor(
    @InjectModel(Class) private classModel: typeof Class,
    @InjectModel(StageGroup) private stageGroupModel: typeof StageGroup,
    @InjectModel(Service) private serviceModel: typeof Service,
  ) {}

  async resolveScopeFilters(
    churchId: number,
    scope: { sectorId?: number; serviceId?: number; stageGroupId?: number; classId?: number },
  ): Promise<ScopeFilters> {
    const filters: ScopeFilters = { churchId };

    if (scope.classId) {
      filters.classId = scope.classId;
      const cls = await this.classModel.findByPk(scope.classId, {
        attributes: ['stageGroupId', 'serviceId'],
      });
      if (cls) {
        filters.stageGroupId = cls.stageGroupId || undefined;
        filters.serviceId = cls.serviceId;
        if (cls.stageGroupId) {
          const sg = await this.stageGroupModel.findByPk(cls.stageGroupId, {
            attributes: ['serviceId'],
          });
          if (sg) filters.serviceId = sg.serviceId;
        }
        if (filters.serviceId) {
          const svc = await this.serviceModel.findByPk(filters.serviceId, {
            attributes: ['sectorId'],
          });
          if (svc) filters.sectorId = svc.sectorId;
        }
      }
    } else if (scope.stageGroupId) {
      filters.stageGroupId = scope.stageGroupId;
      const sg = await this.stageGroupModel.findByPk(scope.stageGroupId, {
        attributes: ['serviceId'],
      });
      if (sg) {
        filters.serviceId = sg.serviceId;
        const svc = await this.serviceModel.findByPk(sg.serviceId, {
          attributes: ['sectorId'],
        });
        if (svc) filters.sectorId = svc.sectorId;
      }
    } else if (scope.serviceId) {
      filters.serviceId = scope.serviceId;
      const svc = await this.serviceModel.findByPk(scope.serviceId, {
        attributes: ['sectorId'],
      });
      if (svc) filters.sectorId = svc.sectorId;
    } else if (scope.sectorId) {
      filters.sectorId = scope.sectorId;
    }

    return filters;
  }
}
