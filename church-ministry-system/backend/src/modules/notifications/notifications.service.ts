import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Notification } from './entities/notification.entity';
import { FcmToken } from './entities/fcm-token.entity';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private fcmAvailable = false;

  constructor(
    @InjectModel(Notification) private notifModel: typeof Notification,
    @InjectModel(FcmToken) private fcmTokenModel: typeof FcmToken,
  ) {
    this.initFcm();
  }

  private initFcm() {
    try {
      const admin = require('firebase-admin');
      if (admin.apps.length === 0) {
        const serviceAccount = process.env.FCM_SERVICE_ACCOUNT;
        if (serviceAccount) {
          admin.initializeApp({
            credential: admin.credential.cert(JSON.parse(serviceAccount)),
          });
          this.fcmAvailable = true;
          this.logger.log('Firebase initialized');
        } else {
          this.logger.warn('FCM_SERVICE_ACCOUNT not set — push disabled');
        }
      } else {
        this.fcmAvailable = true;
      }
    } catch {
      this.logger.warn('firebase-admin not installed — push disabled');
    }
  }

  async registerDevice(churchId: string, memberId: string, token: string, deviceType: string) {
    const [record] = await this.fcmTokenModel.findOrCreate({
      where: { churchMemberId: memberId, token },
      defaults: { churchId, churchMemberId: memberId, token, deviceType } as any,
    });
    if (!record.isActive) {
      await record.update({ isActive: true } as any);
    }
    return record;
  }

  async unregisterDevice(memberId: string, token: string) {
    await this.fcmTokenModel.update(
      { isActive: false } as any,
      { where: { churchMemberId: memberId, token } },
    );
  }

  async send(notification: {
    churchId: string;
    churchMemberId: string;
    title: string;
    body: string;
    type: string;
    sourceType?: string;
    sourceId?: string;
  }) {
    const notif = await this.notifModel.create(notification as any);

    if (this.fcmAvailable) {
      await this.sendPush(notification.churchId, notification.churchMemberId, notification.title, notification.body);
    }

    return notif;
  }

  private async sendPush(churchId: string, memberId: string, title: string, body: string) {
    try {
      const tokens = await this.fcmTokenModel.findAll({
        where: { churchMemberId: memberId, isActive: true },
      });

      if (tokens.length === 0) return;

      const admin = require('firebase-admin');
      const results = await admin.messaging().sendEachForMulticast({
        tokens: tokens.map((t) => t.token),
        notification: { title, body },
      });

      this.logger.log(`Push sent: ${results.successCount} success, ${results.failureCount} failed`);
    } catch (err) {
      this.logger.warn(`Push send failed: ${err.message}`);
    }
  }

  async getNotifications(churchId: string, memberId: string) {
    return this.notifModel.findAll({
      where: { churchId, churchMemberId: memberId },
      order: [['sentAt', 'DESC']],
      limit: 50,
    });
  }

  async markAsRead(churchId: string, notificationId: string, memberId: string) {
    await this.notifModel.update(
      { isRead: true, readAt: new Date() } as any,
      { where: { id: notificationId, churchId, churchMemberId: memberId } },
    );
    return { success: true };
  }

  async markAllAsRead(churchId: string, memberId: string) {
    await this.notifModel.update(
      { isRead: true, readAt: new Date() } as any,
      { where: { churchId, churchMemberId: memberId, isRead: false } },
    );
    return { success: true };
  }

  async getUnreadCount(churchId: string, memberId: string) {
    const count = await this.notifModel.count({
      where: { churchId, churchMemberId: memberId, isRead: false },
    });
    return { unreadCount: count };
  }
}
