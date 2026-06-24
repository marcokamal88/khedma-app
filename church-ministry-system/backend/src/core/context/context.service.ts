import { Injectable } from '@nestjs/common';

export interface ActiveContext {
  role: string;
  serviceId?: string;
  classId?: string;
}

@Injectable()
export class ContextService {
  private contextStorage = new Map<string, ActiveContext>();

  setContext(userId: string, context: ActiveContext) {
    this.contextStorage.set(userId, context);
  }

  getContext(userId: string): ActiveContext | undefined {
    return this.contextStorage.get(userId);
  }

  clearContext(userId: string) {
    this.contextStorage.delete(userId);
  }
}
