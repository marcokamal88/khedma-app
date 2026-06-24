import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Task } from './entities/task.entity';
import { TaskAssignment } from './entities/task-assignment.entity';

@Injectable()
export class TasksService {
  constructor(
    @InjectModel(Task) private taskModel: typeof Task,
    @InjectModel(TaskAssignment) private assignmentModel: typeof TaskAssignment,
  ) {}

  async create(churchId: string, data: Partial<Task>, assignedBy: string) {
    return this.taskModel.create({
      ...data,
      churchId,
      assignedBy,
    } as any);
  }

  async findAll(
    churchId: string,
    filters: { serviceId?: string; classId?: string; taskType?: string },
  ) {
    const where: any = { churchId };
    if (filters.serviceId) where.serviceId = filters.serviceId;
    if (filters.classId) where.classId = filters.classId;
    if (filters.taskType) where.taskType = filters.taskType;

    return this.taskModel.findAll({
      where,
      include: [{ model: TaskAssignment }],
      order: [['createdAt', 'DESC']],
    });
  }

  async findOne(churchId: string, id: string) {
    const task = await this.taskModel.findOne({
      where: { id, churchId },
      include: [{ model: TaskAssignment }],
    });
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  async update(churchId: string, id: string, data: Partial<Task>) {
    const task = await this.findOne(churchId, id);
    await this.taskModel.update(data as any, { where: { id } });
    return this.findOne(churchId, id);
  }

  async remove(churchId: string, id: string) {
    const task = await this.findOne(churchId, id);
    await this.taskModel.destroy({ where: { id } });
    return { success: true };
  }

  async assignToMembers(churchId: string, taskId: string, memberIds: string[]) {
    const task = await this.findOne(churchId, taskId);
    const assignments = [];

    for (const memberId of memberIds) {
      const existing = await this.assignmentModel.findOne({
        where: { taskId, churchMemberId: memberId },
      });
      if (!existing) {
        const assignment = await this.assignmentModel.create({
          churchId,
          taskId,
          churchMemberId: memberId,
          status: 'pending',
        } as any);
        assignments.push(assignment);
      }
    }

    return assignments;
  }

  async getMyTasks(churchId: string, memberId: string) {
    return this.assignmentModel.findAll({
      where: { churchId, churchMemberId: memberId },
      include: [{ model: Task }],
      order: [['createdAt', 'DESC']],
    });
  }

  async completeTask(churchId: string, taskId: string, memberId: string) {
    const assignment = await this.assignmentModel.findOne({
      where: { churchId, taskId, churchMemberId: memberId },
    });
    if (!assignment) throw new NotFoundException('Assignment not found');

    await this.assignmentModel.update({
      status: 'completed',
      completedAt: new Date(),
    } as any, { where: { id: assignment.id } });

    return this.assignmentModel.findOne({ where: { id: assignment.id } });
  }

  async verifyTask(churchId: string, taskId: string, memberId: string, verifierId: string) {
    const assignment = await this.assignmentModel.findOne({
      where: { churchId, taskId, churchMemberId: memberId },
    });
    if (!assignment) throw new NotFoundException('Assignment not found');

    await this.assignmentModel.update({
      status: 'completed',
      verifiedBy: verifierId,
      completedAt: new Date(),
    } as any, { where: { id: assignment.id } });

    return this.assignmentModel.findOne({ where: { id: assignment.id } });
  }
}
