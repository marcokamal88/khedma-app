import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { ServiceYear } from './entities/service-year.entity';
import { Enrollment } from '../users/entities/enrollment.entity';
import { ServantAssignment } from '../users/entities/servant-assignment.entity';
import { StageGroup } from '../church/entities/stage-group.entity';

@Injectable()
export class ServiceYearService {
  constructor(
    @InjectModel(ServiceYear) private serviceYearModel: typeof ServiceYear,
    @InjectModel(Enrollment) private enrollmentModel: typeof Enrollment,
    @InjectModel(ServantAssignment) private assignmentModel: typeof ServantAssignment,
    @InjectModel(StageGroup) private stageGroupModel: typeof StageGroup,
    private sequelize: Sequelize,
  ) {}

  async findAll(churchId: string) {
    return this.serviceYearModel.findAll({
      where: { churchId },
      order: [['startDate', 'DESC']],
    });
  }

  async getCurrent(churchId: string) {
    const year = await this.serviceYearModel.findOne({
      where: { churchId, isCurrent: true },
    });
    if (!year) throw new NotFoundException('No current service year');
    return year;
  }

  async create(churchId: string, data: Partial<ServiceYear>) {
    const existing = await this.serviceYearModel.findOne({
      where: { churchId, isCurrent: true },
    });

    const transaction = await this.sequelize.transaction();
    try {
      if (existing) {
        await this.serviceYearModel.update(
          { isCurrent: false },
          { where: { id: existing.id }, transaction },
        );
      }

      const year = await this.serviceYearModel.create(
        { ...data, churchId, isCurrent: true } as any,
        { transaction },
      );

      await transaction.commit();
      return year;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async promote(churchId: string, yearId: string) {
    const year = await this.serviceYearModel.findOne({
      where: { id: yearId, churchId },
    });
    if (!year) throw new NotFoundException('Service year not found');

    const oldYear = await this.serviceYearModel.findOne({
      where: { churchId, isCurrent: true },
    });
    if (!oldYear) throw new BadRequestException('No current year to promote from');

    const transaction = await this.sequelize.transaction();
    try {
      const enrollments = await this.enrollmentModel.findAll({
        where: { churchId, serviceYearId: oldYear.id, isActive: true },
        transaction,
      });

      for (const enrollment of enrollments) {
        let nextStageGroupId = enrollment.stageGroupId;

        if (enrollment.stageGroupId) {
          const currentStage = await this.stageGroupModel.findOne({
            where: { id: enrollment.stageGroupId },
            transaction,
          });

          if (currentStage) {
            const nextStage = await this.stageGroupModel.findOne({
              where: {
                churchId,
                serviceId: enrollment.serviceId,
                stageOrder: currentStage.stageOrder + 1,
                isActive: true,
              },
              transaction,
            });

            if (nextStage) {
              nextStageGroupId = nextStage.id;
            }
          }
        }

        const existing = await this.enrollmentModel.findOne({
          where: {
            churchId,
            serviceYearId: yearId,
            churchMemberId: enrollment.churchMemberId,
            serviceId: enrollment.serviceId,
          },
          transaction,
        });

        if (!existing) {
          await this.enrollmentModel.create(
            {
              churchId,
              serviceYearId: yearId,
              churchMemberId: enrollment.churchMemberId,
              serviceId: enrollment.serviceId,
              classId: enrollment.classId,
              stageGroupId: nextStageGroupId,
              isActive: true,
            } as any,
            { transaction },
          );
        }
      }

      const assignments = await this.assignmentModel.findAll({
        where: { churchId, serviceYearId: oldYear.id, isActive: true },
        transaction,
      });

      for (const assignment of assignments) {
        const existing = await this.assignmentModel.findOne({
          where: {
            churchId,
            serviceYearId: yearId,
            churchMemberId: assignment.churchMemberId,
            serviceId: assignment.serviceId,
          },
          transaction,
        });

        if (!existing) {
          await this.assignmentModel.create(
            {
              churchId,
              serviceYearId: yearId,
              churchMemberId: assignment.churchMemberId,
              serviceId: assignment.serviceId,
              classId: assignment.classId,
              isActive: true,
            } as any,
            { transaction },
          );
        }
      }

      await this.serviceYearModel.update(
        { isCurrent: false },
        { where: { id: oldYear.id }, transaction },
      );

      await this.serviceYearModel.update(
        { isCurrent: true },
        { where: { id: yearId }, transaction },
      );

      await transaction.commit();
      return { success: true, promotedEnrollments: enrollments.length, promotedAssignments: assignments.length };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
