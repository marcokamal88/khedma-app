import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Event } from './entities/event.entity';
import { EventRegistration } from './entities/event-registration.entity';
import { PaymentInstallment } from './entities/payment-installment.entity';
import { Sequelize } from 'sequelize-typescript';

@Injectable()
export class EventsService {
  constructor(
    @InjectModel(Event) private eventModel: typeof Event,
    @InjectModel(EventRegistration) private regModel: typeof EventRegistration,
    @InjectModel(PaymentInstallment) private paymentModel: typeof PaymentInstallment,
    private sequelize: Sequelize,
  ) {}

  async create(churchId: string, data: Partial<Event>, createdBy: string) {
    return this.eventModel.create({ ...data, churchId, createdBy } as any);
  }

  async findAll(churchId: string, eventType?: string) {
    const where: any = { churchId, isActive: true };
    if (eventType) where.eventType = eventType;
    return this.eventModel.findAll({
      where,
      order: [['startDate', 'DESC']],
    });
  }

  async findOne(churchId: string, id: string) {
    const event = await this.eventModel.findOne({
      where: { id, churchId },
      include: [{ model: EventRegistration }],
    });
    if (!event) throw new NotFoundException('Event not found');
    return event;
  }

  async register(churchId: string, eventId: string, memberId: string) {
    const event = await this.eventModel.findOne({ where: { id: eventId, churchId } });
    if (!event) throw new NotFoundException('Event not found');

    if (event.registrationDeadline && new Date(event.registrationDeadline) < new Date()) {
      throw new BadRequestException('Registration deadline has passed');
    }

    const existing = await this.regModel.findOne({
      where: { eventId, churchMemberId: memberId },
    });
    if (existing) throw new BadRequestException('Already registered');

    return this.regModel.create({
      churchId,
      eventId,
      churchMemberId: memberId,
      totalAmount: event.registrationFee,
      paidAmount: 0,
      status: 'registered',
    } as any);
  }

  async cancelRegistration(churchId: string, eventId: string, memberId: string) {
    const reg = await this.regModel.findOne({
      where: { eventId, churchMemberId: memberId, churchId },
    });
    if (!reg) throw new NotFoundException('Registration not found');

    await this.regModel.update({ status: 'cancelled' } as any, { where: { id: reg.id } });
    return { success: true };
  }

  async getRegistrations(churchId: string, eventId: string) {
    const event = await this.eventModel.findOne({ where: { id: eventId, churchId } });
    if (!event) throw new NotFoundException('Event not found');

    return this.regModel.findAll({
      where: { eventId, churchId },
      include: [{ model: PaymentInstallment }],
    });
  }

  async addPayment(churchId: string, registrationId: string, data: {
    amount: number;
    dueDate: string;
    paymentMethod?: string;
    paidAt?: string;
  }, recordedBy: string) {
    const reg = await this.regModel.findOne({
      where: { id: registrationId, churchId },
    });
    if (!reg) throw new NotFoundException('Registration not found');

    const transaction = await this.sequelize.transaction();
    try {
      const installment = await this.paymentModel.create({
        churchId,
        eventRegistrationId: registrationId,
        amount: data.amount,
        dueDate: data.dueDate,
        paymentMethod: data.paymentMethod,
        paidAt: data.paidAt ? new Date(data.paidAt) : null,
        recordedBy,
      } as any, { transaction });

      const newPaidAmount = parseFloat(reg.paidAmount.toString()) + data.amount;
      await this.regModel.update(
        { paidAmount: newPaidAmount },
        { where: { id: registrationId }, transaction },
      );

      await transaction.commit();
      return installment;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async getPaymentSummary(churchId: string, eventId: string) {
    const event = await this.eventModel.findOne({ where: { id: eventId, churchId } });
    if (!event) throw new NotFoundException('Event not found');

    const registrations = await this.regModel.findAll({
      where: { eventId, churchId },
    });

    const totalCollected = registrations.reduce(
      (sum, r) => sum + parseFloat(r.paidAmount.toString()), 0,
    );
    const totalExpected = registrations.reduce(
      (sum, r) => sum + parseFloat(r.totalAmount.toString()), 0,
    );

    return {
      totalRegistrations: registrations.length,
      totalExpected,
      totalCollected,
      outstanding: totalExpected - totalCollected,
    };
  }
}
