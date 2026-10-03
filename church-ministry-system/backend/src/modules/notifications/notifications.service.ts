import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Notification } from './entities/notification.entity';
import { FcmToken } from './entities/fcm-token.entity';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectModel(Notification) private notifModel: typeof Notification,
    @InjectModel(FcmToken) private fcmTokenModel: typeof FcmToken,
  ) {}

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

    await this.sendExpoPush(notification.churchId, notification.churchMemberId, notification.title, notification.body, notification);

    return notif;
  }

  private async sendExpoPush(churchId: string, memberId: string, title: string, body: string, data?: any) {
    try {
      const tokens = await this.fcmTokenModel.findAll({
        where: { churchMemberId: memberId, isActive: true },
      });

      if (tokens.length === 0) return;

      const messages = tokens.map((t) => ({
        to: t.token,
        title,
        body,
        data: data ? { ...data, notificationId: data.sourceId } : undefined,
        priority: 'high' as const,
        channelId: 'default',
      }));

      const chunks: typeof messages[] = [];
      for (let i = 0; i < messages.length; i += 100) {
        chunks.push(messages.slice(i, i + 100));
      }

      for (const chunk of chunks) {
        const response = await fetch(EXPO_PUSH_URL, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Accept-encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(chunk),
        });

        const result = await response.json();

        if (result.data) {
          for (let i = 0; i < result.data.length; i++) {
            const receipt = result.data[i];
            const token = chunk[i].to;
            if (receipt.status === 'error') {
              this.logger.warn(`Expo push error for token ${token}: ${receipt.message} (${receipt.details?.error})`);
              if (receipt.details?.error === 'DeviceNotRegistered' || receipt.details?.error === 'InvalidCredentials') {
                await this.fcmTokenModel.update(
                  { isActive: false } as any,
                  { where: { token } },
                );
                this.logger.log(`Deactivated dead token: ${token}`);
              }
            }
          }
        }
        this.logger.log(`Expo push sent: ${chunk.length} messages`);
      }
    } catch (err) {
      this.logger.warn(`Expo push send failed: ${err.message}`);
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
